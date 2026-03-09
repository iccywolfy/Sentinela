import { Injectable } from '@nestjs/common';
import { RssConnector } from './rss.connector';
import { RestApiConnector } from './rest-api.connector';
import { WebCrawlerConnector } from './web-crawler.connector';

export interface IConnector {
  collect(source: any): Promise<CollectedItem[]>;
}

export interface CollectedItem {
  url?: string;
  title?: string;
  content: string;
  language?: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ConnectorFactory {
  create(method: string): IConnector {
    switch (method) {
      case 'rss_atom':
        return new RssConnector();
      case 'rest_api':
        return new RestApiConnector();
      case 'web_crawler':
        return new WebCrawlerConnector();
      default:
        return new RssConnector();
    }
  }
}
