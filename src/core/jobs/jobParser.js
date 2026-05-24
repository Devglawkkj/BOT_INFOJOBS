'use strict';

const logger = require('../../utils/logger');

class JobParser {
  constructor(page) {
    this.page = page;
  }

  async parsear(vaga) {
    try {
      logger.debug(`[Parser] Abrindo: ${vaga.titulo} | ${vaga.link}`);

      await this.page.goto(vaga.link, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.page.waitForTimeout(2000);

      const detalhes = await this.page.evaluate(() => {
        const titulo = document.querySelector('h1, .js_vacancyTitle')?.innerText?.trim() || '';

        const empresa = document.querySelector(
          '[class*="company-name"], .js_companyName, h2 a, [class*="employer"]'
        )?.innerText?.trim() || '';

        const local = document.querySelector(
          '.js_location, [class*="location-name"], [data-testid="location"], [class*="city"]'
        )?.innerText?.trim() || '';

        const salario = document.querySelector(
          '[class*="salary"], .js_salary, [data-testid="salary"], [class*="salario"]'
        )?.innerText?.trim() || 'Não informado';

        const descEl   = document.querySelector(
          '#vacancy-description, [class*="description"], .js_description, .job-description'
        );
        const descricao = descEl?.innerText?.trim().slice(0, 1500) || '';

        const textoCompleto = document.body.innerText?.toLowerCase() || '';

        const remoto     = textoCompleto.includes('home office') ||
                           textoCompleto.includes('remoto') ||
                           textoCompleto.includes('híbrido');
        const modalidade = remoto ? 'remoto' : 'presencial';

        let experiencia  = 'Não informado';
        const expMatch   = textoCompleto.match(/(\d+)\s*ano[s]?\s*de\s*experi[eê]ncia/);
        if (expMatch) {
          experiencia = `${expMatch[1]} ano(s)`;
        } else if (textoCompleto.includes('sem experiência') || textoCompleto.includes('não é necessário')) {
          experiencia = '0 anos';
        }

        const skillsConhecidas = [
          'python', 'javascript', 'typescript', 'html', 'css', 'react', 'node',
          'sql', 'git', 'linux', 'windows', 'aws', 'azure', 'docker',
          'suporte', 'redes', 'tcp/ip', 'dns', 'dhcp', 'vpn', 'firewall',
          'helpdesk', 'active directory', 'power bi', 'excel', 'jira',
          'troubleshooting', 'ti', 'infra', 'cloud',
        ];

        const skills = skillsConhecidas.filter(s => textoCompleto.includes(s));

        return {
          titulo,
          empresa,
          local,
          salario,
          descricao,
          modalidade,
          experiencia,
          skills,
          url: window.location.href,
        };
      });

      logger.debug(`[Parser] OK: ${detalhes.titulo} | ${detalhes.empresa} | skills: ${detalhes.skills.join(', ')}`);
      return { ...vaga, ...detalhes };

    } catch (err) {
      logger.error(`[Parser] Erro em ${vaga.link}: ${err.message}`);
      return { ...vaga, erro: err.message };
    }
  }

  async parsearLote(vagas, limite = 10) {
    logger.info(`[Parser] Parseando ${Math.min(vagas.length, limite)} vagas...`);
    const resultado = [];

    for (let i = 0; i < Math.min(vagas.length, limite); i++) {
      const vaga = vagas[i];
      if (!vaga.link) {
        logger.debug(`[Parser] Sem link, pulando: ${vaga.titulo}`);
        continue;
      }
      const detalhes = await this.parsear(vaga);
      resultado.push(detalhes);
      await this.page.waitForTimeout(1000);
    }

    logger.info(`[Parser] Concluído: ${resultado.length} vagas parseadas`);
    return resultado;
  }
}

module.exports = JobParser;