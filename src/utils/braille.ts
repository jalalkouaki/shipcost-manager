/**
 * Unified English Braille (UEB) Grade 1 & ASCII Braille Utility
 * Converts text, numbers, and structured logistics reports into standard Braille.
 */

// Unicode Braille Patterns: U+2800 to U+283F
const BRAILLE_LETTERS: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑',
  f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕',
  p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
};

const BRAILLE_DIGITS: Record<string, string> = {
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
};

const BRAILLE_PUNCTUATION: Record<string, string> = {
  ' ': '⠀',
  ',': '⠂',
  ';': '⠆',
  ':': '⠒',
  '.': '⠲',
  '!': '⠖',
  '?': '⠦',
  '-': '⠤',
  '_': '⠤',
  '/': '⠸⠌',
  '(': '⠐⠣',
  ')': '⠐⠜',
  '[': '⠐⠣',
  ']': '⠐⠜',
  '$': '⠈⠎',
  '%': '⠨⠴',
  '#': '⠼',
  '+': '⠐⠖',
  '=': '⠐⠶',
};

// North American / UEB ASCII Braille representation for .brf embossers
const ASCII_BRAILLE: Record<string, string> = {
  '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e',
  '6': 'f', '7': 'g', '8': 'h', '9': 'i', '0': 'j',
};

/**
 * Converts standard text to Grade 1 Unicode Braille.
 */
export function textToUnicodeBraille(text: string): string {
  let result = '';
  let inNumber = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '\n') {
      result += '\n';
      inNumber = false;
      continue;
    }

    if (/[0-9]/.test(char)) {
      if (!inNumber) {
        result += '⠼'; // Number sign
        inNumber = true;
      }
      result += BRAILLE_DIGITS[char] || char;
      continue;
    } else {
      inNumber = false;
    }

    if (/[A-Z]/.test(char)) {
      result += '⠠'; // Capital indicator
      result += BRAILLE_LETTERS[char.toLowerCase()] || char;
      continue;
    }

    if (/[a-z]/.test(char)) {
      result += BRAILLE_LETTERS[char] || char;
      continue;
    }

    if (BRAILLE_PUNCTUATION[char]) {
      result += BRAILLE_PUNCTUATION[char];
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Converts standard text to BRF (Braille Ready Format) ASCII Braille.
 */
export function textToAsciiBraille(text: string): string {
  let result = '';
  let inNumber = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '\n') {
      result += '\r\n';
      inNumber = false;
      continue;
    }

    if (/[0-9]/.test(char)) {
      if (!inNumber) {
        result += '#';
        inNumber = true;
      }
      result += ASCII_BRAILLE[char] || char;
      continue;
    } else {
      inNumber = false;
    }

    if (/[A-Z]/.test(char)) {
      result += ','; // Cap indicator in BRF
      result += char.toLowerCase();
      continue;
    }

    if (/[a-z]/.test(char)) {
      result += char;
      continue;
    }

    // Common ASCII Braille punctuation
    switch (char) {
      case ' ': result += ' '; break;
      case ',': result += '1'; break;
      case ';': result += '2'; break;
      case ':': result += '3'; break;
      case '.': result += '4'; break;
      case '!': result += '6'; break;
      case '?': result += '8'; break;
      case '-': result += '-'; break;
      case '(': result += '('; break;
      case ')': result += ')'; break;
      default: result += char; break;
    }
  }

  return result;
}

export interface ScenarioReportData {
  scenarioName: string;
  product: {
    unitCost: number;
    annualDemand: number;
    holdingRate: number;
    safetyStock: number;
    dutyRate?: number;
  };
  profiles: Array<{
    id: string;
    name: string;
    type: string;
    optimalQ: number;
    minTotalCost: number;
    shippingCost: number;
    holdingCost: number;
    daysOfInventory: number;
    cashTiedUp: number;
    isBest?: boolean;
  }>;
  currency: string;
}

/**
 * Builds a comprehensive Braille report file (.brf / .txt)
 * containing tactile Unicode Braille, embossable BRF ASCII Braille, and plain text transcript.
 */
export function generateBrailleReport(data: ScenarioReportData): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const curr = data.currency || 'MAD';
  const sep = /^[A-Za-z]+$/.test(curr) ? ' ' : '';
  const fmt = (val: number) => `${curr}${sep}${val.toFixed(2)}`;

  // Plain Text Layout
  const textContent = [
    `SHIPCOST OPTIMIZER - LOGISTICS & EOQ ANALYSIS REPORT`,
    `DATE: ${dateStr}`,
    `SCENARIO: ${data.scenarioName.toUpperCase()}`,
    ``,
    `PRODUCT PARAMETERS:`,
    `- ANNUAL DEMAND: ${data.product.annualDemand.toLocaleString()} UNITS`,
    `- UNIT BASE COST: ${fmt(data.product.unitCost)}`,
    `- DUTY TARIFF: ${(data.product.dutyRate || 0).toFixed(1)}%`,
    `- ANNUAL HOLDING RATE: ${data.product.holdingRate.toFixed(1)}%`,
    `- SAFETY STOCK: ${data.product.safetyStock.toLocaleString()} UNITS`,
    ``,
    `SHIPPING PROFILES & OPTIMIZATION RESULTS:`,
    ...data.profiles.map(p => [
      `PROFILE: ${p.name.toUpperCase()} [${p.type.toUpperCase()}]${p.isBest ? ' *** RECOMMENDED ***' : ''}`,
      `  * OPTIMAL ORDER QTY (Q): ${p.optimalQ.toLocaleString()} UNITS`,
      `  * TOTAL ANNUAL COST: ${fmt(p.minTotalCost)}`,
      `  * FREIGHT EXPENDITURE: ${fmt(p.shippingCost)}`,
      `  * INVENTORY HOLDING COST: ${fmt(p.holdingCost)}`,
      `  * CASH TIED UP: ${fmt(p.cashTiedUp)}`,
      `  * DAYS OF INVENTORY: ${p.daysOfInventory.toFixed(1)} DAYS`,
      ``
    ].join('\n')),
    `SUMMARY:`,
    `OPTIMAL CHOICE: ${data.profiles.find(p => p.isBest)?.name.toUpperCase() || 'N/A'}`,
    `GENERATED BY SHIPCOST OPTIMIZER`
  ].join('\n');

  const unicodeBraille = textToUnicodeBraille(textContent);
  const asciiBraille = textToAsciiBraille(textContent);

  return [
    `================================================================================`,
    `SHIPCOST OPTIMIZER - ACCESSIBILITY BRAILLE EXPORT`,
    `FILE TYPE: Braille Ready Format (.brf) & Unicode Braille (.txt)`,
    `================================================================================`,
    ``,
    `SECTION 1: UNICODE BRAILLE (GRADE 1 UEB)`,
    `--------------------------------------------------------------------------------`,
    unicodeBraille,
    ``,
    `--------------------------------------------------------------------------------`,
    `SECTION 2: EMBOSSABLE ASCII BRAILLE (STANDARD .BRF FORMAT)`,
    `--------------------------------------------------------------------------------`,
    asciiBraille,
    ``,
    `--------------------------------------------------------------------------------`,
    `SECTION 3: PRINT TEXT TRANSCRIPT`,
    `--------------------------------------------------------------------------------`,
    textContent,
    `================================================================================`,
  ].join('\n');
}
