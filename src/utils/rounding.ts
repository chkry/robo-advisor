export function roundToPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export function toFixed(value: number, precision: number): string {
  return value.toFixed(precision);
}
