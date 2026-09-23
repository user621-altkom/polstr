# Kontrakt API harmonogramu

## Endpoint

`GET /api/harmonogram`

Parametry query:

| Parametr | Format | Wymagany |
|---|---|---|
| `kwota` | dodatnia liczba w zł, np. `400000` | tak |
| `liczbaRat` | dodatnia liczba całkowita | tak |
| `marza` | nieujemne punkty procentowe, np. `2.11` | tak |
| `wskaznik` | `POLSTR_1M` albo `WIBOR_3M` | tak |
| `typRat` | `rowne` albo `malejace` | tak |
| `pierwszaRata` | `YYYY-MM-DD` | tak |
| `nadplata[i][nrRaty]` | dodatnia liczba całkowita | nie |
| `nadplata[i][kwota]` | dodatnia liczba w zł | nie |
| `nadplata[i][efekt]` | `rata` albo `okres` | nie |

Każdy wpis nadpłaty musi mieć wszystkie trzy pola. Route konwertuje `kwota` i kwoty nadpłat na grosze, a `marza` na ułamek przed wywołaniem domeny.

## Odpowiedź 200

```json
{
  "op": {
    "kwota": 400000,
    "liczbaRat": 300,
    "marza": 2.11,
    "typRaty": "rowne",
    "wskaznik": "POLSTR_1M",
    "pierwszaRata": "2026-10-01",
    "nadplaty": []
  },
  "oprocentowanie": 5.66,
  "rataPierwsza": 2494.72,
  "rataOstatnia": 2492.53,
  "sumaOdsetek": 348416.00,
  "sumaKapitalu": 400000.00,
  "sumaNadplat": 0.00,
  "harmonogram": [
    {
      "nr": 1,
      "data": "2026-10-01",
      "oprocentowanie": 5.66,
      "kapital": 608.05,
      "odsetki": 1886.67,
      "rata": 2494.72,
      "saldo": 399391.95,
      "nadplata": 0.00
    }
  ]
}
```

Kwoty odpowiedzi są liczbami w złotych z dokładnością do dwóch miejsc. Kwota `oprocentowanie` w odpowiedzi jest procentem, nie ułamkiem. Wiersze zawierają stopę okresu, aby wynik był czytelny przy zmianach wskaźnika. Powyższy fragment pokazuje kształt kontraktu; liczby w pełnym wyniku są wyznaczane przez domenę.

## Odpowiedź 400

```json
{
  "blad": "kwota: liczba dodatnia w złotych, np. 400000",
  "przyklad": "/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01"
}
```

Status `400` oznacza brakujące lub niepoprawne parametry albo odrzucone dane domenowe. Komunikat nie może ujawniać wyjątku jako poprawnego wyniku.

## Odpowiedź 500

Nieoczekiwany błąd serwera zwraca status `500` i prosty komunikat `{ "blad": "Nie udało się obliczyć harmonogramu" }`. UI pokazuje błąd i nie tworzy zastępczego harmonogramu.
