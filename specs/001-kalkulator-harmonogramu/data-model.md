# Model danych

## ParametryKredytu

Wejście czystej domeny. Wszystkie wartości finansowe są już przeliczone przez API.

| Pole | Typ | Reguła |
|---|---|---|
| `kwotaGr` | `number` | Dodatnia liczba całkowita w groszach. |
| `liczbaRat` | `number` | Dodatnia liczba całkowita. |
| `marza` | `number` | Nieujemna stopa jako ułamek, np. `0.0211`. |
| `typRat` | `rowne \| malejace` | Sposób wyznaczania regularnego kapitału/rata. |
| `wskaznik` | `POLSTR_1M \| WIBOR_3M` | Klucz serii z `src/dane/wskazniki.ts`. |
| `pierwszaRata` | `string` | Prawidłowa data ISO `YYYY-MM-DD`. |
| `nadplaty` | `Nadplata[]` | Opcjonalna lista nadpłat; brak oznacza pustą listę. |

## Nadplata

| Pole | Typ | Reguła |
|---|---|---|
| `nrRaty` | `number` | Dodatnia liczba całkowita, nie większa niż `liczbaRat`. |
| `kwotaGr` | `number` | Dodatnia liczba całkowita w groszach. |
| `efekt` | `rata \| okres` | `rata` zachowuje termin i obniża przyszłą ratę; `okres` zachowuje zasadę raty i kończy harmonogram wcześniej. |

Wiele nadpłat dla tego samego numeru raty jest agregowanych w jeden wpis przed obliczeniami; wpisy mogą mieć różne skutki tylko wtedy, gdy API odrzuci taki konflikt jako niejednoznaczny. Nadpłata większa od pozostałego salda jest ograniczana do salda, a harmonogram kończy się z saldem `0`.

## WpisSerii

Adapter danych historycznych.

| Pole | Typ | Reguła |
|---|---|---|
| `od` | `string` | Data ISO początku obowiązywania. |
| `stopa` | `number` | Stopa roczna jako ułamek, np. `0.0355`. |

Dla daty raty wybierany jest ostatni wpis, którego `od` jest nie późniejsze niż data raty. Jeżeli data jest po końcu serii, pozostaje ostatni wpis.

## WierszHarmonogramu

Wynik domenowy jednego okresu:

- `nr`: numer raty,
- `data`: data raty ISO,
- `oprocentowanie`: stopa roczna wskaźnik + marża,
- `kapitalGr`: regularna część kapitałowa w groszach,
- `odsetkiGr`: odsetki za okres w groszach,
- `rataGr`: suma regularnego kapitału i odsetek w groszach,
- `nadplataGr`: nadpłata zastosowana w okresie w groszach,
- `saldoGr`: saldo po wszystkich spłatach okresu w groszach.

## WynikHarmonogramu

Zawiera znormalizowane parametry, wiersze oraz podsumowanie:

- `oprocentowanie`: informacja o stopie z pierwszego okresu; każdy wiersz zawiera stopę właściwą dla siebie,
- `rataPierwszaGr`, `rataOstatniaGr`, `sumaOdsetekGr`, `sumaKapitaluGr`, `sumaNadplatGr`,
- `harmonogram: WierszHarmonogramu[]`.

Inwarianty:

1. `saldoGr >= 0` w każdym wierszu.
2. `sumaKapitaluGr + sumaNadplatGr = kwotaGr` dla zakończonego harmonogramu.
3. Ostatni wiersz ma `saldoGr = 0`.
4. Odsetki są liczone od salda z początku okresu, przed regularnym kapitałem i nadpłatą.
5. Daty wierszy są kolejnymi okresami miesięcznymi od `pierwszaRata`; zmiana wskaźnika nie zmienia dat.
