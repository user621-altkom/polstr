---

description: "Lista zadań implementacji wyboru skutku nadpłaty"
---

# Tasks: Wybór skutku nadpłaty

**Input**: Dokumenty projektowe z `specs/002-zmiany-harmonogramu-kredytu/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/harmonogram-api.md`, `quickstart.md`

**Organization**: Zadania są pogrupowane według jednej historii użytkownika P1 i prowadzą od testów czerwonych do minimalnej implementacji oraz walidacji.

## Format: `[ID] [P?] [Story] Opis`

- **[P]**: Zadanie może być wykonane równolegle z innym zadaniem w tej samej fazie.
- **[US1]**: Zadanie należy do historii „Wybór skutku nadpłaty”.
- Każdy opis zawiera dokładną ścieżkę pliku.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Potwierdzenie stanu bazowego i przygotowanie punktu odniesienia dla zmiany.

- [ ] T001 Uruchom `npm test` i zapisz bazowy wynik istniejących testów domeny z `tests/harmonogram.test.ts` w kontekście implementacji CR-A.
- [ ] T002 [P] Sprawdź zgodność istniejących nazw `efekt`, wartości `rata`/`okres` oraz formularza nadpłat z planem w `src/domena/harmonogram.ts`, `app/api/harmonogram/route.ts` i `app/page.tsx`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ustalenie kontraktu danych i przypadków testowych, które blokują implementację historii.

- [ ] T003 [P] Zaktualizuj typ wejściowej nadpłaty w modelu domenowym zgodnie z regułą: `nrRaty` jest dodatnią liczbą całkowitą nie większą niż `liczbaRat`, `kwotaGr` jest dodatnią liczbą całkowitą w groszach, a brak `efekt` oznacza `okres`, w `src/domena/harmonogram.ts`.
- [ ] T004 [P] Przygotuj test kontraktu endpointu dla jawnych efektów `rata` i `okres` oraz braku pola `efekt`, w `tests/harmonogram-api.test.ts`.
- [ ] T005 [P] Zaktualizuj opis parametrów i odpowiedzi endpointu, w tym domyślnego `okres` przy braku `nadplata[i][efekt]`, w `specs/002-zmiany-harmonogramu-kredytu/contracts/harmonogram-api.md`.

**Checkpoint**: Kontrakt i przypadki testowe są ustalone; można rozpocząć implementację US1.

## Phase 3: User Story 1 - Wybór skutku nadpłaty (Priority: P1) 🎯 MVP

**Goal**: Doradca może wybrać obniżenie raty albo skrócenie okresu, a brak trybu zachowuje domyślne skrócenie okresu.

**Independent Test**: Dla kredytu 300 000 zł, 240 rat równych, oprocentowania 6,66% i nadpłaty 30 000 zł po pierwszej racie system zwraca 2 038,11 zł w trybie `rata`, 196 rat łącznie i ostatnią ratę 2 200,53 zł w trybie `okres`, a w obu przypadkach saldo końcowe wynosi 0,00 zł i suma kapitału z nadpłatami wynosi 300 000 zł.

### Tests for User Story 1

> Testy są wymagane przez specyfikację i konstytucję projektu. Najpierw muszą oblać się przed implementacją.

- [ ] T006 [US1] Dodaj czerwony test liczby kontrolnej CR-A dla trybu `rata`: rata przed nadpłatą 2 265,07 zł, saldo po racie 1 i nadpłacie 269 399,93 zł, 240 rat łącznie oraz rata od drugiego okresu 2 038,11 zł, w `tests/harmonogram.test.ts`.
- [ ] T007 [US1] Dodaj czerwony test liczby kontrolnej CR-A dla trybu `okres`: rata regularna 2 265,07 zł, 196 rat łącznie, 195 rat po nadpłacie i ostatnia rata 2 200,53 zł, w `tests/harmonogram.test.ts`.
- [ ] T008 [US1] Dodaj test braku `efekt` jako domyślnego `okres`, test wielu nadpłat z niezależnymi efektami, test nadpłaty równej lub większej od salda oraz inwariantów `saldoGr >= 0`, `sumaKapitaluGr + sumaNadplatGr = kwotaGr`, w `tests/harmonogram.test.ts`.
- [ ] T009 [US1] Dodaj test odrzucenia zerowej lub ujemnej kwoty nadpłaty, niepoprawnego numeru raty i nieznanego efektu, w `tests/harmonogram.test.ts`.

### Implementation for User Story 1

- [ ] T010 [US1] Znormalizuj wpis nadpłaty w `src/domena/harmonogram.ts`, aby brak `efekt` przyjmował wartość `okres`, jawne wartości ograniczały się do `rata | okres`, a wpisy dla tego samego numeru raty zachowywały regułę agregacji i konfliktów.
- [ ] T011 [US1] Uporządkuj obliczenia w `src/domena/harmonogram.ts`, aby odsetki i regularna rata były liczone od salda sprzed nadpłaty, nadpłata była odejmowana po racie, a efekt `rata` przeliczał ratę od następnego okresu dla pozostałej liczby rat.
- [ ] T012 [US1] Uporządkuj obsługę efektu `okres` w `src/domena/harmonogram.ts`, aby rata regularna pozostała bez zmiany, harmonogram kończył się po wyzerowaniu salda i ostatni okres korygował kapitał bez ujemnego salda.
- [ ] T013 [US1] Zmień parser nadpłat w `app/api/harmonogram/route.ts`, aby brak `nadplata[i][efekt]` normalizował się do `okres`, jawne wartości `rata`/`okres` były przekazywane dalej, a nieznana wartość kończyła się błędem 400.
- [ ] T014 [US1] Zweryfikuj istniejący wybór efektu, dodawanie, edycję i usuwanie nadpłaty w `app/page.tsx`; wprowadź zmianę tylko wtedy, gdy test kontraktu ujawni niespójność z wartościami `rata`/`okres`.
- [ ] T015 [US1] Zaktualizuj `specs/002-zmiany-harmonogramu-kredytu/contracts/harmonogram-api.md` oraz `specs/002-zmiany-harmonogramu-kredytu/quickstart.md` o finalny kontrakt, przykłady obu trybów i przykład braku `efekt`.

**Checkpoint**: US1 jest niezależnie działająca i można zweryfikować liczby kontrolne CR-A bez zmian w pozostałych funkcjach harmonogramu.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Końcowa walidacja, zgodność dokumentacji i kontrola regresji.

- [ ] T016 [P] Uruchom `npm test` i potwierdź zielone testy CR-A oraz istniejące testy bez nadpłat, w `tests/harmonogram.test.ts` i `tests/harmonogram-api.test.ts`.
- [ ] T017 [P] Uruchom `npm run typecheck` i usuń wyłącznie błędy wynikające z implementacji CR-A w `src/domena/harmonogram.ts`, `app/api/harmonogram/route.ts` lub `app/page.tsx`.
- [ ] T018 [P] Uruchom `npm run build` i potwierdź produkcyjny build aplikacji zgodnie z bramką jakości projektu.
- [ ] T019 Uruchom scenariusze z `specs/002-zmiany-harmonogramu-kredytu/quickstart.md` i porównaj odpowiedzi API z `specs/002-zmiany-harmonogramu-kredytu/contracts/harmonogram-api.md`.
- [ ] T020 Sprawdź `git diff --check` dla `src/domena/harmonogram.ts`, `app/api/harmonogram/route.ts`, `app/page.tsx` i `tests/`, oraz zgodność implementacji z zakresem CR-A; nie dodawaj obsługi innych zmian finansowych.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 i T002 nie zależą od innych zadań i ustalają stan bazowy.
- **Foundational (Phase 2)**: T003-T005 zależą od zakończenia Setup i blokują US1.
- **User Story 1 (Phase 3)**: T006-T009 zależą od T003-T005; T010-T014 mogą rozpocząć się po zapisaniu testów, a T015 po ustaleniu finalnego zachowania.
- **Polish (Phase 4)**: T016-T020 zależą od ukończenia implementacji US1.

### User Story Dependencies

- **User Story 1 (P1)**: Jedyna historia; po Phase 2 nie ma zależności od innych historii.

### Within User Story 1

1. T006-T009: testy czerwone.
2. T010-T012: logika domenowa.
3. T013: kontrakt wejściowy API.
4. T014: weryfikacja integracji UI.
5. T015: dokumentacja finalnego zachowania.
6. T016-T020: walidacja końcowa.

## Parallel Opportunities

- Po T001 zadania T002 i T003 mogą być wykonane równolegle, jeśli osoba wykonująca potwierdzi, że nie ma konfliktu w tym samym pliku.
- T004 i T005 mogą być przygotowane równolegle, ponieważ dotyczą osobnych plików.
- Po zapisaniu testów T006-T009 zadania T010 i T011 dotyczą domeny, a T013 dotyczy parsera API; mogą być rozdzielone między osoby tylko po uzgodnieniu kontraktu normalizacji.
- T016-T018 są niezależnymi poleceniami walidacyjnymi i mogą być uruchamiane równolegle, choć przed końcowym raportem należy zebrać wszystkie wyniki.

## Parallel Example: User Story 1

```text
Po zakończeniu T006-T009:
- T010-T012: implementacja i stabilizacja domeny w src/domena/harmonogram.ts
- T013: parser domyślnego efektu w app/api/harmonogram/route.ts
- T015: aktualizacja kontraktu i quickstartu w specs/002-zmiany-harmonogramu-kredytu/
```

## Implementation Strategy

### MVP First

1. Wykonaj Phase 1 i Phase 2.
2. Dodaj czerwone testy CR-A w Phase 3.
3. Zaimplementuj domenę i parser API.
4. Zatrzymaj się na checkpointcie US1 i potwierdź wszystkie liczby kontrolne.
5. Uruchom pełną walidację z Phase 4.

### Incremental Delivery

1. Najpierw zachowaj działanie harmonogramu bez nadpłat.
2. Dodaj tryb `okres` jako domyślny i jawny.
3. Potwierdź tryb `rata` oraz wiele nadpłat.
4. Dopiero po przejściu testów wykonaj typecheck, build i quickstart.

## Notes

- Wszystkie zadania mają wymagany checkbox, sekwencyjne ID i ścieżkę pliku.
- `[P]` oznacza wyłącznie zadania możliwe do rozdzielenia bez zależności od nieukończonej zmiany.
- Nie twórz zadań dla funkcji spoza CR-A.
