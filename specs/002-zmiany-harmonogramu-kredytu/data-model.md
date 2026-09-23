# Model danych: Wybór skutku nadpłaty

## Nadplata wejściowa

Reprezentuje pojedynczą nadpłatę otrzymaną z formularza lub query string.

| Pole | Typ | Reguła |
|---|---|---|
| `nrRaty` | `number` | Dodatnia liczba całkowita, nie większa niż `liczbaRat`. |
| `kwotaGr` | `number` | Dodatnia liczba całkowita w groszach. |
| `efekt` | `rata \| okres \| undefined` | Opcjonalne na wejściu; brak oznacza `okres`. |

## Nadplata znormalizowana

Wewnętrzna postać używana przez obliczenia domenowe.

| Pole | Typ | Reguła |
|---|---|---|
| `nrRaty` | `number` | Zachowany numer okresu nadpłaty. |
| `kwotaGr` | `number` | Kwota po agregacji wpisów dla tego samego numeru raty, ograniczana do bieżącego salda podczas obliczeń. |
| `efekt` | `rata \| okres` | Zawsze obecny; brak wejścia jest znormalizowany do `okres`. |

Wpisy dla tego samego numeru raty są agregowane. Konflikt jawnych efektów dla jednego numeru raty pozostaje błędem walidacji.

## Okres harmonogramu

Istniejący wynik okresu pozostaje bez zmian:

- `kapitalGr`: regularna część kapitałowa,
- `odsetkiGr`: odsetki od salda na początku okresu,
- `rataGr`: suma regularnego kapitału i odsetek,
- `nadplataGr`: nadpłata zastosowana po racie,
- `saldoGr`: saldo po racie i nadpłacie.

## Reguły przejścia

1. Wyznacz odsetki i regularną ratę od salda sprzed nadpłaty.
2. Zmniejsz saldo o regularny kapitał.
3. Zastosuj nadpłatę, ograniczając ją do pozostałego salda.
4. Dla efektu `rata` przelicz ratę równą na pozostałą liczbę okresów; nowa rata obowiązuje od następnego okresu.
5. Dla efektu `okres` nie przeliczaj raty; kontynuuj z dotychczasową ratą aż do wyzerowania salda.
6. Ostatni okres koryguje kapitał do pozostałego salda, a saldo końcowe musi wynosić zero.

## Inwarianty

- `saldoGr >= 0` w każdym wierszu.
- `sumaKapitaluGr + sumaNadplatGr = kwotaGr` po zakończeniu harmonogramu.
- Brak nadpłat nie zmienia dotychczasowego wyniku.
