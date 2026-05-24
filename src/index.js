'use strict';

require('dotenv').config();

const readline        = require('readline-sync');
const logger          = require('./utils/logger');
const BrowserManager  = require('./core/browser/browser');
const AuthManager     = require('./core/auth/auth');
const JobSearch       = require('./core/jobs/jobSearch');
const JobParser       = require('./core/jobs/jobParser');
const CurriculoParser = require('./core/matcher/curriculoParser');
const Matcher         = require('./core/matcher/matcher');

(async () => {
  logger.info('=== InfoJobs Bot | Parte 6 — Matcher ===');

  let TERMO_MANUAL    = process.argv[2] || null;
  let VAGAS_POR_TERMO = parseInt(process.argv[3]) || null;

  if (!TERMO_MANUAL) {
    TERMO_MANUAL = readline.question('\nQual cargo deseja buscar? (ex: suporte tecnico): ').trim();
  }
  if (!VAGAS_POR_TERMO) {
    VAGAS_POR_TERMO = parseInt(readline.question('Quantas vagas por termo? (ex: 5): ').trim()) || 5;
  }

  logger.info(`[Config] Cargo: "${TERMO_MANUAL}" | Vagas: ${VAGAS_POR_TERMO}`);

  const browser = new BrowserManager();

  try {
    const curriculoParser = new CurriculoParser();
    const perfil          = await curriculoParser.parse();
    logger.info(`[Curriculo] Skills: ${perfil.skills.join(', ')}`);

    await browser.start();
    const page = await browser.newPage();

    const auth = new AuthManager(page);
    await auth.ensure();

    const jobs  = new JobSearch(page);
    const vagas = await jobs.buscar(TERMO_MANUAL);

    const vagasPorTermo = {};
    for (const vaga of vagas) {
      if (!vagasPorTermo[vaga.termo]) vagasPorTermo[vaga.termo] = [];
      if (vagasPorTermo[vaga.termo].length < VAGAS_POR_TERMO) {
        vagasPorTermo[vaga.termo].push(vaga);
      }
    }
    const amostra = Object.values(vagasPorTermo).flat();
    logger.info(`\n[OK] Amostra: ${amostra.length} vagas (${VAGAS_POR_TERMO} por termo)`);

    const parser   = new JobParser(page);
    const detalhes = await parser.parsearLote(amostra, amostra.length);

    const matcher                        = new Matcher(perfil);
    const { aprovadas, reprovadas, todas } = matcher.processar(detalhes);

    logger.info('\n=== VAGAS APROVADAS ===');
    aprovadas.forEach((v, i) => {
      logger.info(`[${i + 1}] ${v.titulo}`);
      logger.info(`    Score:    ${v.match.score}/100`);
      logger.info(`    Detalhes: skills:${v.match.detalhes.scoreSkills} cargo:${v.match.detalhes.scoreCargo} exp:${v.match.detalhes.scoreExp} local:${v.match.detalhes.scoreLocal}`);
      logger.info(`    Skills:   ${v.match.matchedSkills.join(', ')}`);
      logger.info(`    URL:      ${v.url}`);
      logger.info('    ---');
    });

    logger.info('\n=== RESUMO ===');
    logger.info(`Total parseadas: ${todas.length}`);
    logger.info(`Aprovadas (≥70): ${aprovadas.length}`);
    logger.info(`Reprovadas:      ${reprovadas.length}`);

  } catch (err) {
    logger.error(`[FALHA] ${err.message}`);
    await new Promise(r => setTimeout(r, 15000));
  } finally {
    await browser.close();
  }
})();