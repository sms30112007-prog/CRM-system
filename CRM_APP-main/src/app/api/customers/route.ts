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

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
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

    const { name, email, phone, company, assignedToId } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        assignedToId: assignedToId || (user.role === 'SALES_EXECUTIVE' ? user.id : null),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        description: `Customer profile created by ${user.name}.`,
        customerId: customer.id,
        userId: user.id,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
