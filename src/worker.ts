import { prisma } from './lib/prisma';
import { scrapeAdsLibrary, calculateScore, NICHES } from './lib/scraper';

async function processNextJob() {
  // Find the oldest pending job
  const job = await prisma.scrapeLog.findFirst({
    where: { status: 'pending' },
    orderBy: { startedAt: 'asc' },
  });

  if (!job) {
    return false; // No jobs found
  }

  console.log(`[Worker] Started processing job ${job.id} for niche: ${job.niche}`);

  // Mark as running
  await prisma.scrapeLog.update({
    where: { id: job.id },
    data: { status: 'running' },
  });

  try {
    const keywords = NICHES[job.niche] || [job.niche];
    const results = await scrapeAdsLibrary(job.niche, keywords);

    let scaledFound = 0;

    for (const result of results) {
      const score = calculateScore(result.adsActive, result.daysActive, result.adsTotal);
      const isScaled = result.adsActive >= 70 && result.daysActive >= 90;

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

    // Mark as completed
    await prisma.scrapeLog.update({
      where: { id: job.id },
      data: {
        advertisersFound: results.length,
        scaledFound,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    console.log(`[Worker] Completed job ${job.id}. Found ${results.length} advertisers (${scaledFound} scaled).`);
    return true;
  } catch (error) {
    console.error(`[Worker] Error processing job ${job.id}:`, error);
    
    // Mark as error
    await prisma.scrapeLog.update({
      where: { id: job.id },
      data: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    
    return true; // Return true because a job was processed (even if it failed), so we can check for another
  }
}

async function startWorker() {
  console.log('[Worker] Started DB Polling Queue Worker');
  
  while (true) {
    try {
      const processedJob = await processNextJob();
      
      // If no jobs were found, sleep for 5 seconds to prevent DB spam
      if (!processedJob) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        // Just a tiny sleep between jobs to breathe
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error('[Worker] Fatal error in polling loop', err);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // sleep longer on fatal error
    }
  }
}

// Start the worker
startWorker();
