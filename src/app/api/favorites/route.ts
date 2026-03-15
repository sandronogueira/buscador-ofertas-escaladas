import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const favorites = await prisma.favorite.findMany({
    include: { advertiser: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(favorites);
}

export async function POST(req: Request) {
  const { advertiserId, notes } = await req.json();

  const favorite = await prisma.favorite.upsert({
    where: { advertiserId },
    update: { notes },
    create: { advertiserId, notes },
    include: { advertiser: true },
  });

  return NextResponse.json(favorite);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const advertiserId = searchParams.get('advertiserId');

  if (!advertiserId) {
    return NextResponse.json({ error: 'advertiserId required' }, { status: 400 });
  }

  await prisma.favorite.delete({ where: { advertiserId } });
  return NextResponse.json({ success: true });
}
