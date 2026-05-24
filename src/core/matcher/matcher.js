'use strict';

const logger = require('../../utils/logger');
const config = require('../../utils/config');

class Matcher {
  constructor(perfil) {
    this.perfil = perfil;
  }

  calcular(vaga) {
    const texto = (
      (vaga.titulo || '') + ' ' +
      (vaga.descricao || '') + ' ' +
      (vaga.skills?.join(' ') || '')
    ).toLowerCase();

    // Bloqueia vagas de áreas bloqueadas
    const bloqueado = config.matcher.blocked.some(b => texto.includes(b));
    if (bloqueado) {
      return {
        score: 0,
        aprovado: false,
        motivo: 'Área bloqueada',
        matchedSkills: [],
        missingSkills: [],
      };
    }

    // Score de skills (50pts)
    const vagaSkills    = vaga.skills || [];
    const perfilSkills  = this.perfil.skills || [];
    const matchedSkills = perfilSkills.filter(s => vagaSkills.includes(s));
    const missingSkills = vagaSkills.filter(s => !perfilSkills.includes(s));

    let scoreSkills = 0;
    if (vagaSkills.length > 0) {
      scoreSkills = Math.round((matchedSkills.length / vagaSkills.length) * 50);
    } else {
      scoreSkills = 25; // sem skills listadas, dá metade
    }

    // Score de cargo (25pts)
    const cargosAlvo  = this.perfil.cargosAlvo || [];
    const matchCargo  = cargosAlvo.some(c => texto.includes(c.toLowerCase()));
    const scoreCargo  = matchCargo ? 25 : 0;

    // Score de experiência (15pts)
    let scoreExp = 0;
    const expVaga = this._extrairExpVaga(texto);
    if (expVaga === 0 || expVaga === null) {
      scoreExp = 15; // sem requisito = ok
    } else if (this.perfil.exp_anos >= expVaga) {
      scoreExp = 15;
    } else if (this.perfil.exp_anos >= expVaga - 1) {
      scoreExp = 8; // quase
    }

    // Score de local (10pts)
    let scoreLocal = 0;
    const vagaLocal  = (vaga.local || '').toLowerCase();
    const modalidade = (vaga.modalidade || '').toLowerCase();

    if (modalidade === 'remoto' ||
        vagaLocal.includes('home') ||
        vagaLocal.includes('remoto') ||
        vagaLocal.includes('híbrido')) {
      scoreLocal = 10;
    } else if (vagaLocal.includes('teresina') || vagaLocal.includes('piauí')) {
      scoreLocal = 10;
    } else {
      scoreLocal = 0;
    }

    const score    = scoreSkills + scoreCargo + scoreExp + scoreLocal;
    const aprovado = score >= config.matcher.minScore;

    const resultado = {
      score,
      aprovado,
      motivo: aprovado ? 'Score suficiente' : `Score insuficiente (${score}/100)`,
      matchedSkills,
      missingSkills,
      detalhes: { scoreSkills, scoreCargo, scoreExp, scoreLocal },
    };

    logger.debug(
      `[Matcher] ${vaga.titulo} | score: ${score} | ` +
      `skills:${scoreSkills} cargo:${scoreCargo} exp:${scoreExp} local:${scoreLocal} | ` +
      `${aprovado ? '✓ APROVADO' : '✗ reprovado'}`
    );

    return resultado;
  }

  _extrairExpVaga(texto) {
    const match = texto.match(/(\d+)\s*ano[s]?\s*de\s*experi[eê]ncia/);
    if (match) return parseInt(match[1]);
    if (texto.includes('sem experiência') || texto.includes('não é necessário')) return 0;
    return null;
  }

  processar(vagas) {
    logger.info(`[Matcher] Processando ${vagas.length} vagas...`);

    const resultados = vagas.map(vaga => ({
      ...vaga,
      match: this.calcular(vaga),
    }));

    const aprovadas  = resultados.filter(v => v.match.aprovado);
    const reprovadas = resultados.filter(v => !v.match.aprovado);

    logger.info(`[Matcher] Aprovadas: ${aprovadas.length} | Reprovadas: ${reprovadas.length}`);

    // Ordena aprovadas por score
    aprovadas.sort((a, b) => b.match.score - a.match.score);

    return { aprovadas, reprovadas, todas: resultados };
  }
}

module.exports = Matcher;