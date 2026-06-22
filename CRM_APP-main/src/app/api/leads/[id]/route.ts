import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && lead.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && lead.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStatus = lead.status;
    const newStatus = body.status;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        status: newStatus,
        revenue: body.revenue ? parseFloat(body.revenue) : lead.revenue,
        assignedToId: user.role === 'SALES_EXECUTIVE' ? lead.assignedToId : body.assignedToId,
      },
    });

    // Handle Conversion logic: Lead status changed to "CONVERTED"
    if (oldStatus !== 'CONVERTED' && newStatus === 'CONVERTED') {
      // 1. Check if customer already exists for this email
      let customer = await prisma.customer.findFirst({
        where: { email: updated.email },
      });

      if (!customer) {
        // 2. Create customer
        customer = await prisma.customer.create({
          data: {
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            company: updated.company,
            assignedToId: updated.assignedToId,
          },
        });
      }

      // 3. Create a deal linked to the customer and lead
      await prisma.deal.create({
        data: {
          title: `${updated.company || updated.name} - Deal`,
          value: updated.revenue || 0.0,
          stage: 'PROSPECT',
          leadId: updated.id,
          customerId: customer.id,
          assignedToId: updated.assignedToId,
        },
      });

      // 4. Log conversion activity
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          description: `Lead converted to customer (${customer.name}) and new deal created by ${user.name}.`,
          leadId: updated.id,
          customerId: customer.id,
          userId: user.id,
        },
      });
    } else if (oldStatus !== newStatus) {
      // Just log status change
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          description: `Lead status updated from ${oldStatus} to ${newStatus} by ${user.name}.`,
          leadId: updated.id,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'SALES_EXECUTIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
