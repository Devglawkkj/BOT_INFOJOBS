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

    // Formato correto de URL do InfoJobs
    await page.goto('https://www.infojobs.com.br/empregos-de-analista-de-suporte.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    logger.info(`URL final: ${page.url()}`);

    // Pega classes de todos os elementos com vagas
    const estrutura = await page.evaluate(() => {
      const todos = document.querySelectorAll('*');
      const candidatos = [];
      todos.forEach(el => {
        const cls = el.className?.toString() || '';
        if (
          (cls.includes('offer') || cls.includes('vaga') || cls.includes('job') || cls.includes('card')) &&
          el.querySelector('a') &&
          el.innerText?.length > 20
        ) {
          candidatos.push({
            tag:   el.tagName,
            class: cls.slice(0, 80),
            texto: el.innerText?.trim().slice(0, 100),
          });
        }
      });
      // Remove duplicatas por class
      const vistos = new Set();
      return candidatos.filter(c => {
        if (vistos.has(c.class)) return false;
        vistos.add(c.class);
        return true;
      }).slice(0, 10);
    });

    logger.info('=== ELEMENTOS CANDIDATOS ===');
    console.log(JSON.stringify(estrutura, null, 2));

    await page.waitForTimeout(10000);

  } catch (err) {
    logger.error(`ERRO: ${err.message}`);
  } finally {
    await browser.close();
  }
})();