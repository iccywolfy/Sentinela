import { IConnector, CollectedItem } from './connector.factory';
import Parser from 'rss-parser';

const parser = new Parser();

export class RssConnector implements IConnector {
  async collect(source: any): Promise<CollectedItem[]> {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 50).map((item) => ({
      url: item.link || item.guid,
      title: item.title,
      content: item.contentSnippet || item.content || item.summary || '',
      publishedAt: item.pubDate || item.isoDate,
      metadata: {
        feedTitle: feed.title,
        feedUrl: source.url,
        author: item.creator || item.author,
        categories: item.categories,
      },
    }));
  }
}
