import { IConnector, CollectedItem } from './connector.factory';
import { BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { URL } from 'url';

const logger = new Logger('RestApiConnector');

/** Private IPv4 CIDR ranges — block to prevent SSRF */
const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // RFC 1918
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // RFC 1918
  /^192\.168\./, // RFC 1918
  /^169\.254\./, // link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 unique local
  /^fd[0-9a-f]{2}:/i, // IPv6 unique local
  /^0\./, // null route
  /^metadata\./, // cloud metadata
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP/Azure metadata
  '100.100.100.200', // Alibaba metadata
]);

const MAX_TIMEOUT_MS = 30_000;
const MAX_ITEMS = 100;

function validateUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException(`Invalid URL: ${rawUrl}`);
  }

  // Only allow https (and http for explicit internal dev flag)
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new BadRequestException(`Disallowed URL scheme: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new BadRequestException(`SSRF: blocked hostname ${hostname}`);
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new BadRequestException(`SSRF: private/reserved address ${hostname}`);
    }
  }

  return parsed;
}

export class RestApiConnector implements IConnector {
  async collect(source: any): Promise<CollectedItem[]> {
    const config = source.configJson || {};

    // Validate and sanitize URL
    const validated = validateUrl(source.url);

    // Build headers — strip dangerous header names
    const FORBIDDEN_HEADERS = new Set(['host', 'content-length', 'transfer-encoding']);
    const rawHeaders: Record<string, string> = config['headers'] || {};
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (!FORBIDDEN_HEADERS.has(k.toLowerCase())) {
        headers[k] = String(v);
      }
    }

    // Auth tokens should come from the connector config, not user input
    if (config['authType'] === 'api_key' && config['authToken']) {
      headers['Authorization'] = `ApiKey ${config['authToken']}`;
    } else if (config['authType'] === 'bearer' && config['authToken']) {
      headers['Authorization'] = `Bearer ${config['authToken']}`;
    }

    // Cap timeout to prevent resource exhaustion
    const timeout = Math.min(Number(config['timeout']) || 15_000, MAX_TIMEOUT_MS);

    const axiosConfig: AxiosRequestConfig = {
      headers,
      timeout,
      maxRedirects: 3,
      // Prevent following redirects to private IPs
      beforeRedirect: (_options: any, { href }: { href: string }) => {
        validateUrl(href); // throws if redirect target is blocked
      },
      responseType: 'json',
      maxContentLength: 10 * 1024 * 1024, // 10 MB max response
    };

    logger.debug(`Fetching: ${validated.href}`);
    const response = await axios.get(validated.href, axiosConfig);
    const data = response.data;

    if (Array.isArray(data)) {
      return data.slice(0, MAX_ITEMS).map((item: any) => ({
        url: item.url || item.link || item.id,
        title: item.title || item.headline,
        content: item.content || item.body || item.description || JSON.stringify(item).slice(0, 50_000),
        publishedAt: item.publishedAt || item.date || item.created_at,
        metadata: { sourceUrl: validated.href },
      }));
    }

    return [{
      url: validated.href,
      title: source.name,
      content: JSON.stringify(data).slice(0, 50_000),
      metadata: { sourceUrl: validated.href },
    }];
  }
}
