export interface CountFlipFormatOptions {
  count?: number;
  unit?: string;
  unitThreshold?: number;
  showDecimal?: boolean;
  decimalPlaces?: number;
  divideRatio?: number;
}

/** 将数值格式化为牌子字符数组 */
export function formatCountFlipValue(value: number, options: CountFlipFormatOptions = {}): string[] {
  const count = options.count ?? 9;
  const unit = options.unit ?? '万';
  const unitThreshold = options.unitThreshold ?? 1_000_000;
  const showDecimal = options.showDecimal !== false;
  const decimalPlaces = options.decimalPlaces ?? 1;
  const divideRatio = options.divideRatio ?? 10_000;

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return Array.from({ length: count }, () => '0');
  }

  const abs = Math.abs(num);
  const useUnit = abs >= unitThreshold;

  if (useUnit && showDecimal) {
    const wan = abs / divideRatio;
    const fixed = wan.toFixed(decimalPlaces);
    const [intPart = '0', decPart = '0'] = fixed.split('.');
    const intSlotCount = count - 2 - decimalPlaces;
    let intPadded = intPart;
    if (intPadded.length > intSlotCount) {
      intPadded = intPadded.slice(-intSlotCount);
    } else {
      intPadded = intPadded.padStart(intSlotCount, '0');
    }
    const decChars = (decPart || '0').padEnd(decimalPlaces, '0').slice(0, decimalPlaces);
    return [...intPadded.split(''), '.', ...decChars.split(''), unit];
  }

  if (useUnit) {
    const wanInt = Math.round(abs / divideRatio);
    const intSlotCount = count - 1;
    const intStr = String(wanInt);
    const intPadded = intStr.length > intSlotCount ? intStr.slice(-intSlotCount) : intStr.padStart(intSlotCount, '0');
    return [...intPadded.split(''), unit];
  }

  const intStr = String(Math.floor(abs));
  if (intStr.length > count) {
    return intStr.slice(-count).split('');
  }
  return intStr.padStart(count, '0').split('');
}
