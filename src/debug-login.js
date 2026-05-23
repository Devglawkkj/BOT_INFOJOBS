'use strict';

require('dotenv').config();

const logger         = require('./utils/logger');
const BrowserManager = require('./core/browser/browser');

(async () => {
  const browser = new BrowserManager();

  try {
    await browser.start();
    const page = await browser.newPage();

    // Vai para /candidate/ para gerar o redirect com ReturnUrl correto
    await page.goto('https://www.infojobs.com.br/candidate/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    logger.info(`URL atual: ${page.url()}`);

    // Pega todo o HTML do formulário de login
    const formHtml = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.innerHTML : 'FORM NÃO ENCONTRADO';
    });

    logger.info('=== HTML DO FORMULÁRIO ===');
    console.log(formHtml);
    logger.info('=== FIM DO HTML ===');

    // Lista todos os botões e inputs da página
    const botoes = await page.evaluate(() => {
      const els = [...document.querySelectorAll('button, input[type="submit"], a')];
      return els.map(el => ({
        tag:   el.tagName,
        type:  el.type || '',
        id:    el.id || '',
        name:  el.name || '',
        class: el.className || '',
        text:  el.innerText?.trim().slice(0, 50) || '',
        href:  el.href || '',
      }));
    });

    logger.info('=== BOTÕES E LINKS ===');
    console.log(JSON.stringify(botoes, null, 2));

    // Pausa 30s para você ver o browser
    logger.info('Aguardando 30s...');
    await page.waitForTimeout(30000);

  } catch (err) {
    logger.error(`ERRO: ${err.message}`);
  } finally {
    await browser.close();
  }
})();