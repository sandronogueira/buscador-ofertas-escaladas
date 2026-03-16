import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const niche = searchParams.get('niche');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = 20;

  const where: {
    isScaled: boolean;
    niche?: string;
    pageName?: { contains: string; mode: 'insensitive' };
  } = {} as { isScaled?: boolean; niche?: string; pageName?: { contains: string; mode: 'insensitive' } };

  if (niche && niche !== 'all') where.niche = niche;
  if (search) where.pageName = { contains: search, mode: 'insensitive' };

  const [offers, total] = await Promise.all([
    prisma.advertiser.findMany({
      where,
      orderBy: { score: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.advertiser.count({ where }),
  ]);

  return NextResponse.json({ offers, total, page, limit });
}
