<!--
Sync Impact Report
Version change: template scaffold -> 1.0.0
Modified principles: new constitution initialized for the POLSTR calculator project
Added sections: Dodatkowe ograniczenia; Workflow rozwoju i jakość
Removed sections: placeholder scaffold tokens and example text
Follow-up TODOs: Ratification date to be confirmed before formal adoption
-->

# Harmonogram POLSTR Constitution

## Core Principles

### I. Logika domenowa jest źródłem prawdy
Cała logika finansowa harmonogramu spłat, w tym odsetki, raty, nadpłaty, zmiana stóp i walidacja salda, musi znajdować się w module domenowym projektu. Kod domenowy musi być czysty, deterministyczny i wolny od zależności od React, HTTP, Date.now() oraz efektów ubocznych.

To zapewnia, że wynik harmonogramu da się testować niezależnie od UI, API i stanu aplikacji. Przepływ danych jest jednoznaczny: wejście -> obliczenia -> wynik, bez ukrytych zależności i bez rozproszenia reguł biznesowych po warstwach prezentacji.

### II. Testy z liczbą kontrolną są obowiązkowe
Każda zmiana w logice obliczeń musi być poprzedzona testem z konkretną, sprawdzalną liczbą kontrolną. Nie akceptujemy „intuicyjnych” korekt bez potwierdzenia matematycznego i biznesowego.

Minimalny zestaw testów obejmuje ratę równą przy stałej stopie, ratę malejącą, zmianę wskaźnika w trakcie spłaty, nadpłaty w trybie obniżenia raty i skrócenia okresu oraz zgodność sumy części kapitałowych z kwotą kredytu po zaokrągleniach. Brak testu oznacza brak akceptacji zmiany.

### III. Architektura projektu jest narzucona i musi być zachowana
Projekt ma być zbudowany w Next.js App Router z TypeScript strict, z podziałem na warstwy: domena w src/domena, dane źródłowe w src/dane, a endpoint API w app/api/harmonogram. Ekran główny jest komponentem klienta z formularzem i tabelą wyników, ale nie zawiera własnej logiki finansowej.

Warstwa API jest cienka: parsuje parametry query string, wywołuje domenę i zwraca JSON. Obliczenia nie mogą być mieszane z kodem routingu, komponentem UI ani logiką prezentacji. Ta separacja jest warunkiem utrzymania czytelności, testowalności i łatwego utrzymania.

### IV. Dane wskaźników są źródłem prawdy i muszą być traktowane jako dane historyczne
Wartości wskaźników są odczytywane z plików JSON w katalogu dane i dostępne przez warstwę danych w src/dane. Wskaźnik POLSTR 1M lub WIBOR 3M reprezentuje serię zmian stóp, a po ostatnim wpisie obowiązuje ostatnia znana wartość.

Wartości są przechowywane jako ułamki, a nie jako procenty. Oprocentowanie okresu jest sumą wskaźnika i marży banku. Zmiana stawki następuje zgodnie z konwencją dla konkretnego wskaźnika. Kod nie może zgadywać stawki ani mieszać różnych stawek w obrębie jednego okresu rozliczeniowego.

### V. Zaokrąglanie i integralność finansowa są nieprzekraczalne
Wszystkie kwoty są wyrażane w groszach jako liczby całkowite, a zaokrąglanie odbywa się w jednym miejscu i według jednej konwencji. Rata wyrównująca musi kończyć harmonogram tak, aby suma części kapitałowych była równa kwocie kredytu.

Dla MVP przyjmujemy odsetki proste w okresie, bez kapitalizacji w ramach miesiąca. Żaden element programowania nie może ukrywać zależności między stopą, saldem i ratą, a każda decyzja o zaokrąglaniu musi być jawnie opisana w kodzie i testach.

## Dodatkowe ograniczenia

### Technologia i struktura projektu
- TypeScript strict, bez `any` i bez `@ts-ignore`.
- Next.js App Router w wersji zgodnej z konfiguracją repozytorium.
- Brak bibliotek UI bez uzasadnienia biznesowego i zgodności z wymaganiami MVP.
- Dane wejściowe i wynikowe muszą być proste do serializacji do JSON.
- Wartości finansowe powinny być spójne: kwoty w groszach, stawki jako ułamki.

### Obowiązkowe reguły biznesowe
- Oprocentowanie okresu = wartość wskaźnika + marża banku.
- POLSTR 1M zmienia się co miesiąc w dniu raty, WIBOR 3M co kwartał.
- Po ostatnim wpisie serii wskaźnika obowiązuje ostatnia znana wartość.
- Zaokrąglanie do grosza jest obowiązkowe i musi być spójne we wszystkich obliczeniach.
- Raty mogą być równe lub malejące, ale w obu przypadkach suma kapitałów po zaokrągleniach musi być równa kwocie kredytu.

## Workflow rozwoju i jakość

### Rozwój według zasady TDD
1. Najpierw powstaje test dla nowej reguły finansowej.
2. Następnie implementuje się minimalne rozwiązanie w domenie.
3. Potem podłącza się endpoint API i ekran użytkownika.
4. Na końcu uruchamia się pełną kontrolę jakości: testy, typecheck i build.

### Bramki jakości obowiązkowe
Przed uznaniem taska za zakończony należy wykonać:
- npm test
- npm run typecheck
- npm run build

Te kroki są warunkiem zgodności z wymaganiami produktu i z wdrożeniem na Vercel, który buduje produkcję tym samym poleceniem Next.js co lokalnie.

### Review i zgodność z zakresem MVP
Każda zmiana musi być zgodna z zakresem MVP z dokumentu biznesowego: wskaźnik POLSTR 1M lub WIBOR 3M, raty równe i malejące, nadpłaty z trybem obniżenia raty lub skrócenia okresu oraz prezentacja wyników w API i na ekranie.

Review nie może pomijać reguł finansowych. Jeśli implementacja narusza definicję stopy, zaokrąglania, okresu odsetkowego lub daty raty, zmiana nie jest akceptowana.

## Governance

Konstytucja jest fundamentem projektu i ma pierwszeństwo przed lokalnymi decyzjami technicznymi. Każda zmiana w architekturze, regułach obliczeniowych, modelu danych i sposobie publikacji musi respektować tę konstytucję i zostać odnotowana w wersji dokumentu.

Zmiany w konstytucji wprowadza się w sposób kontrolowany:
- każda modyfikacja musi mieć uzasadnienie biznesowe lub techniczne,
- każda istotna zmiana w zasady projektu musi być opisana jako nowa wersja,
- każda wersja musi odzwierciedlać aktualizację polityki i procesu rozwoju,
- zgodność z konstytucją musi być sprawdzana przy każdym review i przed wdrożeniem.

Przyjmujemy zasadę semantycznego wersjonowania:
- MAJOR: zmiany łamiące zasady lub redefiniujące nadrzędne reguły projektu,
- MINOR: dodanie nowych zasad, sekcji lub istotne rozszerzenie obowiązków,
- PATCH: doprecyzowanie, korekty tekstu i drobne ulepszenia.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): data formalnego przyjęcia konstytucji | **Last Amended**: 2026-09-23
