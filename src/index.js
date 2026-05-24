'use strict';

require('dotenv').config();

const readline        = require('readline-sync');
const logger          = require('./utils/logger');
const BrowserManager  = require('./core/browser/browser');
const AuthManager     = require('./core/auth/auth');
const JobSearch       = require('./core/jobs/jobSearch');
const JobParser       = require('./core/jobs/jobParser');
const CurriculoParser = require('./core/matcher/curriculoParser');

(async () => {
  logger.info('=== InfoJobs Bot | Parte 5 — Parser Currículo ===');

  // Pergunta interativa ou argumento direto
  let TERMO_MANUAL   = process.argv[2] || null;
  let VAGAS_POR_TERMO = parseInt(process.argv[3]) || null;

  if (!TERMO_MANUAL) {
    TERMO_MANUAL = readline.question('\nQual cargo deseja buscar? (ex: suporte tecnico): ').trim();
  }

  if (!VAGAS_POR_TERMO) {
    VAGAS_POR_TERMO = parseInt(readline.question('Quantas vagas por termo? (ex: 5): ').trim()) || 5;
  }

  logger.info(`[Config] Cargo: "${TERMO_MANUAL}" | Vagas por termo: ${VAGAS_POR_TERMO}`);

  const browser = new BrowserManager();

  try {
    // Parser do currículo
    const curriculoParser = new CurriculoParser();
    const perfil          = await curriculoParser.parse();

    logger.info('\n=== PERFIL EXTRAÍDO ===');
    logger.info(`Nome:   ${perfil.nome}`);
    logger.info(`Local:  ${perfil.local}`);
    logger.info(`Exp:    ${perfil.exp_anos} ano(s)`);
    logger.info(`Skills: ${perfil.skills.join(', ')}`);

    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    // Busca vagas
    const jobs  = new JobSearch(page);
    const vagas = await jobs.buscar(TERMO_MANUAL);

    // N vagas por termo escolhido pelo usuário
    const vagasPorTermo = {};
    for (const vaga of vagas) {
      if (!vagasPorTermo[vaga.termo]) vagasPorTermo[vaga.termo] = [];
      if (vagasPorTermo[vaga.termo].length < VAGAS_POR_TERMO) {
        vagasPorTermo[vaga.termo].push(vaga);
      }
    }
    const amostra = Object.values(vagasPorTermo).flat();
    logger.info(`\n[OK] Amostra: ${amostra.length} vagas (${VAGAS_POR_TERMO} por termo)`);

    // Parseia as vagas
    const parser   = new JobParser(page);
    const detalhes = await parser.parsearLote(amostra, amostra.length);

    logger.info('\n=== RESUMO ===');
    detalhes.forEach((v, i) => {
      logger.info(`[${i + 1}] ${v.titulo} | ${v.modalidade} | skills: ${v.skills?.join(', ')}`);
    });

    logger.info(`\n[OK] ${detalhes.length} vagas parseadas — pronto para Parte 6`);

  } catch (err) {
    logger.error(`[FALHA] ${err.message}`);
    await new Promise(r => setTimeout(r, 15000));
  } finally {
    await browser.close();
  }
})();