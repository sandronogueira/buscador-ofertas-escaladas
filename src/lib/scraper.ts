import { chromium } from 'playwright';

export const NICHES: Record<string, string[]> = {
  emagrecimento: ['emagrecer', 'perder peso', 'dieta', 'gordura', 'metabolismo'],
  dinheiro: ['renda extra', 'ganhar dinheiro', 'trabalho em casa', 'afiliado'],
  crypto: ['bitcoin', 'criptomoeda', 'investimento', 'trader', 'forex'],
  suplementos: ['whey', 'creatina', 'vitamina', 'colágeno', 'suplemento'],
  beleza: ['skincare', 'rejuvenescimento', 'rugas', 'cabelo', 'estética'],
  educacao: ['curso online', 'certificado', 'aprender', 'inglês', 'concurso'],
  ecommerce: ['dropshipping', 'loja virtual', 'shopify', 'importação'],
  relacionamento: ['conquistar', 'sedução', 'atrair mulheres', 'relacionamento', 'namoro', 'reconquistar'],
};

export function calculateScore(
  adsActive: number,
  daysActive: number,
  adsTotal: number
): number {
  const adsScore = Math.min(((adsActive - 70) / 230) * 100, 100) * 0.4;
  const daysScore = Math.min(((daysActive - 90) / 275) * 100, 100) * 0.35;
  const volumeScore = Math.min((adsTotal / 500) * 100, 100) * 0.25;
  return Math.round(Math.max(0, adsScore + daysScore + volumeScore));
}

interface ScrapedAdvertiser {
  pageId: string;
  pageName: string;
  pageUrl: string;
  adsActive: number;
  adsTotal: number;
  daysActive: number;
  firstAdDate?: Date;
}

/** Convert "Xh", "X dias", "X semanas", "X meses", "X anos" to days */
function parseDurationToDays(text: string): number {
  const lc = text.toLowerCase().trim();
  const numMatch = lc.match(/(\d+)/);
  if (!numMatch) return 0;
  const n = parseInt(numMatch[1], 10);
  if (lc.includes('ano')) return n * 365;
  if (lc.includes('mes') || lc.includes('mês')) return n * 30;
  if (lc.includes('semana')) return n * 7;
  if (lc.includes('h') && !lc.includes('dia')) return 0; // horas → 0 dias (muito novo)
  return n; // dias
}

/** Parse Portuguese date text to JS Date */
function parsePortugueseDate(text: string): Date | null {
  const ptMonths: Record<string, string> = {
    janeiro: 'January', fevereiro: 'February', março: 'March', abril: 'April',
    maio: 'May', junho: 'June', julho: 'July', agosto: 'August',
    setembro: 'September', outubro: 'October', novembro: 'November', dezembro: 'December',
    jan: 'Jan', fev: 'Feb', mar: 'Mar', abr: 'Apr', mai: 'May', jun: 'Jun',
    jul: 'Jul', ago: 'Aug', set: 'Sep', out: 'Oct', nov: 'Nov', dez: 'Dec',
  };

  let normalized = text.toLowerCase().replace(/ de /g, ' ');
  for (const [pt, en] of Object.entries(ptMonths)) {
    normalized = normalized.replace(new RegExp(`\\b${pt}\\b`, 'g'), en);
  }

  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export async function scrapeAdsLibrary(
  niche: string,
  keywords: string[]
): Promise<ScrapedAdvertiser[]> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
    ],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'pt-BR',
  });
  const page = await context.newPage();

  // Map of pageId → aggregated data
  const advertiserMap = new Map<string, {
    pageName: string;
    pageUrl: string;
    adsCount: number;
    maxDaysActiveText: string;
    oldestDateText: string;
  }>();

  try {
    for (const keyword of keywords) {
      const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=${encodeURIComponent(keyword)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped`;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);

      // Scroll deep to load many results (need lots of ads to find 70+ per advertiser)
      for (let i = 0; i < 50; i++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(1500);

      // Extract all ad cards by using <strong> with "anúncio" as anchor
      const adCards = await page.evaluate(() => {
        const results: Array<{
          pageName: string;
          pageId: string;
          pageUrl: string;
          creativeAdsCount: number; // "N anúncios usam esse criativo"
          durationText: string;     // "Tempo total ativo: X dias"
          dateText: string;         // "Veiculação iniciada em X de Y de Z"
        }> = [];

        // Find all <strong> elements that mention "anúncio(s)"
        const anuncioStrongs = Array.from(document.querySelectorAll('strong')).filter(
          (el) => /anúncio/i.test(el.textContent || '')
        );

        for (const strong of anuncioStrongs) {
          // Parse "N anúncios usam esse criativo e esse texto"
          const countMatch = (strong.textContent || '').match(/(\d+)/);
          const creativeAdsCount = countMatch ? parseInt(countMatch[1], 10) : 1;

          // Walk UP the DOM to find a container with a Facebook page link
          let cardEl: Element | null = strong;
          let fbLink: HTMLAnchorElement | null = null;

          for (let i = 0; i < 20; i++) {
            cardEl = cardEl?.parentElement || null;
            if (!cardEl) break;

            const links = Array.from((cardEl as HTMLElement).querySelectorAll('a[href]')) as HTMLAnchorElement[];
            const found = links.find((a) => {
              const href = a.href || '';
              return (
                href.includes('facebook.com') &&
                !href.includes('l.facebook.com') &&
                !href.includes('/ads/library') &&
                !href.includes('facebook.com/ads') &&
                (a.textContent?.trim() || '').length > 1
              );
            });

            if (found) {
              fbLink = found;
              break;
            }
          }

          if (!fbLink || !cardEl) continue;

          const pageUrl = fbLink.href;
          // Extract page ID from URL: /100094909369389/ or ?id=123
          const pageIdMatch = pageUrl.match(/facebook\.com\/(\d{8,})/) || pageUrl.match(/[?&]id=(\d+)/);
          const pageId = pageIdMatch ? pageIdMatch[1] : '';
          const pageName = fbLink.textContent?.trim() || '';

          if (!pageId || !pageName || pageName.length < 2) continue;

          const cardText = (cardEl as HTMLElement).innerText || '';

          // "Tempo total ativo: X dias/semanas/meses/anos/h"
          const durationMatch = cardText.match(/[Tt]empo total ativo[:\s·]+([^\n|·]+)/);
          const durationText = durationMatch ? durationMatch[1].trim() : '';

          // "Veiculação iniciada em 15 de mar de 2026"
          const dateMatch = cardText.match(/[Vv]eiculação iniciada em ([^\n|·]+)/);
          const dateText = dateMatch ? dateMatch[1].trim() : '';

          results.push({ pageName, pageId, pageUrl, creativeAdsCount, durationText, dateText });
        }

        return results;
      });

      // Aggregate by pageId
      for (const card of adCards) {
        const existing = advertiserMap.get(card.pageId);
        if (existing) {
          existing.adsCount += card.creativeAdsCount;
          // Keep the longest duration text
          const existingDays = parseDurationToDays(existing.maxDaysActiveText);
          const newDays = parseDurationToDays(card.durationText);
          if (newDays > existingDays) {
            existing.maxDaysActiveText = card.durationText;
          }
          // Keep the oldest date text (we'll parse later)
          if (card.dateText && !existing.oldestDateText) {
            existing.oldestDateText = card.dateText;
          }
        } else {
          advertiserMap.set(card.pageId, {
            pageName: card.pageName,
            pageUrl: card.pageUrl,
            adsCount: card.creativeAdsCount,
            maxDaysActiveText: card.durationText,
            oldestDateText: card.dateText,
          });
        }
      }

      await page.waitForTimeout(2500);
    }
  } finally {
    await browser.close();
  }

  const results: ScrapedAdvertiser[] = [];

  for (const [pageId, data] of advertiserMap.entries()) {
    // Only include advertisers with 70+ active ads (scaled offers)
    if (data.adsCount < 70) continue;

    let daysActive = parseDurationToDays(data.maxDaysActiveText);
    let firstAdDate: Date | undefined;

    // Fallback to parsing the date text
    if (daysActive === 0 && data.oldestDateText) {
      const parsed = parsePortugueseDate(data.oldestDateText);
      if (parsed) {
        firstAdDate = parsed;
        daysActive = Math.ceil((Date.now() - parsed.getTime()) / 86400000);
      }
    }

    if (daysActive === 0) daysActive = 1;

    // Link to the advertiser's Ad Library page (not Facebook profile)
    const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=${pageId}`;

    results.push({
      pageId,
      pageName: data.pageName,
      pageUrl: adLibraryUrl,
      adsActive: data.adsCount,
      adsTotal: data.adsCount,
      daysActive,
      firstAdDate,
    });
  }

  // Sort by adsActive desc
  results.sort((a, b) => b.adsActive - a.adsActive);

  return results;
}
