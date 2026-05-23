'use strict';

const { chromium } = require('playwright');
const path   = require('path');
const logger = require('../../utils/logger');
const config = require('../../utils/config');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

class BrowserManager {
  constructor() {
    this.browser   = null;
    this.context   = null;
    this.userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    this.sessionPath = path.join(config.storage.cookies, 'session');
  }

  async start() {
    logger.info('[Browser] Iniciando...');

    this.context = await chromium.launchPersistentContext(this.sessionPath, {
      headless:  config.browser.headless,
      userAgent: this.userAgent,
      viewport:  { width: 1366, height: 768 },
      locale:    'pt-BR',
      timezoneId: 'America/Fortaleza',
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });

    // Esconde que é bot
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    logger.info(`[Browser] OK | UA: ${this.userAgent}`);
    return this.context;
  }

  async newPage() {
    if (!this.context) throw new Error('Browser não iniciado. Chame start() primeiro.');

    const page = await this.context.newPage();
    page.setDefaultTimeout(config.browser.timeout);
    page.setDefaultNavigationTimeout(config.browser.navTimeout);

    page.on('pageerror',     (e) => logger.warn(`[Page Error] ${e.message}`));
    page.on('requestfailed', (r) => logger.debug(`[Req Failed] ${r.url()}`));

    logger.debug('[Browser] Nova página criada');
    return page;
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      logger.info('[Browser] Encerrado');
    }
  }
}

module.exports = BrowserManager;