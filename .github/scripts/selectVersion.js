#!/usr/bin/env node

const readline = require('readline');

const [, , title, ...options] = process.argv;

if (!title || options.length === 0) {
  process.stderr.write('Usage: selectVersion.js "<title>" "<option 1>" ["<option 2>" ...]>\n');
  process.exit(1);
}

let selectedIndex = 0;
let inputBuffer = '';
let hasRendered = false;
let renderedLineCount = 0;
const output = process.stderr;
const ANSI_RESET = '\u001b[0m';
const ANSI_BOLD = '\u001b[1m';
const ANSI_CYAN = '\u001b[36m';
const ANSI_GREEN = '\u001b[32m';
const ANSI_DIM = '\u001b[2m';
const ANSI_HIDE_CURSOR = '\u001b[?25l';
const ANSI_SHOW_CURSOR = '\u001b[?25h';

function renderMenu() {
  if (hasRendered) {
    readline.moveCursor(output, 0, -(renderedLineCount - 1));
    readline.cursorTo(output, 0);
  } else {
    output.write(ANSI_HIDE_CURSOR);
  }

  readline.clearScreenDown(output);

  output.write(`${ANSI_CYAN}? ${title} ›${ANSI_RESET}\n`);

  options.forEach((option, index) => {
    const prefix = index === selectedIndex ? '❯' : ' ';
    if (index === selectedIndex) {
      output.write(`${ANSI_BOLD}${ANSI_GREEN}${prefix} ${option}${ANSI_RESET}\n`);
      return;
    }

    output.write(`${prefix} ${option}\n`);
  });

  output.write(`${ANSI_DIM}↑/↓ navigate • enter confirm • q quit${ANSI_RESET}`);
  hasRendered = true;
  renderedLineCount = options.length + 2;
}

function cleanupAndExit(exitCode, selectedOption = '') {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  process.stdin.pause();
  output.write(`${ANSI_SHOW_CURSOR}\n`);

  if (selectedOption) {
    process.stdout.write(selectedOption);
  }

  process.exit(exitCode);
}

function moveSelection(offset) {
  const nextIndex = selectedIndex + offset;

  if (nextIndex < 0) {
    selectedIndex = options.length - 1;
  } else if (nextIndex >= options.length) {
    selectedIndex = 0;
  } else {
    selectedIndex = nextIndex;
  }

  renderMenu();
}

function consumeBuffer() {
  while (inputBuffer.length > 0) {
    switch (true) {
      case inputBuffer.startsWith('\u001b[A'):
        inputBuffer = inputBuffer.slice(3);
        moveSelection(-1);
        break;

      case inputBuffer.startsWith('\u001b[B'):
        inputBuffer = inputBuffer.slice(3);
        moveSelection(1);
        break;

      case inputBuffer[0] === '\r':
      case inputBuffer[0] === '\n':
        cleanupAndExit(0, options[selectedIndex]);
        return;

      case inputBuffer[0] === 'q':
      case inputBuffer[0] === 'Q':
      case inputBuffer[0] === '\u0003':
        cleanupAndExit(1);
        return;

      case inputBuffer[0] === '\u001b' && inputBuffer.length < 3:
        return;

      default:
        inputBuffer = inputBuffer.slice(1);
    }
  }
}

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputBuffer += chunk;
  consumeBuffer();
});

process.stdin.on('end', () => {
  cleanupAndExit(1);
});

renderMenu();
