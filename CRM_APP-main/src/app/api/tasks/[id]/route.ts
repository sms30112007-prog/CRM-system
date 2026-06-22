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

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && task.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStatus = task.status;
    const newStatus = body.status;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : task.title,
        description: body.description !== undefined ? body.description : task.description,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : task.dueDate,
        status: newStatus !== undefined ? newStatus : task.status,
        assignedToId: user.role === 'SALES_EXECUTIVE' ? task.assignedToId : (body.assignedToId !== undefined ? body.assignedToId : task.assignedToId),
      },
    });

    // Log Activity if task completed
    if (oldStatus !== 'COMPLETED' && newStatus === 'COMPLETED') {
      await prisma.activity.create({
        data: {
          type: 'TASK',
          description: `Task completed: "${updated.title}" by ${user.name}.`,
          customerId: updated.customerId || null,
          leadId: updated.leadId || null,
          userId: user.id,
        },
      });
    } else if (oldStatus !== newStatus) {
      await prisma.activity.create({
        data: {
          type: 'TASK',
          description: `Task "${updated.title}" status changed from ${oldStatus} to ${newStatus} by ${user.name}.`,
          customerId: updated.customerId || null,
          leadId: updated.leadId || null,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && task.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
