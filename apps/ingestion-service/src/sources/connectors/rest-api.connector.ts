import { IConnector, CollectedItem } from './connector.factory';
import axios from 'axios';

export class RestApiConnector implements IConnector {
  async collect(source: any): Promise<CollectedItem[]> {
    const config = source.configJson || {};
    const headers: Record<string, string> = config['headers'] || {};

    if (config['authType'] === 'api_key' && config['authToken']) {
      headers['Authorization'] = `ApiKey ${config['authToken']}`;
    } else if (config['authType'] === 'bearer' && config['authToken']) {
      headers['Authorization'] = `Bearer ${config['authToken']}`;
    }

    const response = await axios.get(source.url, { headers, timeout: config['timeout'] || 30000 });
    const data = response.data;

    if (Array.isArray(data)) {
      return data.slice(0, 100).map((item: any) => ({
        url: item.url || item.link || item.id,
        title: item.title || item.headline,
        content: item.content || item.body || item.description || JSON.stringify(item),
        publishedAt: item.publishedAt || item.date || item.created_at,
        metadata: { source: source.url },
      }));
    }

    return [{
      url: source.url,
      title: source.name,
      content: JSON.stringify(data),
      metadata: { source: source.url },
    }];
  }
}
