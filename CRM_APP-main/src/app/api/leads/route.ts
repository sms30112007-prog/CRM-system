import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause: any = {};
    if (user.role === 'SALES_EXECUTIVE') {
      whereClause.assignedToId = user.id;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, company, status, revenue, assignedToId } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        status: status || 'NEW',
        revenue: revenue ? parseFloat(revenue) : 0,
        assignedToId: assignedToId || (user.role === 'SALES_EXECUTIVE' ? user.id : null),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        description: `Lead created with status: ${lead.status} by ${user.name}.`,
        leadId: lead.id,
        userId: user.id,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
