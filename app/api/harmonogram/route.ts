import { NextResponse } from 'next/server';
import { BladWalidacji, policzHarmonogram, type Nadplata, type ParametryKredytu, type WynikHarmonogramu } from '../../../src/domena/harmonogram';
import { seriaWskaznika } from '../../../src/dane/wskazniki';

// Route handler jest cienki: parsuje parametry z query string, woła domenę, zwraca JSON.
// Żadnych obliczeń finansowych w tym pliku. Przeliczenie jednostek wejścia
// (złote na grosze, punkty procentowe na ułamek) to część parsowania kontraktu API.

const PRZYKLAD =
  '/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01';

function parsujLiczbe(szukanaWartość: string | null): number {
  if (szukanaWartość === null || szukanaWartość.trim() === '') {
    throw new BladWalidacji('wartość jest wymagana i musi być liczbą');
  }
  const wartość = Number(szukanaWartość);
  if (!Number.isFinite(wartość)) {
    throw new BladWalidacji('wartość musi być liczbą');
  }
  return wartość;
}

function parsujNadplaty(szukane: URLSearchParams): Nadplata[] {
  const wpisy = new Map<number, Partial<Nadplata>>();
  for (const [klucz, wartość] of szukane.entries()) {
    const dopasowanie = /^nadplata\[(\d+)\]\[(nrRaty|kwota|efekt)\]$/.exec(klucz);
    if (!dopasowanie) continue;

    const indeks = Number(dopasowanie[1]);
    const pole = dopasowanie[2];
    const wpis = wpisy.get(indeks) ?? {};
    if (pole === 'nrRaty') wpis.nrRaty = parsujLiczbe(wartość);
    if (pole === 'kwota') wpis.kwotaGr = Math.round(parsujLiczbe(wartość) * 100);
    if (pole === 'efekt') {
      if (wartość !== 'rata' && wartość !== 'okres') {
        throw new BladWalidacji('efekt nadpłaty musi być rata albo okres');
      }
      wpis.efekt = wartość;
    }
    wpisy.set(indeks, wpis);
  }

  return [...wpisy.entries()].sort(([pierwszy], [drugi]) => pierwszy - drugi).map(([, wpis]) => {
    if (!Number.isInteger(wpis.nrRaty) || !wpis.nrRaty || !wpis.kwotaGr) {
      throw new BladWalidacji('nadpłata musi zawierać nrRaty i kwotę');
    }
    return {
      nrRaty: wpis.nrRaty,
      kwotaGr: wpis.kwotaGr,
      efekt: wpis.efekt ?? 'okres',
    } as Nadplata;
  });
}

function parsujParametry(szukane: URLSearchParams): ParametryKredytu {
  const kwota = parsujLiczbe(szukane.get('kwota'));
  const liczbaRat = parsujLiczbe(szukane.get('liczbaRat'));
  const marza = parsujLiczbe(szukane.get('marza'));
  const wskaznik = szukane.get('wskaznik');
  const typRat = szukane.get('typRat');
  const pierwszaRata = szukane.get('pierwszaRata') ?? '';

  return {
    kwotaGr: Math.round(kwota * 100),
    liczbaRat,
    marza: marza / 100,
    wskaznik: wskaznik as ParametryKredytu['wskaznik'],
    typRat: typRat as ParametryKredytu['typRat'],
    pierwszaRata,
    nadplaty: parsujNadplaty(szukane),
  };
}

function doZłotych(grosze: number): number {
  return Number((grosze / 100).toFixed(2));
}

function serializujWynik(wynik: WynikHarmonogramu) {
  return {
    op: {
      kwota: doZłotych(wynik.parametry.kwotaGr),
      liczbaRat: wynik.parametry.liczbaRat,
      marza: Number((wynik.parametry.marza * 100).toFixed(2)),
      typRaty: wynik.parametry.typRat,
      wskaznik: wynik.parametry.wskaznik,
      pierwszaRata: wynik.parametry.pierwszaRata,
      nadplaty: (wynik.parametry.nadplaty ?? []).map((nadplata) => ({
        nrRaty: nadplata.nrRaty,
        kwota: doZłotych(nadplata.kwotaGr),
        efekt: nadplata.efekt,
      })),
    },
    oprocentowanie: Number((wynik.oprocentowanie * 100).toFixed(2)),
    rataPierwsza: doZłotych(wynik.rataPierwszaGr),
    rataOstatnia: doZłotych(wynik.rataOstatniaGr),
    sumaOdsetek: doZłotych(wynik.sumaOdsetekGr),
    sumaKapitalu: doZłotych(wynik.sumaKapitaluGr),
    sumaNadplat: doZłotych(wynik.sumaNadplatGr),
    harmonogram: wynik.harmonogram.map((wiersz) => ({
      nr: wiersz.nr,
      data: wiersz.data,
      oprocentowanie: Number((wiersz.oprocentowanie * 100).toFixed(2)),
      kapital: doZłotych(wiersz.kapitalGr),
      odsetki: doZłotych(wiersz.odsetkiGr),
      rata: doZłotych(wiersz.rataGr),
      saldo: doZłotych(wiersz.saldoGr),
      nadplata: doZłotych(wiersz.nadplataGr),
    })),
  };
}

export function GET(request: Request) {
  try {
    const parametry = parsujParametry(new URL(request.url).searchParams);
    const harmonogram = policzHarmonogram(parametry, seriaWskaznika(parametry.wskaznik));
    return NextResponse.json(serializujWynik(harmonogram));
  } catch (blad) {
    if (blad instanceof BladWalidacji) {
      return NextResponse.json({ blad: blad.message, przyklad: PRZYKLAD }, { status: 400 });
    }
    return NextResponse.json({ blad: 'Nie udało się obliczyć harmonogramu' }, { status: 500 });
  }
}
