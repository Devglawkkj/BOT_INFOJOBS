'use strict';

const fs   = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '../../storage/logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = path.join(LOG_DIR, `session_${tag()}.log`);
const stream   = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function tag() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}
function ts() {
  return new Date().toISOString();
}
function write(level, msg) {
  const line = `[${ts()}] [${level}] ${msg}`;
  stream.write(line + '\n');
  console.log(line);
}

module.exports = {
  info:  (m) => write('INFO ', m),
  warn:  (m) => write('WARN ', m),
  error: (m) => write('ERROR', m),
  debug: (m) => write('DEBUG', m),
  logFile: LOG_FILE,
};