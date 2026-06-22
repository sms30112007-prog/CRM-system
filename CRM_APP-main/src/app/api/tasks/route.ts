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

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
        customer: {
          select: { id: true, name: true, company: true },
        },
        lead: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(tasks);
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

    const { title, description, dueDate, status, customerId, leadId, assignedToId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
        customerId: customerId || null,
        leadId: leadId || null,
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
        type: 'TASK',
        description: `Task scheduled: "${task.title}" (Due: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'None'}) by ${user.name}.`,
        customerId: customerId || null,
        leadId: leadId || null,
        userId: user.id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
