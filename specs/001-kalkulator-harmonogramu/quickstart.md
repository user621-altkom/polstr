# Quickstart walidacji

## Prerequisites

- Node.js zgodny z `package.json` (`>=22`).
- Zależności zainstalowane poleceniem `npm install`.
- Repozytorium uruchamiane z katalogu głównego projektu.

## Walidacja domeny

1. Dodaj testy w `tests/` przed implementacją każdej reguły finansowej.
2. Uruchom `npm test`.
3. Zweryfikuj liczby kontrolne:
   - 400 000 zł, 300 rat równych, 5,66% rocznie: pierwsza rata około 2 494,72 zł, ostatnia około 2 492,53 zł;
   - rata malejąca ma stały kapitał i malejące odsetki;
   - zmiana wpisu serii zmienia stopę od właściwej daty raty;
   - po końcu serii pozostaje ostatnia znana stopa;
   - nadpłata `rata` obniża kolejne raty przy zachowaniu terminu;
   - nadpłata `okres` kończy harmonogram wcześniej;
   - suma regularnego kapitału i nadpłat równa się kwocie kredytu, a saldo końcowe wynosi zero.

## Walidacja API

Uruchom `npm run dev`, a następnie wywołaj:

```text
http://localhost:3000/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01
```

Oczekiwany wynik to `200` z `harmonogram`, podsumowaniem i kwotami w złotych. Dodaj parametry nadpłaty zgodnie z [kontraktem API](contracts/harmonogram-api.md) i sprawdź obecność `nadplata` w odpowiednich wierszach.

Wywołaj także adres z pustym `kwota` albo niepoprawnym `typRat`. Oczekiwany wynik to `400` z polem `blad`, bez obliczeń zastępczych.

## Walidacja UI

1. Otwórz `http://localhost:3000`.
2. Wprowadź dane kontrolne i wybierz „Policz”.
3. Sprawdź, że podsumowanie pokazuje pierwszą i ostatnią ratę, sumę odsetek oraz oprocentowanie, a tabela nie wykonuje własnych obliczeń.
4. Dodaj nadpłaty w obu trybach i sprawdź, że wynik odpowiada API.
5. Zmień parametr i ponownie wybierz „Policz”; poprzedni wynik zostaje zastąpiony nowym.
6. Użyj „Eksport CSV” i sprawdź nagłówki, wszystkie wiersze wyniku oraz kolumnę nadpłaty.
7. Zasymuluj błąd API. Ekran ma pokazać komunikat błędu i nie prezentować fallbackowego harmonogramu jako poprawnego wyniku.

## Bramka jakości

Przed zakończeniem fazy uruchom kolejno:

```text
npm test
npm run typecheck
npm run build
```

Wszystkie trzy polecenia muszą zakończyć się powodzeniem. Wydajność kontrolną można sprawdzić przez `curl` lub przeglądarkę dla 300 rat; wynik powinien pojawić się w czasie do 5 sekund.
