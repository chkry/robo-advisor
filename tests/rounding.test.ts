import { roundToPrecision, toFixed } from '../src/utils/rounding';

describe('roundToPrecision', () => {
  it('rounds to 3 decimal places', () => {
    expect(roundToPrecision(1.23456, 3)).toBe(1.235);
  });

  it('rounds to 2 decimal places', () => {
    expect(roundToPrecision(10.005, 2)).toBe(10.01);
  });

  it('rounds to 0 decimal places', () => {
    expect(roundToPrecision(4.6, 0)).toBe(5);
  });

  it('handles zero', () => {
    expect(roundToPrecision(0, 3)).toBe(0);
  });

  it('handles exact values without change', () => {
    expect(roundToPrecision(1.5, 2)).toBe(1.5);
  });
});

describe('toFixed', () => {
  it('returns string with correct decimals', () => {
    expect(toFixed(3.14159, 2)).toBe('3.14');
  });

  it('pads with zeros if needed', () => {
    expect(toFixed(3, 3)).toBe('3.000');
  });
});
