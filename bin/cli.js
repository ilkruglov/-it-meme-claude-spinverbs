#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI colors (zero dependencies)
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const VERBS_PATH = path.join(__dirname, '..', 'src', 'verbs.json');

// Category display names and colors
const CATEGORY_META = {
  'misc':        { name: 'Разное',              color: c.cyan },
  'it-proverbs': { name: 'IT-пословицы',        color: c.green },
  'it-humor':    { name: 'IT-юмор',             color: c.yellow },
  'gamer':       { name: 'Геймерские',          color: c.magenta },
  'olbanski':    { name: 'Олбанский',           color: c.blue },
  'runet-memes': { name: 'Мемы рунета',         color: c.red },
};

function loadVerbs() {
  const data = JSON.parse(fs.readFileSync(VERBS_PATH, 'utf-8'));
  return data.categories;
}

function getAllVerbs() {
  const categories = loadVerbs();
  const all = [];
  for (const verbs of Object.values(categories)) {
    all.push(...verbs);
  }
  return all;
}

function readSettings() {
  try {
    const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    try {
      return JSON.parse(content);
    } catch {
      // Invalid JSON — backup and start fresh
      const backupPath = SETTINGS_PATH + '.backup.' + Date.now();
      fs.copyFileSync(SETTINGS_PATH, backupPath);
      console.log(`${c.yellow}settings.json содержал невалидный JSON.`);
      console.log(`Бэкап сохранён: ${backupPath}${c.reset}`);
      return {};
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // File does not exist
    }
    throw err;
  }
}

function writeSettings(settings) {
  const dir = path.dirname(SETTINGS_PATH);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // directory exists
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

// --- Commands ---

function cmdInstall() {
  const verbs = getAllVerbs();
  let settings = readSettings();

  if (settings === null) {
    // File doesn't exist — create with just spinnerVerbs
    settings = {};
  }

  settings.spinnerVerbs = {
    mode: 'replace',
    verbs: verbs,
  };

  try {
    writeSettings(settings);
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`${c.red}Нет прав на запись в ${SETTINGS_PATH}${c.reset}`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`${c.green}${c.bold}Установлено!${c.reset}`);
  console.log(`${c.dim}${verbs.length} фраз записано в ${SETTINGS_PATH}${c.reset}`);
  console.log(`${c.dim}Режим: replace (полная замена спиннера)${c.reset}`);
  console.log();
  console.log(`Перезапустите Claude Code, чтобы увидеть изменения.`);
}

function cmdAppend() {
  const verbs = getAllVerbs();
  let settings = readSettings();

  if (settings === null) {
    settings = {};
  }

  settings.spinnerVerbs = {
    mode: 'append',
    verbs: verbs,
  };

  try {
    writeSettings(settings);
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`${c.red}Нет прав на запись в ${SETTINGS_PATH}${c.reset}`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`${c.green}${c.bold}Установлено!${c.reset}`);
  console.log(`${c.dim}${verbs.length} фраз записано в ${SETTINGS_PATH}${c.reset}`);
  console.log(`${c.dim}Режим: append (добавлено к стандартным фразам)${c.reset}`);
  console.log();
  console.log(`Перезапустите Claude Code, чтобы увидеть изменения.`);
}

function cmdUninstall() {
  const settings = readSettings();

  if (settings === null) {
    console.log(`${c.yellow}Файл ${SETTINGS_PATH} не найден. Нечего удалять.${c.reset}`);
    return;
  }

  if (!settings.spinnerVerbs) {
    console.log(`${c.yellow}spinnerVerbs не найден в настройках. Нечего удалять.${c.reset}`);
    return;
  }

  delete settings.spinnerVerbs;

  try {
    writeSettings(settings);
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`${c.red}Нет прав на запись в ${SETTINGS_PATH}${c.reset}`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`${c.green}${c.bold}Удалено!${c.reset}`);
  console.log(`${c.dim}spinnerVerbs убран из ${SETTINGS_PATH}${c.reset}`);
  console.log();
  console.log(`Перезапустите Claude Code, чтобы вернуть стандартный спиннер.`);
}

function cmdList() {
  const categories = loadVerbs();

  console.log(`${c.bold}Все фразы для спиннера Claude Code:${c.reset}`);
  console.log();

  let total = 0;
  for (const [key, verbs] of Object.entries(categories)) {
    const meta = CATEGORY_META[key] || { name: key, color: c.cyan };
    console.log(`${meta.color}${c.bold}  ${meta.name}${c.reset} ${c.dim}(${verbs.length})${c.reset}`);
    for (const verb of verbs) {
      console.log(`${c.dim}    •${c.reset} ${verb}`);
    }
    console.log();
    total += verbs.length;
  }

  console.log(`${c.dim}Всего: ${total} фраз${c.reset}`);
}

function cmdPreview() {
  const verbs = getAllVerbs();

  // Fisher-Yates shuffle for 5 random picks
  const shuffled = [...verbs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const sample = shuffled.slice(0, 5);

  console.log(`${c.bold}Превью (5 случайных фраз):${c.reset}`);
  console.log();
  for (const verb of sample) {
    console.log(`  ${c.cyan}⠋${c.reset} ${verb}${c.dim}...${c.reset}`);
  }
  console.log();
  console.log(`${c.dim}Установить: npx it-meme-claude-spinverbs install${c.reset}`);
}

function cmdHelp() {
  console.log(`
${c.bold}it-meme-claude-spinverbs${c.reset} — русские IT-мемы для спиннера Claude Code

${c.bold}Использование:${c.reset}
  npx it-meme-claude-spinverbs ${c.green}<команда>${c.reset}

${c.bold}Команды:${c.reset}
  ${c.green}install${c.reset}     Установить фразы (заменить стандартные)
  ${c.green}append${c.reset}      Добавить фразы к стандартным
  ${c.green}uninstall${c.reset}   Удалить фразы из настроек
  ${c.green}list${c.reset}        Показать все фразы по категориям
  ${c.green}preview${c.reset}     Показать 5 случайных фраз

${c.bold}Примеры:${c.reset}
  ${c.dim}npx it-meme-claude-spinverbs install${c.reset}
  ${c.dim}npx it-meme-claude-spinverbs append${c.reset}
  ${c.dim}npx it-meme-claude-spinverbs preview${c.reset}
`);
}

// --- Main ---

const command = process.argv[2];

switch (command) {
  case 'install':
    cmdInstall();
    break;
  case 'append':
    cmdAppend();
    break;
  case 'uninstall':
    cmdUninstall();
    break;
  case 'list':
    cmdList();
    break;
  case 'preview':
    cmdPreview();
    break;
  default:
    cmdHelp();
    break;
}
