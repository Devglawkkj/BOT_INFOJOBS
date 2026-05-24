'use strict';

const logger = require('../../utils/logger');

const TERMOS = [
  'suporte tecnico',
  'analista de suporte',
  'tecnico em redes',
  'desenvolvedor javascript',
  'desenvolvedor python',
  'helpdesk',
];

const MAX_PAGINAS = 3;

class JobSearch {
  constructor(page) {
    this.page = page;
  }

  async buscarTermo(termo) {
    const vagas = [];

    await this.page.goto('https://www.infojobs.com.br', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await this.page.waitForTimeout(2000);

    await this.page.waitForSelector('.js_input', { timeout: 10000 });
    const inputs = await this.page.$$('.js_input');

    await inputs[0].click({ clickCount: 3 });
    await inputs[0].fill(termo);
    await this.page.waitForTimeout(500);

    if (inputs[1]) {
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].fill('');
      await this.page.waitForTimeout(300);
    }

    await inputs[0].press('Enter');
    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    logger.debug(`[Jobs] URL após busca: ${this.page.url()}`);

    for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
      logger.debug(`[Jobs] "${termo}" — página ${pagina}`);

      const encontradas = await this.extrairVagas();

      if (encontradas.length === 0) {
        logger.debug(`[Jobs] Sem vagas na página ${pagina}`);
        break;
      }

      encontradas.forEach(v => { v.termo = termo; vagas.push(v); });
      logger.info(`[Jobs] "${termo}" p${pagina}: ${encontradas.length} vagas`);

      if (pagina < MAX_PAGINAS) {
        const proxima = await this.page.$('a[aria-label*="próxima"], a[rel="next"], .js_next, [class*="next-page"]');
        if (!proxima) break;
        await proxima.click();
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await this.page.waitForTimeout(2000);
      }
    }

    return vagas;
  }

  async extrairVagas() {
    return await this.page.evaluate(() => {
      const cards    = document.querySelectorAll('.js_rowCard[data-href]');
      const resultado = [];

      cards.forEach(card => {
        const tituloEl  = card.querySelector('.js_vacancyTitle, h2, h3');
        const titulo    = tituloEl?.innerText?.trim() || '';

        const links    = card.querySelectorAll('a');
        const empresa  = links[1]?.innerText?.trim() || '';

        const localEl  = card.querySelector('[class*="location"], [class*="city"], .js_location');
        const local    = localEl?.innerText?.trim() || '';

        const dataHref = card.getAttribute('data-href') || '';
        const link     = dataHref
          ? `https://www.infojobs.com.br${dataHref}`
          : (links[0]?.href || '');

        const texto      = card.innerText?.toLowerCase() || '';
        const remoto     = texto.includes('home') || texto.includes('remoto') || texto.includes('híbrido');
        const modalidade = remoto ? 'remoto' : 'presencial';

        if (titulo && link) {
          resultado.push({ titulo, empresa, local, link, modalidade });
        }
      });

      return resultado;
    });
  }

  async buscar() {
    const todasVagas  = [];
    const linksVistos = new Set();

    for (const termo of TERMOS) {
      logger.info(`[Jobs] Buscando: "${termo}"`);
      try {
        const vagas = await this.buscarTermo(termo);
        for (const vaga of vagas) {
          if (!linksVistos.has(vaga.link)) {
            linksVistos.add(vaga.link);
            todasVagas.push(vaga);
          }
        }
      } catch (err) {
        logger.error(`[Jobs] Erro em "${termo}": ${err.message}`);
      }
    }

    logger.info(`[Jobs] Total: ${todasVagas.length} vagas únicas`);
    return todasVagas;
  }
  async buscar(termoFiltro = null) {
  const termos = termoFiltro ? [termoFiltro] : TERMOS;
  const todasVagas  = [];
  const linksVistos = new Set();

  for (const termo of termos) {
    logger.info(`[Jobs] Buscando: "${termo}"`);
    try {
      const vagas = await this.buscarTermo(termo);
      for (const vaga of vagas) {
        if (!linksVistos.has(vaga.link)) {
          linksVistos.add(vaga.link);
          todasVagas.push(vaga);
        }
      }
    } catch (err) {
      logger.error(`[Jobs] Erro em "${termo}": ${err.message}`);
    }
  }

  logger.info(`[Jobs] Total: ${todasVagas.length} vagas únicas`);
  return todasVagas;
  }
}


module.exports = JobSearch;