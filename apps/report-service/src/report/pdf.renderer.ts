import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; color: #1a1a2e; background: white; }
  .cover { background: {{primaryColor}}; color: white; padding: 60px 40px; min-height: 200px; }
  .cover h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
  .cover .meta { font-size: 12px; opacity: 0.8; margin-top: 16px; }
  .classification-banner { background: {{secondaryColor}}; color: #000; text-align: center; padding: 6px; font-weight: bold; font-size: 11px; letter-spacing: 2px; }
  .content { padding: 40px; }
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section h2 { font-size: 18px; color: {{primaryColor}}; border-bottom: 2px solid {{secondaryColor}}; padding-bottom: 6px; margin-bottom: 14px; }
  .section p, .section pre { font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-wrap: break-word; }
  .metadata { background: #f5f5f5; border-left: 4px solid {{secondaryColor}}; padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: #666; }
  .footer { border-top: 1px solid #ddd; padding: 12px 40px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="classification-banner">{{classification}} — FOR AUTHORIZED USE ONLY</div>
<div class="cover">
  <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">{{organizationName}}</div>
  <h1>{{title}}</h1>
  <div class="meta">Generated: {{generatedAt}} | Events analyzed: {{eventCount}} | Methodology: OSINT Fusion</div>
</div>
<div class="content">
  <div class="metadata">
    <strong>Report Type:</strong> {{type}} &nbsp;|&nbsp;
    <strong>Classification:</strong> {{classification}} &nbsp;|&nbsp;
    <strong>Period:</strong> {{period}}
  </div>
  {{#each sections}}
  <div class="section">
    <h2>{{this.title}}</h2>
    <pre>{{this.content}}</pre>
  </div>
  {{/each}}
</div>
<div class="footer">
  <span>{{organizationName}} — SENTINELA Intelligence Platform</span>
  <span>{{generatedAt}}</span>
</div>
</body>
</html>`;

@Injectable()
export class PdfRenderer {
  private readonly logger = new Logger(PdfRenderer.name);
  private template: HandlebarsTemplateDelegate;

  constructor() {
    this.template = Handlebars.compile(HTML_TEMPLATE);
  }

  async renderHtml(report: any, branding: any): Promise<string> {
    return this.template({
      title: report.title,
      classification: report.classification?.toUpperCase() || 'INTERNAL',
      organizationName: branding?.organizationName || 'SENTINELA',
      primaryColor: branding?.primaryColor || '#1a1f36',
      secondaryColor: branding?.secondaryColor || '#c9a227',
      type: report.metadata?.type || 'report',
      period: report.metadata?.period || 'Recent period',
      eventCount: report.metadata?.eventCount || 0,
      generatedAt: new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
      sections: report.sections || [],
    });
  }

  async renderPdf(html: string): Promise<Buffer> {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      await browser.close();
      return Buffer.from(pdf);
    } catch (err) {
      this.logger.warn(`Puppeteer PDF rendering failed, returning HTML: ${err.message}`);
      return Buffer.from(html, 'utf-8');
    }
  }
}
