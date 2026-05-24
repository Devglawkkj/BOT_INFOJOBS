'use strict';

require('dotenv').config();

const logger         = require('./utils/logger');
const BrowserManager = require('./core/browser/browser');
const AuthManager    = require('./core/auth/auth');

(async () => {
  const browser = new BrowserManager();

  try {
    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    await page.goto('https://www.infojobs.com.br/empregos.aspx?palabra=suporte+tecnico', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Pega todos os elementos que mencionam "modelo" ou "home"
    const filtros = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')];
      return els
        .filter(el =>
          el.children.length === 0 &&
          el.innerText?.toLowerCase().includes('modelo de trabalho') ||
          el.innerText?.toLowerCase().includes('home office')
        )
        .map(el => ({
          tag:   el.tagName,
          class: el.className?.toString().slice(0, 80),
          id:    el.id,
          texto: el.innerText?.trim().slice(0, 80),
          pai:   el.parentElement?.className?.toString().slice(0, 80),
        }))
        .slice(0, 15);
    });

    logger.info('=== FILTROS ENCONTRADOS ===');
    console.log(JSON.stringify(filtros, null, 2));

    await page.waitForTimeout(15000);

  } catch (err) {
    logger.error(`ERRO: ${err.message}`);
  } finally {
    await browser.close();
  }
})();