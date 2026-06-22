import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && deal.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStage = deal.stage;
    const newStage = body.stage;

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : deal.title,
        value: body.value !== undefined ? parseFloat(body.value) : deal.value,
        stage: newStage !== undefined ? newStage : deal.stage,
        assignedToId: user.role === 'SALES_EXECUTIVE' ? deal.assignedToId : (body.assignedToId !== undefined ? body.assignedToId : deal.assignedToId),
      },
    });

    // Handle WON stage payment creation
    if (oldStage !== 'WON' && newStage === 'WON') {
      // Create a mock completed payment for dashboard stats
      await prisma.payment.create({
        data: {
          amount: updated.value,
          status: 'COMPLETED',
          dealId: updated.id,
          customerId: updated.customerId || null,
        },
      });

      // Log success activity
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          description: `Deal "${updated.title}" marked as WON. Mock payment created for $${updated.value} by ${user.name}.`,
          customerId: updated.customerId || null,
          leadId: updated.leadId || null,
          userId: user.id,
        },
      });
    } else if (oldStage !== newStage) {
      // Just log stage update
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          description: `Deal "${updated.title}" stage changed from ${oldStage} to ${newStage} by ${user.name}.`,
          customerId: updated.customerId || null,
          leadId: updated.leadId || null,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Deal update error:', error);
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

    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
