'use strict';

const fs     = require('fs');
const path   = require('path');
const pdf    = require('pdf-parse');
const logger = require('../../utils/logger');

const CURRICULO_PATH = path.resolve(__dirname, '../../../curriculo/curriculo.pdf');

// Skills conhecidas para extração
const SKILLS_MAP = {
  linguagens:   ['python', 'javascript', 'typescript', 'html', 'css', 'c', 'java', 'sql'],
  frameworks:   ['react', 'node', 'nodejs', 'express', 'django', 'flask'],
  infra:        ['redes', 'tcp/ip', 'dns', 'dhcp', 'vpn', 'firewall', 'linux', 'windows',
                 'aws', 'azure', 'cloud', 'docker', 'active directory'],
  suporte:      ['suporte', 'helpdesk', 'troubleshooting', 'n1', 'n2', 'n3',
                 'atendimento', 'chamados', 'sla'],
  ferramentas:  ['git', 'github', 'power bi', 'excel', 'jira', 'figma', 'vscode'],
  dados:        ['power bi', 'excel', 'análise de dados', 'automação'],
};

// Cargos-alvo extraídos do currículo
const CARGOS_ALVO = [
  'suporte n2', 'suporte n3', 'analista de suporte', 'técnico em redes',
  'desenvolvedor', 'ti', 'helpdesk', 'infraestrutura',
];

class CurriculoParser {
  async parse() {
    logger.info('[Curriculo] Lendo PDF...');

    if (!fs.existsSync(CURRICULO_PATH)) {
      throw new Error(`PDF não encontrado em: ${CURRICULO_PATH}`);
    }

    const buffer  = fs.readFileSync(CURRICULO_PATH);
    const data    = await pdf(buffer);
    const texto   = data.text.toLowerCase();

    logger.debug(`[Curriculo] Texto extraído: ${data.text.length} chars`);

    const skills     = this._extrairSkills(texto);
    const experiencia = this._extrairExperiencia(texto);
    const local      = this._extrairLocal(texto);

    const perfil = {
      nome:        'Glauckyon Rocha',
      local,
      skills,
      cargosAlvo:  CARGOS_ALVO,
      exp_anos:    experiencia,
      textoCompleto: texto,
    };

    logger.info(`[Curriculo] Skills extraídas: ${skills.join(', ')}`);
    logger.info(`[Curriculo] Experiência: ${experiencia} ano(s)`);
    logger.info(`[Curriculo] Local: ${local}`);

    return perfil;
  }

  _extrairSkills(texto) {
    const encontradas = new Set();

    for (const categoria of Object.values(SKILLS_MAP)) {
      for (const skill of categoria) {
        if (texto.includes(skill.toLowerCase())) {
          encontradas.add(skill.toLowerCase());
        }
      }
    }

    return [...encontradas];
  }

  _extrairExperiencia(texto) {
    // Tenta achar "X anos de experiência"
    const match = texto.match(/(\d+)\s*ano[s]?\s*de\s*experi[eê]ncia/);
    if (match) return parseInt(match[1]);

    // Conta experiências profissionais pelo número de empresas
    const empresas = (texto.match(/\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+\d{4}/g) || []);
    if (empresas.length >= 2) return 1;

    return 0;
  }

  _extrairLocal(texto) {
    if (texto.includes('teresina')) return 'teresina';
    if (texto.includes('piauí') || texto.includes('piaui')) return 'teresina';
    return 'não informado';
  }
}

module.exports = CurriculoParser;