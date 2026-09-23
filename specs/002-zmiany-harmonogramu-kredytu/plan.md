# Implementation Plan: Wybór skutku nadpłaty

**Branch**: `002-zmiany-harmonogramu-kredytu` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Specyfikacja funkcji z `specs/002-zmiany-harmonogramu-kredytu/spec.md`

## Summary

Rozszerzenie obsługi nadpłat o jednoznaczny wybór skutku: `rata` (obniżenie kolejnej raty przy zachowaniu liczby rat) albo `okres` (zachowanie raty i wcześniejsze zakończenie harmonogramu). Istniejący model i ekran mają już pole efektu, dlatego plan koncentruje się na poprawieniu domyślnego trybu w kontrakcie wejściowym, jawnej logice domenowej oraz testach z liczbami kontrolnymi CR-A. Nadpłata pozostaje księgowana po racie, a odsetki tego okresu są liczone od salda sprzed nadpłaty.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 22+, strict mode

**Primary Dependencies**: Next.js 16 App Router, React 19, Vitest 4, Tailwind CSS 4; bez nowych zależności

**Storage**: Brak trwałego storage; dane wskaźników pozostają w istniejących plikach JSON i adapterze `src/dane/wskazniki.ts`

**Testing**: Vitest (`npm test`), testy domeny w `tests/harmonogram.test.ts`, końcowo `npm run typecheck` i `npm run build`

**Target Platform**: Aplikacja webowa uruchamiana lokalnie i wdrażana na Vercel

**Project Type**: Next.js App Router z czystą domeną, route handlerem i ekranem klienta

**Performance Goals**: Obliczenie harmonogramu do 300 rat ma zakończyć się w czasie nie dłuższym niż 5 sekund

**Constraints**: Kwoty w domenie jako całkowite grosze; stopy jako ułamki; zaokrąglanie do grosza według istniejącej reguły; brak logiki finansowej w UI i route handlerze; bez zmian w plikach `dane/`

**Scale/Scope**: Jedna funkcja biznesowa, istniejący formularz i endpoint oraz pojedynczy harmonogram z wieloma nadpłatami; inne zmiany finansowe pozostają poza zakresem

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Logika domenowa jest źródłem prawdy**: PASS. Reguły trybów nadpłaty i bilansowania pozostają w `src/domena/harmonogram.ts`.
- **Testy z liczbą kontrolną są obowiązkowe**: PASS. Plan zawiera test CR-A dla obu trybów, test braku trybu, wiele nadpłat i bilans kapitału.
- **Architektura projektu jest narzucona**: PASS. Zmiany są ograniczone do domeny, route handlera, testów i kontraktu; UI wykorzystuje istniejące pole wyboru.
- **Dane wskaźników są źródłem prawdy**: PASS. Nie zmieniamy danych ani mechanizmu wyboru serii.
- **Zaokrąglanie i integralność finansowa**: PASS. Zachowujemy grosze, jedną regułę zaokrąglania, ratę wyrównującą i saldo końcowe równe zero.
- **TDD i bramki jakości**: PASS. Najpierw testy domeny, potem minimalna implementacja, następnie pełne `npm test`, `npm run typecheck` i `npm run build`.

## Project Structure

### Documentation (this feature)

```text
specs/002-zmiany-harmonogramu-kredytu/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── harmonogram-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
└── domena/
    └── harmonogram.ts       # normalizacja trybu i obliczenia nadpłat

app/
└── api/
    └── harmonogram/
        └── route.ts         # opcjonalny efekt nadpłaty w query, bez obliczeń

app/
└── page.tsx                  # istniejący wybór trybu; tylko weryfikacja kontraktu

tests/
└── harmonogram.test.ts       # liczby kontrolne CR-A i przypadki brzegowe
```

**Structure Decision**: Zachowujemy istniejący układ jednego projektu Next.js. Logika finansowa trafia do `src/domena/harmonogram.ts`, parsowanie domyślnego trybu do `app/api/harmonogram/route.ts`, a testy do istniejącego pliku domenowego. Ekran nie wymaga nowej warstwy ani biblioteki.

## Phase 0: Research

- Potwierdzić obecny kontrakt `Nadplata` i zachowanie parsera query: istniejące API wymaga `efekt`, chociaż specyfikacja wymaga domyślnego `okres` przy jego braku.
- Potwierdzić algorytm liczb kontrolnych CR-A na istniejącej regule: rata i odsetki są zaokrąglane do groszy, nadpłata jest stosowana po racie, a zmiana raty następuje od kolejnego okresu.
- Wybrać minimalną kompatybilną zmianę: wartości wejściowe mogą nie zawierać efektu, ale po normalizacji domena zawsze pracuje na `rata | okres`.

## Phase 1: Design

- Zaktualizować model danych o rozróżnienie wejściowej nadpłaty z opcjonalnym trybem i znormalizowanej nadpłaty z trybem domyślnym `okres`.
- Zaktualizować kontrakt `GET /api/harmonogram`: brak `nadplata[i][efekt]` oznacza `okres`; jawne wartości pozostają `rata` i `okres`; pozostałe wartości kończą się błędem 400.
- Zachować obecną strukturę odpowiedzi i nazwy `efekt`, aby nie łamać istniejącego formularza oraz eksportu.
- Opisać scenariusze walidacyjne dla przypadku CR-A, obu trybów, domyślnego trybu, wielu nadpłat i bilansu kapitału.

## Implementation Notes For Tasks Phase

1. Dodać czerwone testy domeny z kredytem 300 000 zł, 240 ratami, stopą 6,66% i nadpłatą 30 000 zł po racie 1; sprawdzić liczby dla `rata` i `okres` oraz brak ujemnego salda.
2. Dodać test braku efektu w wejściu domeny/API i oczekiwanie `okres`; dodać test odrzucenia nieznanego efektu oraz niepoprawnych kwot i numerów rat.
3. Zmienić domenową normalizację nadpłat tak, aby brak efektu był równoważny `okres`, a jawny `rata` uruchamiał przeliczenie raty od następnego okresu.
4. Ustabilizować obsługę trybu `okres`: rata regularna pozostaje bez zmiany, nadpłata zmniejsza saldo po racie, a pętla kończy się przy zerowym saldzie z ostatnią ratą wyrównującą.
5. Zmienić parser query w route handlerze tak, aby brak pola efektu przyjmował `okres`, bez przenoszenia obliczeń finansowych do API.
6. Zaktualizować kontrakt API i quickstart o przykłady obu trybów oraz brak pola efektu.
7. Uruchomić `npm test`, `npm run typecheck`, `npm run build` i sprawdzić, że harmonogram bez nadpłat zachowuje dotychczasowe wyniki.

## Constitution Check: Post-Design

- **Logika domenowa jest źródłem prawdy**: PASS. Model i reguły przejścia wskazują domenę jako jedyne miejsce obliczeń.
- **Testy z liczbą kontrolną są obowiązkowe**: PASS. Quickstart i plan zadań wymagają liczb CR-A oraz bilansu kapitału.
- **Architektura projektu jest narzucona**: PASS. Kontrakt rozdziela parsowanie od obliczeń, a UI nie otrzymuje nowych reguł finansowych.
- **Dane wskaźników są źródłem prawdy**: PASS. Projekt nie modyfikuje serii ani zasad ich wyboru.
- **Zaokrąglanie i integralność finansowa**: PASS. Model utrzymuje grosze, ograniczenie nadpłaty do salda i ratę wyrównującą.
- **Zakres**: PASS. Artefakty obejmują wyłącznie wybór skutku nadpłaty.

Brak naruszeń wymagających wpisu w Complexity Tracking.

## Complexity Tracking

Brak naruszeń konstytucji i brak dodatkowej złożoności wymagającej uzasadnienia.
