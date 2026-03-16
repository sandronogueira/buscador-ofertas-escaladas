import { prisma } from './src/lib/prisma';
import { scrapeAdsLibrary, calculateScore, NICHES } from './src/lib/scraper';

async function seedNiche(niche: string, keywords: string[]) {
  console.log(`\n⚡ Minerando: ${niche} (${keywords.length} keywords)...`);
  const start = Date.now();

  try {
    const results = await scrapeAdsLibrary(niche, keywords);
    let scaledFound = 0;

    for (const r of results) {
      const score = calculateScore(r.adsActive, r.daysActive, r.adsTotal);
      const isScaled = r.adsActive >= 10 && r.daysActive >= 7;
      if (isScaled) scaledFound++;

      await prisma.advertiser.upsert({
        where: { pageId: r.pageId },
        update: {
          adsActive: r.adsActive,
          adsTotal: r.adsTotal,
          daysActive: r.daysActive,
          score,
          isScaled,
          lastScraped: new Date(),
        },
        create: {
          pageId: r.pageId,
          pageName: r.pageName,
          pageUrl: r.pageUrl,
          niche,
          nicheLabel: niche,
          adsActive: r.adsActive,
          adsTotal: r.adsTotal,
          daysActive: r.daysActive,
          firstAdDate: r.firstAdDate,
          score,
          isScaled,
        },
      });
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✅ ${niche}: ${results.length} anunciantes (${scaledFound} escalados) em ${elapsed}s`);
  } catch (e) {
    console.error(`  ❌ ${niche}: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  console.log('🚀 Seed completo — minerando TODOS os nichos...\n');
  const nicheEntries = Object.entries(NICHES);

  for (const [niche, keywords] of nicheEntries) {
    await seedNiche(niche, keywords);
  }

  const total = await prisma.advertiser.count();
  const scaled = await prisma.advertiser.count({ where: { isScaled: true } });
  console.log(`\n📊 Total no banco: ${total} anunciantes (${scaled} escalados)`);
  console.log('✅ Seed completo. App vai mostrar dados reais agora.');
  process.exit(0);
}

main();
