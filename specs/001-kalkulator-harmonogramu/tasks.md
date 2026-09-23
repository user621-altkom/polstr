---

description: "Lista zadań implementacji kalkulatora harmonogramu spłat"
---

# Zadania: Kalkulator harmonogramu spłat

**Input**: Dokumenty projektowe z `specs/001-kalkulator-harmonogramu/`

**Zakres**: Next.js App Router, TypeScript strict, czysta domena w `src/domena/`, dane wskaźników w `src/dane/`, Vitest w `tests/`, bez nowych zależności.

**Zasada TDD**: Zadania testowe dla każdej reguły domenowej należy wykonać przed zadaniem implementacyjnym i potwierdzić, że test początkowo nie przechodzi.

**Konwencja jednostek**: Domena przechowuje kwoty jako całkowite grosze i stopy jako ułamki. Route konwertuje wejście API na te jednostki i serializuje wynik do złotych z dwoma miejscami.

## Faza 1: Setup

**Cel**: Wykorzystać istniejący projekt Next.js i jego konfigurację.

Projekt, zależności, Vitest, TypeScript strict, Tailwind i katalogi źródłowe już istnieją. Brak dodatkowych zadań setupowych i brak nowych zależności.

## Faza 2: Fundamenty blokujące

**Cel**: Przygotować wspólne typy, walidację, daty i wybór serii, zanim powstaną historie użytkownika.

- [X] T001 Utwórz testy walidacji parametrów, daty `YYYY-MM-DD` i generowania kolejnych miesięcznych dat w `tests/harmonogram.test.ts`; przypadki muszą obejmować dodatnią całkowitą `kwotaGr`, dodatnią całkowitą `liczbaRat`, nieujemną `marza`, poprawne enumy oraz odrzucenie nieprawidłowych danych.
- [X] T002 Zaimplementuj w `src/domena/harmonogram.ts` typy `ParametryKredytu`, `Nadplata`, `WpisSerii`, `WierszHarmonogramu` i `WynikHarmonogramu` oraz czyste funkcje walidacji i generowania dat; zachowaj regułę, że kwoty są całkowitymi groszami, stopy ułamkami, a domena nie używa React, HTTP, I/O ani `Date.now()`.
- [X] T003 [P] Dodaj test wyboru ostatniego wpisu `od <= data raty` oraz użycia ostatniej znanej wartości po końcu serii w `tests/wskazniki.test.ts`, korzystając z danych POLSTR 1M i WIBOR 3M.
- [X] T004 Dodaj w `src/domena/harmonogram.ts` czysty mechanizm wyboru stopy dla daty raty i użyj `src/dane/wskazniki.ts` jako adaptera serii zaimportowanych z `dane/*.json`; nie modyfikuj plików `dane/*.json`.

**Punkt kontrolny**: `npm test` przechodzi dla fundamentów, a domena ma jawne typy i walidację bez obliczeń w route/UI.

## Faza 3: User Story 1 - Obliczenie harmonogramu kredytu (Priorytet: P1) 🎯 MVP

**Cel**: Doradca podaje parametry kredytu bez nadpłat i otrzymuje kompletny harmonogram rat równych lub malejących z właściwą zmianą wskaźnika.

**Test niezależny**: Dla 400 000 zł, 300 rat, marży 2,11 pp i stałego wskaźnika 3,55% wynik zawiera pierwszą ratę około 2 494,72 zł, ostatnią ratę wyrównującą około 2 492,53 zł, zero końcowego salda i kompletną tabelę.

### Testy US1

- [X] T005 [P] [US1] Dodaj test liczby kontrolnej raty równej w `tests/harmonogram.test.ts`: 40 000 000 gr, 300 rat, stopa wskaźnika `0.0355`, marża `0.0211`, pierwsza rata około 249 472 gr i ostatnia około 249 253 gr z tolerancją 5 gr.
- [X] T006 [P] [US1] Dodaj test rat malejących w `tests/harmonogram.test.ts`: regularny kapitał ma wynikać z równego podziału kwoty, odsetki i raty maleją przy stałych warunkach, a saldo kończy się na zero.
- [X] T007 [P] [US1] Dodaj test zmiany stopy w `tests/harmonogram.test.ts`: sprawdź właściwą stopę w wierszach po zmianie serii oraz zachowanie ostatniego wpisu po zakończeniu serii.
- [X] T008 [P] [US1] Dodaj test bilansu po zaokrągleniach w `tests/harmonogram.test.ts`: suma `kapitalGr` ma być równa `kwotaGr`, saldo żadnego wiersza nie może być ujemne, a ostatni wiersz ma mieć saldo 0.

### Implementacja US1

- [X] T009 [US1] Zaimplementuj w `src/domena/harmonogram.ts` centralne zaokrąglanie do grosza, naliczanie prostych odsetek od salda początkowego okresu według `saldoGr * stopaRoczna / 12` oraz ochronę przed ujemnym saldem.
- [X] T010 [US1] Zaimplementuj w `src/domena/harmonogram.ts` ratę równą z przeliczeniem dla pozostałego salda i liczby rat oraz ratę malejącą ze stałą częścią kapitałową; oprocentowanie okresu musi być sumą wskaźnika i marży.
- [X] T011 [US1] Zaimplementuj w `src/domena/harmonogram.ts` korektę ostatniego regularnego kapitału i raty wyrównującej tak, aby po zaokrągleniach suma kapitału była dokładnie równa kwocie kredytu, a saldo końcowe wynosiło 0.
- [X] T012 [US1] Zaimplementuj agregowanie wierszy i podsumowanie `WynikHarmonogramu` w `src/domena/harmonogram.ts`, w tym `rataPierwszaGr`, `rataOstatniaGr`, `sumaOdsetekGr`, `sumaKapitaluGr` i pustą listę nadpłat dla tego etapu.
- [X] T013 [US1] Rozszerz parsowanie i obsługę `GET /api/harmonogram` w `app/api/harmonogram/route.ts`, aby walidowało query, pobierało serię przez `seriaWskaznika`, wywoływało domenę i mapowało grosze na złote w odpowiedzi zgodnie z `contracts/harmonogram-api.md`; route nie może zawierać matematyki finansowej.
- [X] T014 [US1] Usuń status `501` dla niezaimplementowanej domeny i zdefiniuj w `app/api/harmonogram/route.ts` rozróżnienie błędów walidacji `400` od nieoczekiwanych błędów `500`, bez ujawniania poprawnego wyniku zastępczego.

**Punkt kontrolny**: US1 działa niezależnie przez domenę i `GET /api/harmonogram`; testy liczbowe przechodzą, a odpowiedź ma wszystkie pola tabeli i podsumowania.

## Faza 4: User Story 2 - Analiza i eksport wyniku (Priorytet: P2)

**Cel**: Doradca widzi najważniejsze wartości wyniku, pełny aktualny harmonogram i może pobrać CSV.

**Test niezależny**: Po obliczeniu wynik pokazuje pierwszą i ostatnią ratę, sumę odsetek, oprocentowanie oraz wszystkie wiersze; eksport zawiera nagłówki, dane i kwoty z dwoma miejscami.

### Implementacja US2

- [X] T015 [US2] Zastąp tymczasowy `buildFallbackResponse` w `app/page.tsx` typem odpowiedzi zgodnym z `contracts/harmonogram-api.md` i pobieraniem wyłącznie z `/api/harmonogram`; UI nie może powielać wzorów ani obliczać harmonogramu.
- [X] T016 [US2] Podłącz formularz i stan ładowania w `app/page.tsx` do wszystkich parametrów US1, zastępując poprzedni wynik nową odpowiedzią po ponownym kliknięciu „Policz” oraz pokazując komunikat postępu podczas żądania.
- [X] T017 [US2] Zaimplementuj w `app/page.tsx` prezentację podsumowania i tabeli wynikowej z polskimi formatami kwot, oprocentowaniem okresu oraz przewijaniem poziomym na wąskich ekranach; pokaż wyłącznie rzeczywisty wynik API.
- [X] T018 [US2] Zaimplementuj w `app/page.tsx` eksport aktualnego pełnego harmonogramu do CSV z nagłówkami `Nr;Data;Kapitał;Odsetki;Rata;Saldo;Nadpłata`, BOM-em UTF-8 i kwotami formatowanymi do dwóch miejsc po przecinku.
- [X] T019 [US2] Obsłuż w `app/page.tsx` statusy `400`, `500`, błąd sieci i pusty wynik tak, aby ekran pokazywał czytelny błąd i nie prezentował fallbackowego harmonogramu jako poprawnego.

**Punkt kontrolny**: Ręczny scenariusz z `quickstart.md` potwierdza zgodność UI z API, ponowne obliczenie, pełny CSV oraz prawidłowy stan błędu.

## Faza 5: User Story 3 - Obsługa nadpłat (Priorytet: P2)

**Cel**: Doradca dodaje, zmienia i usuwa nadpłaty oraz porównuje efekt obniżenia raty i skrócenia okresu.

**Test niezależny**: Nadpłata w trybie `rata` obniża kolejne raty przy zachowaniu terminu, nadpłata w trybie `okres` kończy harmonogram wcześniej, a suma regularnego kapitału i nadpłat nie przekracza kredytu.

### Testy US3

- [X] T020 [P] [US3] Dodaj test nadpłaty `efekt: 'rata'` w `tests/harmonogram.test.ts`: po nadpłacie saldo zmniejsza się o zastosowaną kwotę, liczba wierszy pozostaje zgodna z terminem, a kolejne raty są przeliczone niżej.
- [X] T021 [P] [US3] Dodaj test nadpłaty `efekt: 'okres'` w `tests/harmonogram.test.ts`: po nadpłacie harmonogram kończy się wcześniej, saldo ostatniego wiersza wynosi zero, a regularna rata pozostaje zgodna z przyjętym mechanizmem.
- [X] T022 [P] [US3] Dodaj test wielu nadpłat i nadpłaty większej od salda w `tests/harmonogram.test.ts`: nadpłaty trafiają do właściwych numerów rat, są ograniczone do salda, nie powodują wartości ujemnych, a suma `kapitalGr + nadplataGr` równa się `kwotaGr`.

### Implementacja US3

- [X] T023 [US3] Rozszerz `src/domena/harmonogram.ts` o walidację `Nadplata`: `nrRaty` i `kwotaGr` muszą być dodatnie, numer nie może przekraczać `liczbaRat`, a wiele wpisów tego samego numeru raty należy agregować przed obliczeniami zgodnie z `efekt`.
- [X] T024 [US3] Zaimplementuj w `src/domena/harmonogram.ts` zastosowanie nadpłaty po regularnej racie, ograniczenie jej do pozostałego salda oraz zapis `nadplataGr` osobno od `kapitalGr`.
- [X] T025 [US3] Zaimplementuj w `src/domena/harmonogram.ts` tryb `rata`: po nadpłacie przelicz kolejne raty przy zachowaniu końcowego terminu i aktualnej stopy, bez naruszania inwariantów salda.
- [X] T026 [US3] Zaimplementuj w `src/domena/harmonogram.ts` tryb `okres`: zachowaj ustaloną zasadę regularnej raty i zakończ harmonogram, gdy saldo osiągnie zero, także gdy nadpłata przekracza pozostałe saldo.
- [X] T027 [US3] Rozszerz parser query string w `app/api/harmonogram/route.ts` o grupowanie `nadplata[i][nrRaty]`, `nadplata[i][kwota]` i `nadplata[i][efekt]`; niekompletne lub niepoprawne wpisy muszą kończyć się statusem `400`.
- [X] T028 [US3] Rozszerz typy, formularz i serializację query w `app/page.tsx` o dodawanie, edycję i usuwanie nadpłat oraz wybór „Obniż ratę”/„Skróć okres”; wartości formularza mają odpowiadać kontraktowi API.
- [X] T029 [US3] Dodaj do tabeli i eksportu CSV kolumnę nadpłaty w `app/page.tsx`, a po obliczeniu pokaż skrócenie liczby okresów lub obniżenie kolejnych rat zgodnie z odpowiedzią API.

**Punkt kontrolny**: Oba tryby nadpłat przechodzą testy liczbowe, działają przez API i są dostępne z poziomu formularza bez obliczeń w komponencie.

## Faza 6: Polerowanie i bramki jakości

**Cel**: Sprawdzić cały przepływ, dokumentację walidacyjną i gotowość produkcyjną.

- [X] T030 [P] Uzupełnij istniejące testy danych w `tests/smoke.test.ts` o zgodność typów serii i zachowanie obu kluczy wskaźników bez modyfikowania `dane/*.json`.
- [X] T031 [P] Przejdź ręcznie scenariusze domeny, API i UI z `specs/001-kalkulator-harmonogramu/quickstart.md` i zapisz ewentualne rozbieżności w odpowiednich testach domenowych.
- [X] T032 Uruchom `npm test`, `npm run typecheck` i `npm run build` z katalogu głównego oraz usuń tylko błędy wprowadzone przez tę funkcję.
- [X] T033 Zweryfikuj wydajność 300 rat przez `GET /api/harmonogram` i ekran zgodnie z SC-001, a także sprawdź `git diff --check` dla wszystkich zmienionych plików.

## Zależności i kolejność wykonania

### Zależności faz

- Faza 1 nie wymaga pracy, ponieważ projekt i zależności już istnieją.
- Faza 2 blokuje wszystkie historie i musi zakończyć typy, walidację oraz wybór serii.
- Faza 3 (US1) zależy od Fazy 2 i dostarcza minimalnie użyteczny kalkulator backendowy.
- Faza 4 (US2) zależy od US1, ponieważ prezentuje jego odpowiedź; może być wdrażana przed nadpłatami.
- Faza 5 (US3) zależy od US1, a jej integracja UI korzysta z komponentu przygotowanego w US2.
- Faza 6 zależy od wszystkich wybranych historii.

### Kolejność historii

1. **US1 (P1)**: fundament wartości produktu; niezależna po Fazie 2.
2. **US2 (P2)**: prezentuje i eksportuje wynik US1.
3. **US3 (P2)**: rozszerza domenę, API i formularz o nadpłaty.

### Możliwości pracy równoległej

- T001 i T003 mogą być przygotowywane równolegle, ponieważ dotyczą różnych plików testowych; T002 i T004 zaczynają się po odpowiednich testach.
- T005–T008 mogą być przygotowane równolegle przed implementacją T009–T012.
- Po US1 można równolegle przygotować T020–T022 oraz projektować zmiany UI US2, ale integrację nadpłat z UI wykonuje się po ustaleniu odpowiedzi domeny.
- T015, T017 i T018 dotyczą tego samego `app/page.tsx`, więc nie powinny być wykonywane równolegle mimo podobnego zakresu.
- T030 i T031 mogą być wykonane równolegle z końcową dokumentacją, ale T032 i T033 są bramkami końcowymi.

## Strategia implementacji

### MVP najpierw

1. Wykonaj Fazę 2.
2. Wykonaj US1 test-first i zatrzymaj się na punkcie kontrolnym.
3. Zweryfikuj liczbę kontrolną oraz API.
4. Dodaj US2, aby uzyskać używalny ekran i eksport.
5. Dodaj US3 jako osobną fazę z testami nadpłat.
6. Uruchom wszystkie bramki jakości z Fazy 6.

### Dostarczanie przyrostowe

Każdą fazę kończ osobnym przeglądem i walidacją. Po US1 możliwy jest demonstracyjny MVP bez nadpłat; po US2 wynik jest dostępny na ekranie i w CSV; po US3 zakres funkcjonalny odpowiada pełnemu MVP ze specyfikacji.

### Kryterium zakończenia

Każde zadanie ma checkbox, sekwencyjny identyfikator, etykietę `[P]` tylko dla pracy równoległej, etykietę `[USn]` w fazach historii oraz konkretną ścieżkę pliku. Przed uznaniem implementacji za gotową muszą przejść `npm test`, `npm run typecheck` i `npm run build`.
