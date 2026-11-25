import * as cheerio from 'cheerio';
import { AppError } from '../utils/app-error';
import { assertPublicUrl } from './network-safety.service';

export interface CrawledPage {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
}

export interface CrawlResult {
  rootUrl: string;
  pages: CrawledPage[];
  crawledAt: string;
  warnings: string[];
}

async function fetchSafely(input: URL, limit = 4): Promise<Response> {
  let current = input;
  for (let redirect = 0; redirect <= limit; redirect += 1) {
    await assertPublicUrl(current.toString());
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'CaseStudyTool/1.0 (+educational analysis)' },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) break;
      current = new URL(location, current);
      continue;
    }
    return response;
  }
  throw new Error('Too many redirects');
}

export async function crawlWebsite(rawUrl: string, maxPages = 6): Promise<CrawlResult> {
  let root: URL;
  try {
    root = await assertPublicUrl(rawUrl);
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Invalid website URL', {
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  const warnings: string[] = [];
  const queue: URL[] = [root];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  try {
    const robotsUrl = new URL('/robots.txt', root);
    await assertPublicUrl(robotsUrl.toString());
    const robotsResponse = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
    if (robotsResponse.ok) {
      const robots = await robotsResponse.text();
      const agentRules = robots.split(/\n\s*\n/).find((block) => /User-agent:\s*\*/i.test(block));
      if (agentRules && /^Disallow:\s*\/\s*$/im.test(agentRules)) {
        throw new AppError('The website disallows crawling through robots.txt', { statusCode: 403, code: 'FORBIDDEN' });
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    warnings.push('robots.txt could not be verified');
  }

  while (queue.length > 0 && pages.length < Math.min(maxPages, 10)) {
    const url = queue.shift() as URL;
    if (visited.has(url.href)) continue;
    visited.add(url.href);

    try {
      const response = await fetchSafely(url);
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('text/html')) {
        warnings.push(`Skipped ${url.href}: HTTP ${response.status} or unsupported content type`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      $('script, style, noscript, svg, nav, footer').remove();

      const title = $('title').first().text().trim() || $('h1').first().text().trim();
      const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
      const headings = $('h1, h2, h3').map((_index, element) => $(element).text().trim()).get().filter(Boolean).slice(0, 30);
      const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20_000);
      const links: string[] = [];

      $('a[href]').each((_index, element) => {
        const href = $(element).attr('href');
        if (!href) return;
        try {
          const link = new URL(href, response.url || url);
          if (link.origin === root.origin && !visited.has(link.href)) {
            link.hash = '';
            links.push(link.href);
            if (queue.length + pages.length < maxPages) queue.push(link);
          }
        } catch {
          // Ignore malformed links.
        }
      });

      pages.push({ url: url.href, title, description, headings, text, links: [...new Set(links)].slice(0, 50) });
    } catch (error) {
      warnings.push(`Could not crawl ${url.href}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { rootUrl: root.href, pages, crawledAt: new Date().toISOString(), warnings };
}
