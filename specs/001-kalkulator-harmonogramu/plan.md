# Implementation Plan: Kalkulator harmonogramu spłat

**Branch**: `001-kalkulator-harmonogramu` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-kalkulator-harmonogramu/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

MVP dostarcza deterministyczny kalkulator harmonogramu kredytu dla rat równych i malejących, wskaźników POLSTR 1M/WIBOR 3M oraz nadpłat. Logika finansowa zostanie zaimplementowana w czystym module `src/domena/`, z kwotami przechowywanymi w groszach i jedną regułą zaokrąglania. Route handler będzie konwertował query string na typ domenowy i serializował wynik do JSON, a `app/page.tsx` zostanie ograniczone do formularza, pobierania wyniku, prezentacji oraz eksportu CSV.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9, Node.js >= 22, Next.js 16.3.6

**Primary Dependencies**: Next.js App Router, React 19, Tailwind CSS, bez nowych zależności

**Storage**: Statyczne serie wskaźników w `dane/*.json`, importowane przez `src/dane/wskazniki.ts`; brak bazy danych

**Testing**: Vitest w `tests/` dla domeny i danych; `npm test`, `npm run typecheck`, `npm run build`

**Target Platform**: Next.js na Vercel, przeglądarka desktopowa i wąski ekran z przewijaniem tabeli

**Project Type**: Aplikacja webowa Next.js z API Route Handler i klientem React

**Performance Goals**: Harmonogram 300 rat powinien być obliczony i pokazany w czasie do 5 sekund

**Constraints**: Kwoty domenowe jako całkowite grosze; stopy jako ułamki; proste odsetki za okres; brak efektów ubocznych w domenie; brak `any` i `@ts-ignore`; brak obliczeń finansowych w UI/API

**Scale/Scope**: Jedno narzędzie MVP, do 300 rat w typowym przypadku, wiele nadpłat, jedna waluta PLN

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Domena jako źródło prawdy**: PASS. Obliczenia, walidacja salda, wskaźniki okresów i nadpłaty są planowane w `src/domena/`; UI i route tylko przekazują dane.
- **II. Testy z liczbą kontrolną**: PASS. Plan obejmuje liczby kontrolne dla rat równych, malejących, zmiany wskaźnika, obu trybów nadpłat i bilansu kapitału.
- **III. Narzucona architektura**: PASS. Zachowane są `src/domena/`, `src/dane/`, `app/api/harmonogram/route.ts`, `app/page.tsx` oraz Vitest.
- **IV. Dane historyczne wskaźników**: PASS. Serie pozostają w `dane/*.json`, wybór wartości odbywa się według daty raty, a po końcu serii używana jest ostatnia wartość.
- **V. Zaokrąglanie i integralność**: PASS. Domenowy wynik używa groszy, zaokrąglenie jest centralne, a ostatni okres koryguje kapitał do zera bez ujemnego salda.
- **Brak nowych zależności**: PASS. Plan wykorzystuje wyłącznie obecny stos.

## Project Structure

### Documentation (this feature)

```text
specs/001-kalkulator-harmonogramu/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── harmonogram-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── domena/
│   └── harmonogram.ts
└── dane/
  └── wskazniki.ts

tests/
└── smoke.test.ts

app/
├── page.tsx
└── api/
  └── harmonogram/
    └── route.ts

dane/
├── polstr-1m.json
└── wibor-3m.json
```

**Structure Decision**: Jedna aplikacja Next.js z domeną i testami w repozytoryjnych katalogach wskazanych przez konstytucję. `src/dane/wskazniki.ts` pozostaje adapterem danych, a pliki `dane/*.json` nie są modyfikowane przez implementację. API zachowuje publiczny kontrakt query string opisany w [contracts/harmonogram-api.md](contracts/harmonogram-api.md). UI pobiera wynik wyłącznie przez `fetch` i nie powiela obliczeń.

## Phase 0: Research Decisions

Szczegóły decyzji i odrzuconych alternatyw znajdują się w [research.md](research.md). Wszystkie niepewności techniczne zostały rozstrzygnięte na podstawie specyfikacji, `BRIEF.md`, istniejącego kodu i danych.

## Phase 1: Design Summary

- [data-model.md](data-model.md) definiuje typy wejścia domeny, nadpłatę, wiersz raty i wynik.
- [contracts/harmonogram-api.md](contracts/harmonogram-api.md) definiuje query string, odpowiedzi sukcesu i błędu oraz kodowanie nadpłat.
- [quickstart.md](quickstart.md) opisuje walidację TDD, API i przepływu UI bez dodawania testów E2E do zakresu MVP.
- Implementacja domeny ma przejść w kolejności: walidacja i daty, wybór wskaźnika, odsetki/raty i bilans, nadpłaty, a następnie integracja route i UI.
- UI usuwa `buildFallbackResponse`; przy błędzie pozostawia poprzedni poprawny wynik albo pusty stan i pokazuje komunikat, aby błąd nie wyglądał jak poprawny harmonogram.

## Post-Design Constitution Check

- **I–V**: PASS. Projekt rozdziela obliczenia od transportu i prezentacji, opisuje testy liczbowe oraz zachowuje groszową arytmetykę i dane wskaźników.
- **Zakres MVP**: PASS. Obejmuje oba wskaźniki, dwa typy rat, oba tryby nadpłat, JSON API, formularz, tabelę i CSV.
- **Bramki jakości**: PASS jako kryterium zakończenia implementacji: `npm test`, `npm run typecheck`, `npm run build`.
- **Naruszenia wymagające uzasadnienia**: brak.

## Complexity Tracking

Brak naruszeń konstytucji i brak dodatkowych projektów lub zależności.
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
