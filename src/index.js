'use strict';

require('dotenv').config();

const logger         = require('./utils/logger');
const BrowserManager = require('./core/browser/browser');
const AuthManager    = require('./core/auth/auth');
const JobSearch      = require('./core/jobs/jobSearch');
const JobParser      = require('./core/jobs/jobParser');

(async () => {
  logger.info('=== InfoJobs Bot | Parte 4 — Parser de Vaga ===');

  const browser = new BrowserManager();

  try {
    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    const jobs  = new JobSearch(page);
    const vagas = await jobs.buscar();

    const parser   = new JobParser(page);
    const detalhes = await parser.parsearLote(vagas, 14);

    logger.info('\n=== DETALHES DAS VAGAS ===');
    detalhes.forEach((v, i) => {
      logger.info(`[${i + 1}] ${v.titulo}`);
      logger.info(`    Empresa:    ${v.empresa}`);
      logger.info(`    Local:      ${v.local}`);
      logger.info(`    Modalidade: ${v.modalidade}`);
      logger.info(`    Salário:    ${v.salario}`);
      logger.info(`    Exp:        ${v.experiencia}`);
      logger.info(`    Skills:     ${v.skills?.join(', ')}`);
      logger.info(`    URL:        ${v.url}`);
      logger.info('    ---');
    });

  } catch (err) {
    logger.error(`[FALHA] ${err.message}`);
    await new Promise(r => setTimeout(r, 15000));
  } finally {
    await browser.close();
  }
})();