'use strict';

require('dotenv').config();
const logger = require('../../utils/logger');
const config = require('../../utils/config');

class AuthManager {
  constructor(page) {
    this.page  = page;
    this.email = process.env.INFOJOBS_EMAIL;
    this.pass  = process.env.INFOJOBS_PASS;
  }

  async isLoggedIn() {
    try {
      await this.page.goto(config.infojobs.baseUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      const loginBtn = await this.page.$('a:text("Login")');
      if (loginBtn) {
        logger.info('[Auth] Não logado — botão Login detectado');
        return false;
      }
      logger.info('[Auth] Sessão ativa detectada');
      return true;
    } catch {
      return false;
    }
  }

  async login() {
    logger.info('[Auth] Navegando para página de login...');

    await this.page.goto('https://www.infojobs.com.br/candidate/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await this.page.waitForTimeout(3000);
    logger.debug(`[Auth] URL: ${this.page.url()}`);

    // Etapa 1 — preenche e-mail
    await this.page.waitForSelector('#Email', { timeout: 15000 });
    logger.debug('[Auth] Preenchendo e-mail...');
    await this.page.fill('#Email', this.email);
    await this.page.waitForTimeout(800);

    // Clica em Continuar — seletor exato do botão
    await this.page.click('.js_loginButton');
    logger.debug('[Auth] Botão Continuar clicado');

    // Aguarda o campo senha aparecer na mesma página (sem navigation)
    await this.page.waitForSelector('#Password', { state: 'visible', timeout: 15000 });
    logger.debug('[Auth] Campo senha visível');
    await this.page.waitForTimeout(500);

    // Etapa 2 — preenche senha
    await this.page.fill('#Password', this.pass);
    await this.page.waitForTimeout(800);

    // Clica em Acessar
    await this.page.click('.js_loginButton');
    logger.debug('[Auth] Botão Acessar clicado — aguardando redirect...');

    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 })
      .catch(() => {});

    await this.page.waitForTimeout(2000);

    const url = this.page.url();
    logger.debug(`[Auth] URL final: ${url}`);

    const sucesso = url.includes('infojobs.com.br') && !url.includes('login.infojobs');
    if (sucesso) {
      logger.info('[Auth] Login realizado com sucesso');
    } else {
      const erro = await this.page.$('.validation-summary-errors, .field-validation-error');
      const msg  = erro ? await erro.innerText() : 'Motivo desconhecido';
      logger.error(`[Auth] Login falhou: ${msg}`);
      throw new Error(`Login falhou: ${msg}`);
    }

    return true;
  }

  async ensure() {
    const logado = await this.isLoggedIn();
    if (!logado) await this.login();
  }
}

module.exports = AuthManager;