'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '../../');

module.exports = {
  browser: {
    headless: false,       // false = você vê o browser abrindo
    timeout:    30_000,
    navTimeout: 60_000,
  },

  storage: {
    cookies: path.join(ROOT, 'storage/cookies'),
    logs:    path.join(ROOT, 'storage/logs'),
    cache:   path.join(ROOT, 'storage/cache'),
  },

  infojobs: {
  baseUrl:   'https://www.infojobs.com.br',
  loginUrl:  'https://www.infojobs.com.br/candidate-login/login.aspx',
  searchUrl: 'https://www.infojobs.com.br/empregos.aspx',
  },

  matcher: {
    minScore: 70,
    weights: { skills: 50, cargo: 25, exp: 15, local: 10 },
    required: ['python', 'javascript', 'suporte', 'redes'],
    blocked:  ['vendas', 'telemarketing', 'corretor', 'marketing'],
  },

  curriculo: {
    nome:   'Glauckyon Rocha',
    local:  'teresina',
    skills: [
      'python', 'javascript', 'html', 'css', 'suporte', 'redes',
      'tcp/ip', 'dns', 'dhcp', 'power bi', 'excel', 'git',
      'aws', 'troubleshooting', 'linux', 'windows'
    ],
    cargos: ['suporte n2', 'suporte n3', 'analista de suporte',
             'desenvolvedor', 'técnico em redes', 'ti'],
    exp_anos: 1,
  },
};