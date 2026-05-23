'use strict';

require('dotenv').config();

const logger         = require('./utils/logger');
const BrowserManager = require('./core/browser/browser');
const AuthManager    = require('./core/auth/auth');
const JobSearch      = require('./core/jobs/jobSearch');

(async () => {
  logger.info('=== InfoJobs Bot | Parte 3 — Busca de Vagas ===');

  const browser = new BrowserManager();

  try {
    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    const jobs  = new JobSearch(page);
    const vagas = await jobs.buscar();

    logger.info('\n=== RESUMO ===');
    vagas.slice(0, 10).forEach((v, i) => {
      logger.info(`[${i + 1}] ${v.titulo} | ${v.empresa} | ${v.local} | ${v.modalidade}`);
    });
    logger.info(`Total encontrado: ${vagas.length}`);

  } catch (err) {
    logger.error(`[FALHA] ${err.message}`);
    await new Promise(r => setTimeout(r, 15000));
  } finally {
    await browser.close();
  }
})();