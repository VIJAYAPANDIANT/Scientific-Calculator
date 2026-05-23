const display = document.getElementById('display');
const historyEl = document.getElementById('history');
const modeButton = document.getElementById('modeBadge');
const memoryBadge = document.getElementById('memoryBadge');

let expression = '';
let lastResult = null;
let memoryValue = 0;
let angleMode = 'deg';

function formatNumber(value) {
  const normalized = Number(value.toPrecision(12));
  if (!Number.isFinite(normalized)) {
    return 'Error';
  }

  const fixed = Math.abs(normalized) < 1e-10 ? 0 : Number(normalized.toFixed(10));
  return String(fixed).replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
}

function updateDisplay(value) {
  display.value = value;
}

function updateHistory(text) {
  historyEl.textContent = text;
}

function updateModeBadge() {
  modeButton.textContent = angleMode.toUpperCase();
}

function updateMemoryBadge() {
  memoryBadge.textContent = `M: ${formatNumber(memoryValue)}`;
}

function isOperator(ch) {
  return ['+', '-', '*', '/', '^'].includes(ch);
}

function appendValue(value) {
  if (expression === 'Error') {
    expression = '';
  }

  if (expression === '') {
    if (value === '.') {
      expression = '0.';
    } else if (value === '(') {
      expression = '(';
    } else if (value === ')') {
      expression = '0';
    } else if (['+', '*', '/', '^'].includes(value)) {
      expression = '0' + value;
    } else {
      expression = value;
    }
  } else if (value === '.' && expression.includes('.')) {
    return;
  } else if (isOperator(value) && isOperator(expression.slice(-1))) {
    expression = expression.slice(0, -1) + value;
  } else {
    expression += value;
  }

  updateDisplay(expression);
}

function clearAll() {
  expression = '';
  updateDisplay('0');
  updateHistory('');
}

function clearEntry() {
  expression = '';
  updateDisplay('0');
}

function deleteLast() {
  expression = expression.slice(0, -1);
  if (expression === '') {
    updateDisplay('0');
    return;
  }
  updateDisplay(expression);
}

function toggleSign() {
  if (expression === '') {
    expression = '-';
  } else if (expression.startsWith('-')) {
    expression = expression.slice(1);
  } else {
    expression = `-${expression}`;
  }
  updateDisplay(expression || '0');
}

function appendFunction(name) {
  if (expression === 'Error') {
    expression = '';
  }

  if (name === 'sqrt') {
    expression += '√(';
  } else if (name === 'mod') {
    expression += 'mod(';
  } else if (name === 'fact') {
    expression += 'fact(';
  } else if (name === 'abs') {
    expression += 'abs(';
  } else {
    expression += `${name}(`;
  }

  updateDisplay(expression);
}

function reciprocal() {
  if (expression === '' || expression === 'Error') {
    expression = '1/(';
  } else {
    expression = `1/(${expression})`;
  }
  updateDisplay(expression);
}

function square() {
  if (expression === '') {
    expression = '0^2';
  } else {
    expression = `(${expression})^2`;
  }
  updateDisplay(expression);
}

function cube() {
  if (expression === '') {
    expression = '0^3';
  } else {
    expression = `(${expression})^3`;
  }
  updateDisplay(expression);
}

function toggleAngleMode() {
  angleMode = angleMode === 'deg' ? 'rad' : 'deg';
  updateModeBadge();
}

function getCurrentValue() {
  if (expression === '' || expression === '0') {
    return lastResult ?? 0;
  }

  const result = evaluateExpression(expression);
  if (!Number.isFinite(result)) {
    throw new Error('Invalid current value');
  }

  return result;
}

function memoryAdd() {
  const value = getCurrentValue();
  memoryValue += value;
  updateMemoryBadge();
  updateHistory(`M+ ${formatNumber(value)}`);
}

function memorySubtract() {
  const value = getCurrentValue();
  memoryValue -= value;
  updateMemoryBadge();
  updateHistory(`M- ${formatNumber(value)}`);
}

function memoryRecall() {
  expression = formatNumber(memoryValue);
  updateDisplay(expression);
  updateHistory(`MR ${expression}`);
}

function memoryClear() {
  memoryValue = 0;
  updateMemoryBadge();
  updateHistory('MC');
}

function replaceConstantsAndFunctions(input) {
  let result = input;
  result = result.replace(/π/g, 'Math.PI');
  result = result.replace(/e/g, 'Math.E');
  result = result.replace(/√\(/g, 'Math.sqrt(');
  result = result.replace(/log\(/g, 'Math.log10(');
  result = result.replace(/ln\(/g, 'Math.log(');
  result = result.replace(/sin\(/g, 'sinFn(');
  result = result.replace(/cos\(/g, 'cosFn(');
  result = result.replace(/tan\(/g, 'tanFn(');
  result = result.replace(/asin\(/g, 'asinFn(');
  result = result.replace(/acos\(/g, 'acosFn(');
  result = result.replace(/mod\(/g, 'modFn(');
  result = result.replace(/fact\(/g, 'factFn(');
  result = result.replace(/abs\(/g, 'Math.abs(');
  result = result.replace(/\^/g, '**');
  result = result.replace(/%/g, '/100');
  return result;
}

function sinFn(value) {
  return angleMode === 'deg' ? Math.sin(value * Math.PI / 180) : Math.sin(value);
}

function cosFn(value) {
  return angleMode === 'deg' ? Math.cos(value * Math.PI / 180) : Math.cos(value);
}

function tanFn(value) {
  return angleMode === 'deg' ? Math.tan(value * Math.PI / 180) : Math.tan(value);
}

function asinFn(value) {
  const result = Math.asin(value);
  return angleMode === 'deg' ? result * 180 / Math.PI : result;
}

function acosFn(value) {
  const result = Math.acos(value);
  return angleMode === 'deg' ? result * 180 / Math.PI : result;
}

function modFn(a, b) {
  return a % b;
}

function factFn(value) {
  const rounded = Number(value);
  if (!Number.isInteger(rounded) || rounded < 0) {
    throw new Error('Factorial requires a non-negative integer');
  }

  let result = 1;
  for (let i = 2; i <= rounded; i += 1) {
    result *= i;
  }
  return result;
}

function evaluateExpression(input) {
  const sanitized = replaceConstantsAndFunctions(input);
  const userMath = new Function(
    'sinFn',
    'cosFn',
    'tanFn',
    'asinFn',
    'acosFn',
    'modFn',
    'factFn',
    `"use strict"; return (${sanitized});`
  );

  return userMath(sinFn, cosFn, tanFn, asinFn, acosFn, modFn, factFn);
}

function calculate() {
  if (!expression) {
    return;
  }

  try {
    const result = evaluateExpression(expression);
    if (!Number.isFinite(result)) {
      throw new Error('Invalid result');
    }

    const formatted = formatNumber(result);
    updateHistory(`${expression} =`);
    expression = formatted;
    updateDisplay(expression);
    lastResult = Number(expression);
  } catch (error) {
    updateHistory('Error');
    updateDisplay('Error');
    expression = '';
  }
}

function handleAction(action) {
  switch (action) {
    case 'clear':
      clearAll();
      break;
    case 'clear-entry':
      clearEntry();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'equals':
      calculate();
      break;
    case 'toggle-sign':
      toggleSign();
      break;
    case 'percent':
      appendValue('%');
      break;
    case 'toggle-angle':
      toggleAngleMode();
      break;
    case 'sin':
      appendFunction('sin');
      break;
    case 'cos':
      appendFunction('cos');
      break;
    case 'tan':
      appendFunction('tan');
      break;
    case 'asin':
      appendFunction('asin');
      break;
    case 'acos':
      appendFunction('acos');
      break;
    case 'log':
      appendFunction('log');
      break;
    case 'ln':
      appendFunction('ln');
      break;
    case 'sqrt':
      appendFunction('sqrt');
      break;
    case 'reciprocal':
      reciprocal();
      break;
    case 'abs':
      appendFunction('abs');
      break;
    case 'fact':
      appendFunction('fact');
      break;
    case 'mod':
      appendFunction('mod');
      break;
    case 'square':
      square();
      break;
    case 'cube':
      cube();
      break;
    case 'pi':
      appendValue('π');
      break;
    case 'e':
      appendValue('e');
      break;
    case 'pow':
      appendValue('^');
      break;
    case 'memory-add':
      memoryAdd();
      break;
    case 'memory-subtract':
      memorySubtract();
      break;
    case 'memory-recall':
      memoryRecall();
      break;
    case 'memory-clear':
      memoryClear();
      break;
    default:
      break;
  }
}

function handleValue(value) {
  appendValue(value);
}

for (const button of document.querySelectorAll('button')) {
  button.addEventListener('click', () => {
    if (button.classList.contains('func')) {
      handleAction(button.dataset.action);
      return;
    }

    if (button.classList.contains('op')) {
      appendValue(button.dataset.value);
      return;
    }

    if (button.classList.contains('num')) {
      handleValue(button.dataset.value);
    }
  });
}

document.addEventListener('keydown', (event) => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    event.preventDefault();
    handleValue(key);
    return;
  }

  if (['+', '-', '*', '/', '^', '(', ')', '%'].includes(key)) {
    event.preventDefault();
    if (key === '%') {
      handleAction('percent');
      return;
    }
    appendValue(key);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleAction('equals');
    return;
  }

  if (key === 'Backspace') {
    event.preventDefault();
    handleAction('delete');
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    handleAction('clear');
    return;
  }

  if (key === 'p' || key === 'P') {
    event.preventDefault();
    appendValue('π');
  }
});

updateDisplay('0');
updateHistory('');
updateModeBadge();
updateMemoryBadge();
globalThis.evaluateExpression = evaluateExpression;
