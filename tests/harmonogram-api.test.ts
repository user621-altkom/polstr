import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/harmonogram/route';

const parametryNadplaty = 'kwota=300000&liczbaRat=240&marza=2.11&wskaznik=WIBOR_3M&typRat=rowne&pierwszaRata=2026-10-01&nadplata%5B0%5D%5BnrRaty%5D=1&nadplata%5B0%5D%5Bkwota%5D=30000';

function zapytanie(efekt?: string): Request {
  const suffix = efekt === undefined ? '' : `&nadplata%5B0%5D%5Befekt%5D=${efekt}`;
  return new Request(`http://localhost/api/harmonogram?${parametryNadplaty}${suffix}`);
}

describe('kontrakt API trybu nadpłaty', () => {
  it.each(['rata', 'okres'])('zwraca jawny efekt %s', async (efekt) => {
    const odpowiedź = await GET(zapytanie(efekt));
    const dane = await odpowiedź.json();

    expect(odpowiedź.status).toBe(200);
    expect(dane.op.nadplaty[0].efekt).toBe(efekt);
  });

  it('przyjmuje brak efektu jako domyślny okres', async () => {
    const odpowiedź = await GET(zapytanie());
    const dane = await odpowiedź.json();

    expect(odpowiedź.status).toBe(200);
    expect(dane.op.nadplaty[0].efekt).toBe('okres');
  });

  it('odrzuca nieznany efekt', async () => {
    const odpowiedź = await GET(zapytanie('nieznany'));

    expect(odpowiedź.status).toBe(400);
  });
});
