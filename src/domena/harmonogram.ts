export interface ParametryKredytu {
  kwotaGr: number;
  liczbaRat: number;
  marza: number;
  typRat: 'rowne' | 'malejace';
  wskaznik: 'POLSTR_1M' | 'WIBOR_3M';
  pierwszaRata: string;
  nadplaty?: Nadplata[];
}

export interface Nadplata {
  nrRaty: number;
  kwotaGr: number;
  efekt?: 'rata' | 'okres';
}

export interface WpisSerii {
  od: string;
  stopa: number;
}

export interface WierszHarmonogramu {
  nr: number;
  data: string;
  oprocentowanie: number;
  kapitalGr: number;
  odsetkiGr: number;
  rataGr: number;
  nadplataGr: number;
  saldoGr: number;
}

export interface WynikHarmonogramu {
  parametry: ParametryKredytu;
  oprocentowanie: number;
  rataPierwszaGr: number;
  rataOstatniaGr: number;
  sumaOdsetekGr: number;
  sumaKapitaluGr: number;
  sumaNadplatGr: number;
  harmonogram: WierszHarmonogramu[];
}

export class BladWalidacji extends Error {
  constructor(komunikat: string) {
    super(komunikat);
    this.name = 'BladWalidacji';
  }
}

function jestDodatniaLiczbaCałkowita(wartość: unknown): wartość is number {
  return typeof wartość === 'number' && Number.isInteger(wartość) && wartość > 0;
}

function jestNieujemnąStopą(wartość: unknown): wartość is number {
  return typeof wartość === 'number' && Number.isFinite(wartość) && wartość >= 0;
}

function jestDatąIso(data: unknown): data is string {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [rokTekst, miesiącTekst, dzieńTekst] = data.split('-');
  const rok = Number(rokTekst ?? 0);
  const miesiąc = Number(miesiącTekst ?? 0);
  const dzień = Number(dzieńTekst ?? 0);
  const dataUtc = new Date(Date.UTC(rok, miesiąc - 1, dzień));
  return dataUtc.getUTCFullYear() === rok
    && dataUtc.getUTCMonth() === miesiąc - 1
    && dataUtc.getUTCDate() === dzień;
}

export function walidujParametryKredytu(parametry: unknown): asserts parametry is ParametryKredytu {
  if (typeof parametry !== 'object' || parametry === null) {
    throw new BladWalidacji('parametry kredytu muszą być obiektem');
  }

  const dane = parametry as Record<string, unknown>;
  if (!jestDodatniaLiczbaCałkowita(dane.kwotaGr)) {
    throw new BladWalidacji('kwotaGr musi być dodatnią liczbą całkowitą');
  }
  if (!jestDodatniaLiczbaCałkowita(dane.liczbaRat)) {
    throw new BladWalidacji('liczbaRat musi być dodatnią liczbą całkowitą');
  }
  if (!jestNieujemnąStopą(dane.marza)) {
    throw new BladWalidacji('marza musi być nieujemną stopą');
  }
  if (dane.typRat !== 'rowne' && dane.typRat !== 'malejace') {
    throw new BladWalidacji('typRat musi być rowne albo malejace');
  }
  if (dane.wskaznik !== 'POLSTR_1M' && dane.wskaznik !== 'WIBOR_3M') {
    throw new BladWalidacji('wskaznik musi być POLSTR_1M albo WIBOR_3M');
  }
  if (!jestDatąIso(dane.pierwszaRata)) {
    throw new BladWalidacji('pierwszaRata musi być poprawną datą YYYY-MM-DD');
  }
}

function formatujDatęIso(data: Date): string {
  return [data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate()]
    .map((wartość, indeks) => indeks === 0 ? String(wartość).padStart(4, '0') : String(wartość).padStart(2, '0'))
    .join('-');
}

export function generujDatyRat(pierwszaRata: string, liczbaRat: number): string[] {
  if (!jestDatąIso(pierwszaRata) || !jestDodatniaLiczbaCałkowita(liczbaRat)) {
    throw new BladWalidacji('nie można wygenerować dat rat dla niepoprawnych parametrów');
  }

  const [rokTekst, miesiącTekst, dzieńTekst] = pierwszaRata.split('-');
  const rok = Number(rokTekst ?? 0);
  const miesiąc = Number(miesiącTekst ?? 0);
  const dzień = Number(dzieńTekst ?? 0);
  return Array.from({ length: liczbaRat }, (_, indeks) => {
    const data = new Date(Date.UTC(rok, miesiąc - 1 + indeks, 1));
    const ostatniDzieńMiesiąca = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
    data.setUTCDate(Math.min(dzień, ostatniDzieńMiesiąca));
    return formatujDatęIso(data);
  });
}

export function znajdzStopeDlaDaty(seria: WpisSerii[], data: string): number {
  if (seria.length === 0 || !jestDatąIso(data)) {
    throw new BladWalidacji('seria wskaźnika i data muszą być poprawne');
  }

  const obowiązującyWpis = seria.reduce<WpisSerii | undefined>((ostatni, wpis) => {
    if (wpis.od <= data && (ostatni === undefined || wpis.od > ostatni.od)) {
      return wpis;
    }
    return ostatni;
  }, undefined);

  const pierwszyWpis = seria.at(0);
  if (!pierwszyWpis) {
    throw new BladWalidacji('seria wskaźnika nie może być pusta');
  }
  return obowiązującyWpis?.stopa ?? pierwszyWpis.stopa;
}

function zaokrąglijDoGrosza(wartość: number): number {
  return Math.round(wartość);
}

function obliczRateRowna(saldoGr: number, liczbaRat: number, stopaRoczna: number): number {
  const stopaMiesięczna = stopaRoczna / 12;
  if (stopaMiesięczna === 0) {
    return zaokrąglijDoGrosza(saldoGr / liczbaRat);
  }

  return zaokrąglijDoGrosza(
    saldoGr * stopaMiesięczna / (1 - (1 + stopaMiesięczna) ** -liczbaRat),
  );
}

function przygotujNadplaty(parametry: ParametryKredytu): Map<number, Nadplata> {
  const nadplaty = new Map<number, Nadplata>();
  for (const nadplata of parametry.nadplaty ?? []) {
    const efekt = nadplata.efekt ?? 'okres';
    if (!jestDodatniaLiczbaCałkowita(nadplata.nrRaty)
      || nadplata.nrRaty > parametry.liczbaRat
      || !jestDodatniaLiczbaCałkowita(nadplata.kwotaGr)
      || (efekt !== 'rata' && efekt !== 'okres')) {
      throw new BladWalidacji('nadpłata ma niepoprawny numer, kwotę albo efekt');
    }

    const poprzednia = nadplaty.get(nadplata.nrRaty);
    if (poprzednia && poprzednia.efekt !== efekt) {
      throw new BladWalidacji('nadpłaty w jednym numerze raty muszą mieć ten sam efekt');
    }
    nadplaty.set(nadplata.nrRaty, {
      nrRaty: nadplata.nrRaty,
      kwotaGr: (poprzednia?.kwotaGr ?? 0) + nadplata.kwotaGr,
      efekt,
    });
  }
  return nadplaty;
}

export function policzHarmonogram(
  parametry: ParametryKredytu,
  seria: WpisSerii[] = [],
): WynikHarmonogramu {
  walidujParametryKredytu(parametry);
  if (seria.length === 0) {
    throw new BladWalidacji('seria wskaźnika nie może być pusta');
  }

  const nadplaty = przygotujNadplaty(parametry);
  const datyRat = generujDatyRat(parametry.pierwszaRata, parametry.liczbaRat);
  const regularnyKapitalGr = zaokrąglijDoGrosza(parametry.kwotaGr / parametry.liczbaRat);
  const harmonogram: WierszHarmonogramu[] = [];
  let saldoGr = parametry.kwotaGr;
  let rataRownaGr: number | undefined;
  let poprzedniaStopa: number | undefined;
  let wymagaPrzeliczeniaRaty = true;

  for (let indeks = 0; indeks < datyRat.length && saldoGr > 0; indeks += 1) {
    const nr = indeks + 1;
    const data = datyRat[indeks];
    if (!data) {
      break;
    }
    const stopaRoczna = znajdzStopeDlaDaty(seria, data) + parametry.marza;
    const odsetkiGr = zaokrąglijDoGrosza(saldoGr * stopaRoczna / 12);
    const ostatniOkres = nr === parametry.liczbaRat;
    if (parametry.typRat === 'rowne' && (wymagaPrzeliczeniaRaty || poprzedniaStopa !== stopaRoczna)) {
      rataRownaGr = obliczRateRowna(saldoGr, parametry.liczbaRat - indeks, stopaRoczna);
      wymagaPrzeliczeniaRaty = false;
    }
    const kapitalGr = ostatniOkres
      ? saldoGr
      : Math.min(
        saldoGr,
        parametry.typRat === 'rowne'
          ? Math.max(0, (rataRownaGr ?? 0) - odsetkiGr)
          : regularnyKapitalGr,
      );
    const rataGr = kapitalGr + odsetkiGr;
    saldoGr -= kapitalGr;
    const zaplanowanaNadplata = nadplaty.get(nr);
    const nadplataGr = Math.min(saldoGr, zaplanowanaNadplata?.kwotaGr ?? 0);
    saldoGr -= nadplataGr;
    if (zaplanowanaNadplata?.efekt === 'rata' && nadplataGr > 0) {
      wymagaPrzeliczeniaRaty = true;
    }
    poprzedniaStopa = stopaRoczna;

    harmonogram.push({
      nr,
      data,
      oprocentowanie: stopaRoczna,
      kapitalGr,
      odsetkiGr,
      rataGr,
      nadplataGr,
      saldoGr,
    });
  }

  return {
    parametry: { ...parametry, nadplaty: [...nadplaty.values()] },
    oprocentowanie: harmonogram[0]?.oprocentowanie ?? parametry.marza,
    rataPierwszaGr: harmonogram[0]?.rataGr ?? 0,
    rataOstatniaGr: harmonogram.at(-1)?.rataGr ?? 0,
    sumaOdsetekGr: harmonogram.reduce((suma, wiersz) => suma + wiersz.odsetkiGr, 0),
    sumaKapitaluGr: harmonogram.reduce((suma, wiersz) => suma + wiersz.kapitalGr, 0),
    sumaNadplatGr: harmonogram.reduce((suma, wiersz) => suma + wiersz.nadplataGr, 0),
    harmonogram,
  };
}
