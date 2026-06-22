import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, description, customerId, leadId } = await request.json();

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and Description are required' }, { status: 400 });
    }

    if (!['CALL', 'EMAIL', 'MEETING', 'NOTE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        customerId: customerId || null,
        leadId: leadId || null,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
