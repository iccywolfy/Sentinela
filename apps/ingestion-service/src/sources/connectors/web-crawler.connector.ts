import { IConnector, CollectedItem } from './connector.factory';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebCrawlerConnector implements IConnector {
  async collect(source: any): Promise<CollectedItem[]> {
    const config = source.configJson || {};
    const response = await axios.get(source.url, {
      timeout: config['timeout'] || 30000,
      headers: { 'User-Agent': 'SENTINELA-Crawler/1.0' },
    });

    const $ = cheerio.load(response.data);
    const selector = config['cssSelector'] || 'article, .article, .post, .news-item';

    const items: CollectedItem[] = [];
    $(selector).each((_, el) => {
      const title = $(el).find('h1, h2, h3').first().text().trim();
      const content = $(el).text().trim();
      const link = $(el).find('a').first().attr('href');

      if (content.length > 50) {
        items.push({
          url: link ? new URL(link, source.url).href : source.url,
          title: title || undefined,
          content,
          metadata: { crawledUrl: source.url },
        });
      }
    });

    if (items.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      if (bodyText) {
        items.push({
          url: source.url,
          title: $('title').text().trim() || undefined,
          content: bodyText.slice(0, 10000),
          metadata: { crawledUrl: source.url },
        });
      }
    }

    return items.slice(0, 20);
  }
}
