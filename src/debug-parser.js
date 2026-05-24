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

    // Abre uma vaga diretamente para ver o HTML
    await page.goto('https://www.infojobs.com.br/empregos.aspx?palabra=suporte+tecnico', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Pega o HTML completo do primeiro card
    const info = await page.evaluate(() => {
      const card = document.querySelector('.js_rowCard');
      if (!card) return { erro: 'Nenhum card encontrado' };

      // Todos os links dentro do card
      const links = [...card.querySelectorAll('a')].map(a => ({
        texto: a.innerText?.trim().slice(0, 50),
        href:  a.href,
        class: a.className,
      }));

      return {
        htmlResumido: card.innerHTML.slice(0, 2000),
        links,
      };
    });

    logger.info('=== LINKS DO CARD ===');
    console.log(JSON.stringify(info.links, null, 2));
    logger.info('=== HTML DO CARD ===');
    console.log(info.htmlResumido);

    await page.waitForTimeout(10000);

  } catch (err) {
    logger.error(`ERRO: ${err.message}`);
  } finally {
    await browser.close();
  }
})();