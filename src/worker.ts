import { prisma } from './lib/prisma';
import { scrapeAdsLibrary, calculateScore, NICHES } from './lib/scraper';

const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max per job

async function processNextJob() {
  const job = await prisma.scrapeLog.findFirst({
    where: { status: 'pending' },
    orderBy: { startedAt: 'asc' },
  });

  if (!job) return false;

  console.log(`[Worker] Processing job ${job.id} — niche: ${job.niche}`);

  await prisma.scrapeLog.update({
    where: { id: job.id },
    data: { status: 'running' },
  });

  try {
    const keywords = NICHES[job.niche] || [job.niche];

    // Wrap scrape in a timeout so a crashed Playwright doesn't hang forever
    const results = await Promise.race([
      scrapeAdsLibrary(job.niche, keywords),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Scrape timeout after 5 minutes')), JOB_TIMEOUT_MS)
      ),
    ]);

    let scaledFound = 0;

    for (const result of results) {
      const score = calculateScore(result.adsActive, result.daysActive, result.adsTotal);
      const isScaled = result.adsActive >= 10 && result.daysActive >= 7;
      if (isScaled) scaledFound++;

      await prisma.advertiser.upsert({
        where: { pageId: result.pageId },
        update: {
          adsActive: result.adsActive,
          adsTotal: result.adsTotal,
          daysActive: result.daysActive,
          score,
          isScaled,
          lastScraped: new Date(),
        },
        create: {
          pageId: result.pageId,
          pageName: result.pageName,
          pageUrl: result.pageUrl,
          niche: job.niche,
          nicheLabel: job.niche,
          adsActive: result.adsActive,
          adsTotal: result.adsTotal,
          daysActive: result.daysActive,
          firstAdDate: result.firstAdDate,
          score,
          isScaled,
        },
      });
    }

    await prisma.scrapeLog.update({
      where: { id: job.id },
      data: {
        advertisersFound: results.length,
        scaledFound,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    console.log(`[Worker] Done job ${job.id} — ${results.length} advertisers (${scaledFound} scaled)`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Worker] Error job ${job.id}:`, msg);

    await prisma.scrapeLog.update({
      where: { id: job.id },
      data: { status: 'error', error: msg, completedAt: new Date() },
    });

    return true;
  }
}

async function resetStuckJobs() {
  // On startup, mark any "running" jobs as error (they were interrupted by a restart)
  const stuck = await prisma.scrapeLog.updateMany({
    where: { status: 'running' },
    data: { status: 'error', error: 'Worker restarted — job interrupted', completedAt: new Date() },
  });
  if (stuck.count > 0) {
    console.log(`[Worker] Reset ${stuck.count} stuck job(s) from previous run`);
  }
}

async function startWorker() {
  console.log('[Worker] Started');
  await resetStuckJobs();

  while (true) {
    try {
      const processed = await processNextJob();
      await new Promise((resolve) => setTimeout(resolve, processed ? 1000 : 5000));
    } catch (err) {
      console.error('[Worker] Fatal error:', err);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

startWorker();
