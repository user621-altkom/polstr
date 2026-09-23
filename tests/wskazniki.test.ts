import { describe, expect, it } from 'vitest';
import { znajdzStopeDlaDaty } from '../src/domena/harmonogram';
import { seriaWskaznika } from '../src/dane/wskazniki';

describe('wybór historycznej stopy wskaźnika', () => {
  it('wybiera ostatni wpis obowiązujący w dniu raty', () => {
    const seria = [
      { od: '2026-01-01', stopa: 0.04 },
      { od: '2026-02-01', stopa: 0.035 },
    ];

    expect(znajdzStopeDlaDaty(seria, '2026-01-31')).toBe(0.04);
    expect(znajdzStopeDlaDaty(seria, '2026-02-01')).toBe(0.035);
  });

  it('używa ostatniej znanej wartości po końcu serii', () => {
    const seria = seriaWskaznika('POLSTR_1M');
    const ostatnia = seria.at(-1)?.stopa;

    expect(ostatnia).toBeDefined();
    expect(znajdzStopeDlaDaty(seria, '2099-01-01')).toBe(ostatnia);
  });
});
