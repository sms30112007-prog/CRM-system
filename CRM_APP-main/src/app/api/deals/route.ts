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

    const deals = await prisma.deal.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        lead: {
          select: { id: true, name: true, company: true },
        },
        customer: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deals);
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

    const { title, value, stage, leadId, customerId, assignedToId } = await request.json();

    if (!title || value === undefined) {
      return NextResponse.json({ error: 'Title and Value are required' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: parseFloat(value),
        stage: stage || 'PROSPECT',
        leadId: leadId || null,
        customerId: customerId || null,
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
        description: `Deal "${deal.title}" created with value $${deal.value} in stage ${deal.stage} by ${user.name}.`,
        customerId: customerId || null,
        leadId: leadId || null,
        userId: user.id,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
