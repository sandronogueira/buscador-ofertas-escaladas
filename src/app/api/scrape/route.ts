import { NextResponse } from 'next/server';
import { scrapeAdsLibrary, calculateScore, NICHES } from '@/lib/scraper';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { niche } = await req.json();

  const log = await prisma.scrapeLog.create({
    data: {
      niche,
      status: 'pending', // Mark as pending for the worker
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: 'Scraping job queued successfully',
    jobId: log.id 
  }, { status: 202 });
}
