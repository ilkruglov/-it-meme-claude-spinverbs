# it-meme-spin — Design Document

**Date:** 2026-03-03
**Status:** Approved

## Overview

CLI-утилита для Claude Code, заменяющая стандартные фразы спиннера на русские IT-мемы, пословицы, геймерские отсылки и олбанский.

## Problem

Claude Code показывает скучные англоязычные фразы ("Thinking...", "Working...") в спиннере. Русскоязычные разработчики хотят кастомизировать это.

## Solution

npm-пакет `it-meme-spin` — одна команда `npx it-meme-spin install` заменяет спиннер на 63 русских IT-мема.

## Architecture

### Project Structure

```
it-meme-spin/
├── bin/
│   └── cli.js          # entry point (#!/usr/bin/env node)
├── src/
│   └── verbs.json      # 63 phrases with categories
├── package.json
├── LICENSE (MIT)
└── README.md
```

### CLI Commands

| Command | Action |
|---------|--------|
| `npx it-meme-spin` | Show help |
| `npx it-meme-spin install` | Replace spinner verbs (mode: replace) |
| `npx it-meme-spin append` | Add to existing verbs (mode: append) |
| `npx it-meme-spin uninstall` | Remove spinnerVerbs from settings |
| `npx it-meme-spin list` | Show all phrases by category |
| `npx it-meme-spin preview` | Show 5 random phrases |

### Logic

1. Locate `~/.claude/settings.json`
2. Parse JSON, merge `spinnerVerbs` section
3. Write back with formatting (2-space indent)
4. Print colored result (ANSI codes, zero dependencies)

### Data: verbs.json

Categories:
- **it-proverbs** (10): IT-переделки русских пословиц
- **it-humor** (15): Программистский юмор
- **gamer** (16): Геймерские мемы
- **olbanski** (7): Олбанский язык
- **runet-memes** (8): Мемы рунета
- **misc** (7): Вне категорий

### Dependencies

Zero. Only Node.js built-ins: `fs`, `path`, `os`.

### Error Handling

- settings.json not found → create minimal one
- Invalid JSON → backup + report error
- No write permissions → clear error message

### README Plan

- Header with emoji
- One-line install command
- Table of all phrases by category
- How to add custom phrases
- How to contribute
