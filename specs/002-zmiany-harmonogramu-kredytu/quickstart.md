# Quickstart: walidacja CR-A

## Prerequisites

- Node.js 22+
- Zainstalowane zależności projektu
- PowerShell w katalogu repozytorium

## Walidacja domeny

Uruchom testy:

```powershell
npm test
```

Oczekiwane przypadki:

- kredyt 300 000 zł, 240 rat, 6,66%, nadpłata 30 000 zł po racie 1,
- tryb `rata`: 240 rat łącznie, kolejna rata 2 038,11 zł,
- tryb `okres`: 196 rat łącznie, rata regularna 2 265,07 zł, ostatnia rata 2 200,53 zł,
- brak trybu: wynik identyczny z trybem `okres`,
- suma kapitału i nadpłat równa 300 000 zł, saldo końcowe 0,00 zł,
- wiele nadpłat i brak ujemnego salda.

## Walidacja jakości

```powershell
npm run typecheck
npm run build
```

Wszystkie trzy polecenia muszą zakończyć się kodem 0.

## Walidacja API

Po uruchomieniu aplikacji:

```powershell
npm run dev
```

Sprawdź endpoint z jawnym trybem obniżenia raty:

```text
/api/harmonogram?kwota=300000&liczbaRat=240&marza=2.11&wskaznik=WIBOR_3M&typRat=rowne&pierwszaRata=2026-10-01&nadplata[0][nrRaty]=1&nadplata[0][kwota]=30000&nadplata[0][efekt]=rata
```

Sprawdź endpoint bez pola `efekt`. Powinien zwrócić znormalizowany efekt `okres` i wcześniejsze zakończenie harmonogramu:

```text
/api/harmonogram?kwota=300000&liczbaRat=240&marza=2.11&wskaznik=WIBOR_3M&typRat=rowne&pierwszaRata=2026-10-01&nadplata[0][nrRaty]=1&nadplata[0][kwota]=30000
```

W obu odpowiedziach sprawdź, że suma kapitału i nadpłat wynosi 300 000,00 zł, a saldo końcowe wynosi 0,00 zł.
