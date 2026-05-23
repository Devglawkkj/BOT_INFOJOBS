'use strict';

require('dotenv').config();

const logger         = require('./utils/logger');
const BrowserManager = require('./core/browser/browser');
const AuthManager    = require('./core/auth/auth');

(async () => {
  logger.info('=== InfoJobs Bot | Parte 2 — Login ===');

  const browser = new BrowserManager();

  try {
    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    logger.info('[OK] Aguardando 5s...');
    await page.waitForTimeout(5000);

  } catch (err) {
    logger.error(`[FALHA] ${err.message}`);
    await new Promise(r => setTimeout(r, 15000));

  } finally {
    await browser.close();
  }
})();