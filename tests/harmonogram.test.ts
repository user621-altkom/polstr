import { describe, expect, it } from 'vitest';
import {
  generujDatyRat,
  policzHarmonogram,
  walidujParametryKredytu,
  type ParametryKredytu,
  type WpisSerii,
} from '../src/domena/harmonogram';

const poprawneParametry: ParametryKredytu = {
  kwotaGr: 400_000_00,
  liczbaRat: 3,
  marza: 0.0211,
  typRat: 'rowne',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
};

describe('walidacja parametrów domeny', () => {
  it('akceptuje poprawne parametry', () => {
    expect(() => walidujParametryKredytu(poprawneParametry)).not.toThrow();
  });

  it.each([
    ['kwotaGr', { kwotaGr: 0 }],
    ['kwotaGr ułamkowa', { kwotaGr: 1000.5 }],
    ['liczbaRat', { liczbaRat: 0 }],
    ['marża', { marza: -0.01 }],
    ['typ rat', { typRat: 'nieznany' }],
    ['wskaźnik', { wskaznik: 'nieznany' }],
    ['data', { pierwszaRata: '2026-02-30' }],
  ])('odrzuca niepoprawne pole: %s', (_nazwa, zmiana) => {
    expect(() => walidujParametryKredytu({ ...poprawneParametry, ...zmiana })).toThrow();
  });
});

describe('daty rat', () => {
  it('generuje kolejne miesiące bez zmiany dnia raty', () => {
    expect(generujDatyRat('2026-10-01', 3)).toEqual([
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ]);
  });
});

const stałaSeria: WpisSerii[] = [{ od: '2020-01-01', stopa: 0.0355 }];

describe('harmonogram bez nadpłat', () => {
  it('spełnia liczbę kontrolną raty równej', () => {
    const wynik = policzHarmonogram({
      kwotaGr: 40_000_000,
      liczbaRat: 300,
      marza: 0.0211,
      typRat: 'rowne',
      wskaznik: 'POLSTR_1M',
      pierwszaRata: '2026-10-01',
    }, stałaSeria);

    expect(Math.abs(wynik.rataPierwszaGr - 249_472)).toBeLessThanOrEqual(5);
    expect(Math.abs(wynik.rataOstatniaGr - 249_253)).toBeLessThanOrEqual(5);
  });

  it('oblicza raty malejące ze stałą częścią kapitałową', () => {
    const wynik = policzHarmonogram({
      kwotaGr: 120_000,
      liczbaRat: 3,
      marza: 0.02,
      typRat: 'malejace',
      wskaznik: 'POLSTR_1M',
      pierwszaRata: '2026-10-01',
    }, stałaSeria);

    expect(wynik.harmonogram.map((wiersz) => wiersz.kapitalGr)).toEqual([40_000, 40_000, 40_000]);
    expect(wynik.harmonogram[0]?.rataGr).toBeGreaterThan(wynik.harmonogram[1]?.rataGr ?? 0);
    expect(wynik.harmonogram[1]?.rataGr).toBeGreaterThan(wynik.harmonogram[2]?.rataGr ?? 0);
  });

  it('stosuje zmianę wskaźnika od daty obowiązywania i ostatnią znaną wartość', () => {
    const seria: WpisSerii[] = [
      { od: '2026-10-01', stopa: 0.03 },
      { od: '2026-11-01', stopa: 0.04 },
    ];
    const wynik = policzHarmonogram({
      kwotaGr: 30_000,
      liczbaRat: 3,
      marza: 0.02,
      typRat: 'malejace',
      wskaznik: 'POLSTR_1M',
      pierwszaRata: '2026-10-01',
    }, seria);

    expect(wynik.harmonogram.map((wiersz) => wiersz.oprocentowanie)).toEqual([0.05, 0.06, 0.06]);
  });

  it('zamyka saldo i bilansuje kapitał po zaokrągleniach', () => {
    const wynik = policzHarmonogram({
      kwotaGr: 100_001,
      liczbaRat: 7,
      marza: 0.01,
      typRat: 'rowne',
      wskaznik: 'POLSTR_1M',
      pierwszaRata: '2026-10-01',
    }, stałaSeria);

    expect(wynik.harmonogram.every((wiersz) => wiersz.saldoGr >= 0)).toBe(true);
    expect(wynik.sumaKapitaluGr).toBe(100_001);
    expect(wynik.harmonogram.at(-1)?.saldoGr).toBe(0);
  });
});

describe('harmonogram z nadpłatami', () => {
  const parametryNadplaty: ParametryKredytu = {
    kwotaGr: 120_000,
    liczbaRat: 6,
    marza: 0.02,
    typRat: 'rowne',
    wskaznik: 'POLSTR_1M',
    pierwszaRata: '2026-10-01',
  };

  it('obniża kolejne raty przy nadpłacie w trybie rata', () => {
    const bezNadplaty = policzHarmonogram(parametryNadplaty, stałaSeria);
    const zNadplata = policzHarmonogram({
      ...parametryNadplaty,
      nadplaty: [{ nrRaty: 2, kwotaGr: 20_000, efekt: 'rata' }],
    }, stałaSeria);

    expect(zNadplata.harmonogram).toHaveLength(6);
    expect(zNadplata.harmonogram[1]?.nadplataGr).toBe(20_000);
    expect(zNadplata.harmonogram[2]?.rataGr).toBeLessThan(bezNadplaty.harmonogram[2]?.rataGr ?? 0);
  });

  it('skraca okres po nadpłacie w trybie okres', () => {
    const wynik = policzHarmonogram({
      ...parametryNadplaty,
      nadplaty: [{ nrRaty: 2, kwotaGr: 20_000, efekt: 'okres' }],
    }, stałaSeria);

    expect(wynik.harmonogram.length).toBeLessThan(6);
    expect(wynik.harmonogram.at(-1)?.saldoGr).toBe(0);
  });

  it('stosuje wiele nadpłat bez ujemnego salda i zachowuje bilans', () => {
    const wynik = policzHarmonogram({
      ...parametryNadplaty,
      nadplaty: [
        { nrRaty: 2, kwotaGr: 10_000, efekt: 'rata' },
        { nrRaty: 4, kwotaGr: 10_000, efekt: 'rata' },
      ],
    }, stałaSeria);

    expect(wynik.harmonogram.every((wiersz) => wiersz.saldoGr >= 0)).toBe(true);
    expect(wynik.sumaKapitaluGr + wynik.sumaNadplatGr).toBe(parametryNadplaty.kwotaGr);
    expect(wynik.harmonogram.at(-1)?.saldoGr).toBe(0);
  });
});
