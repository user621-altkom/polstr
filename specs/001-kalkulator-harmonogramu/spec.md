# Specyfikacja funkcji: Kalkulator harmonogramu spłat

**Feature Branch**: `spec-mvp`

**Created**: 2026-09-23

**Status**: Ready for planning

**Input**: User description: "Na podstawie kodu UI oraz naszych wymagań MVP, przygotuj specyfikacje funkcji."

## User Scenarios & Testing

### User Story 1 - Obliczenie harmonogramu kredytu (Priority: P1)

Doradca bankowy wprowadza kwotę kredytu, liczbę rat, datę pierwszej raty, marżę, typ raty oraz wskaźnik referencyjny, aby otrzymać kompletny harmonogram spłat.

**Why this priority**: To podstawowa wartość produktu. Bez poprawnego harmonogramu pozostałe funkcje nie dostarczają użytkownikowi użytecznego wyniku.

**Independent Test**: Można wprowadzić dane kredytu bez nadpłat, uruchomić obliczenie i sprawdzić pierwszą oraz ostatnią ratę, sumę odsetek, saldo i tabelę wszystkich okresów.

**Acceptance Scenarios**:

1. **Given** kredyt 400 000 zł, 300 rat równych, pierwsza rata 2026-10-01, marża 2,11 pp i stały wskaźnik POLSTR 1M 3,55%, **When** użytkownik uruchomi obliczenie, **Then** pierwsza rata wynosi 2 494,72 zł z tolerancją 0,05 zł, a ostatnia rata wyrównująca wynosi 2 492,53 zł z tolerancją 0,05 zł.
2. **Given** wybrany typ rat malejących, **When** użytkownik uruchomi obliczenie, **Then** część kapitałowa jest zgodna z równym podziałem kapitału, a kolejne raty nie rosną bez zmiany warunków.
3. **Given** seria wskaźnika zawierająca kolejne wartości w czasie, **When** harmonogram przechodzi do nowego okresu aktualizacji, **Then** oprocentowanie okresu korzysta z wartości właściwej dla tego okresu.
4. **Given** brak wpisu wskaźnika po ostatniej dostępnej wartości, **When** obliczane są kolejne okresy, **Then** używana jest ostatnia znana wartość wskaźnika.

### User Story 2 - Analiza i eksport wyniku (Priority: P2)

Doradca przegląda najważniejsze podsumowanie oraz tabelę harmonogramu, a następnie pobiera wynik w formacie CSV, aby przekazać go klientowi lub dalej analizować.

**Why this priority**: Wynik musi być zrozumiały i przenośny, aby obliczenie mogło wspierać rozmowę z klientem i pracę poza kalkulatorem.

**Independent Test**: Po obliczeniu harmonogramu można zweryfikować podsumowanie, dane tabeli oraz otworzyć pobrany plik CSV w arkuszu kalkulacyjnym.

**Acceptance Scenarios**:

1. **Given** obliczony harmonogram, **When** użytkownik ogląda ekran wyniku, **Then** widzi pierwszą ratę, ostatnią ratę, sumę odsetek, oprocentowanie oraz wiersze harmonogramu z numerem, datą, kapitałem, odsetkami, ratą i saldem.
2. **Given** obliczony harmonogram, **When** użytkownik wybiera eksport CSV, **Then** pobierany plik zawiera nagłówki oraz dane rat, w tym nadpłaty, z kwotami zapisanymi do dwóch miejsc po przecinku.
3. **Given** użytkownik zmieni parametr formularza i ponownie wybierze „Policz”, **When** obliczenie się zakończy, **Then** podsumowanie i tabela odpowiadają nowym parametrom.

### User Story 3 - Obsługa nadpłat (Priority: P2)

Doradca dodaje jedną lub więcej nadpłat wskazując numer raty, kwotę oraz skutek nadpłaty, aby porównać wpływ wcześniejszej spłaty na ratę lub czas trwania kredytu.

**Why this priority**: Nadpłaty są wymaganym elementem MVP i istotnie zmieniają koszt kredytu, ale podstawowy harmonogram musi działać także bez nich.

**Independent Test**: Można dodać nadpłatę w każdym z dwóch trybów, obliczyć harmonogram i sprawdzić zmianę rat, salda, liczby okresów oraz sumy odsetek.

**Acceptance Scenarios**:

1. **Given** nadpłata przypisana do istniejącego numeru raty z trybem „obniż ratę”, **When** użytkownik obliczy harmonogram, **Then** saldo zmniejsza się o kwotę nadpłaty, a kolejne raty są przeliczone przy zachowaniu założonego terminu końcowego.
2. **Given** nadpłata przypisana do istniejącego numeru raty z trybem „skróć okres”, **When** użytkownik obliczy harmonogram, **Then** saldo zmniejsza się o kwotę nadpłaty, a harmonogram kończy się wcześniej, gdy saldo zostanie spłacone.
3. **Given** kilka nadpłat w różnych okresach, **When** użytkownik obliczy harmonogram, **Then** są zastosowane w odpowiednich numerach rat i żadna nadpłata nie powoduje ujemnego salda.

### Edge Cases

- Kwota kredytu, liczba rat i kwota nadpłaty muszą być dodatnie; marża nie może prowadzić do niepoprawnych danych wejściowych.
- Numer raty nadpłaty nie może wykraczać poza bieżący okres kredytu, a kwota nadpłaty większa od salda może najwyżej zakończyć kredyt na zerowym saldzie.
- Harmonogram dla ostatniej raty musi korygować część kapitałową tak, aby suma spłaconego kapitału była dokładnie równa kwocie kredytu po zaokrągleniach.
- Daty rat muszą następować w kolejnych okresach od daty pierwszej raty; zmiana miesiąca lub kwartału wskaźnika nie może zmieniać daty raty.
- Pusty lub niepoprawny formularz nie uruchamia obliczeń i pokazuje użytkownikowi komunikat wskazujący wymagane poprawki.
- Błąd obliczenia lub niedostępność wyniku nie może być przedstawiona jako poprawny harmonogram; użytkownik otrzymuje czytelny komunikat.
- Dla raty kończącej kredyt saldo po spłacie wynosi zero, a odsetki naliczane są tylko od salda istniejącego na początku okresu.

## Requirements

### Functional Requirements

- **FR-001**: Użytkownik MUSI móc podać kwotę kredytu, liczbę rat, datę pierwszej raty oraz marżę banku w punktach procentowych.
- **FR-002**: Użytkownik MUSI móc wybrać raty równe albo malejące.
- **FR-003**: Użytkownik MUSI móc wybrać POLSTR 1M albo WIBOR 3M jako wskaźnik referencyjny.
- **FR-004**: System MUSI korzystać z serii wartości wybranego wskaźnika i przyjmować ostatnią znaną wartość po zakończeniu dostępnej serii.
- **FR-005**: System MUSI wyznaczać oprocentowanie okresu jako sumę wartości wskaźnika i marży banku.
- **FR-006**: System MUSI aktualizować POLSTR 1M co miesiąc w dniu raty, a WIBOR 3M co kwartał w dniu raty.
- **FR-007**: System MUSI naliczać odsetki proste od salda z początku okresu, bez kapitalizacji w ramach miesiąca.
- **FR-008**: System MUSI zaokrąglać kwoty do grosza według jednej, spójnej reguły i stosować ratę wyrównującą na końcu harmonogramu.
- **FR-009**: System MUSI zagwarantować, że suma części kapitałowych po zaokrągleniach jest równa kwocie kredytu pomniejszonej o wykonane nadpłaty, a saldo końcowe nie jest ujemne.
- **FR-010**: Użytkownik MUSI móc dodać, zmienić i usunąć nadpłatę, podając numer raty, kwotę oraz tryb „obniż ratę” albo „skróć okres”.
- **FR-011**: System MUSI stosować każdą nadpłatę w przypisanym okresie i uwzględniać jej wpływ na kolejne raty, saldo, czas spłaty oraz sumę odsetek.
- **FR-012**: System MUSI udostępniać wynik obliczeń zawierający parametry operacji, oprocentowanie, pierwszą ratę, ostatnią ratę, sumę odsetek oraz tabelę rat.
- **FR-013**: Każdy wiersz harmonogramu MUSI zawierać numer raty, datę, część kapitałową, część odsetkową, ratę i saldo po spłacie; nadpłata MUSI być dostępna w wyniku, aby można ją było wyeksportować.
- **FR-014**: Ekran MUSI prezentować komunikat postępu podczas obliczania oraz czytelny komunikat błędu, gdy wynik nie może zostać pobrany lub obliczony.
- **FR-015**: Użytkownik MUSI móc pobrać aktualny harmonogram jako plik CSV z nagłówkami i wszystkimi wierszami wyniku.
- **FR-016**: Ponowne obliczenie po zmianie parametrów MUSI zastąpić poprzedni wynik aktualnym harmonogramem.
- **FR-017**: Dla danych kontrolnych z `BRIEF.md` system MUSI zwrócić ratę równą 2 494,72 zł oraz ostatnią ratę wyrównującą 2 492,53 zł, każdą z tolerancją +/- 0,05 zł.

### Key Entities

- **Parametry kredytu**: Kwota, liczba rat, data pierwszej raty, marża, typ raty i wybrany wskaźnik opisujące warunki obliczenia.
- **Seria wskaźnika**: Uporządkowane wartości POLSTR 1M lub WIBOR 3M przypisane do okresów obowiązywania.
- **Nadpłata**: Kwota dodatkowej spłaty przypisana do numeru raty wraz z decyzją o obniżeniu raty lub skróceniu okresu.
- **Rata harmonogramu**: Pojedynczy okres spłaty z datą, kapitałem, odsetkami, łączną ratą, nadpłatą i saldem po spłacie.
- **Harmonogram spłat**: Uporządkowany wynik wszystkich rat wraz z podsumowaniem kosztu odsetek i parametrów obliczenia.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Doradca może wprowadzić komplet parametrów i uzyskać wynik w czasie nie dłuższym niż 5 sekund dla harmonogramu obejmującego 300 rat.
- **SC-002**: Dla 100% poprawnych danych wejściowych suma części kapitałowych i nadpłat nie przekracza kwoty kredytu, a saldo końcowe wynosi 0,00 zł.
- **SC-003**: Dla danych kontrolnych z wymagania FR-017 obie wartości rat mieszczą się w tolerancji +/- 0,05 zł.
- **SC-004**: Użytkownik może znaleźć pierwszą ratę, ostatnią ratę i sumę odsetek bez przewijania tabeli wyników po zakończeniu obliczenia.
- **SC-005**: Co najmniej 95% prób obliczenia z poprawnymi danymi kończy się wyświetleniem harmonogramu bez ręcznej korekty wyniku.
- **SC-006**: Wyeksportowany plik CSV zawiera 100% wierszy widocznego wyniku oraz wartości kwotowe z dokładnością do jednego grosza.
- **SC-007**: Użytkownik rozróżnia oba wskaźniki, oba typy rat i oba tryby nadpłaty na podstawie etykiet formularza bez dodatkowej instrukcji.

## Assumptions

- Użytkownikiem MVP jest doradca bankowy lub osoba analizująca ofertę kredytu; nie ma kont użytkowników ani podziału uprawnień.
- Wartości wskaźników dostarczone w danych projektu są źródłem przykładowych danych dla MVP i nie są pobierane w czasie rzeczywistym.
- Wartość wskaźnika jest brana wprost dla danego okresu; składanie dziennych stawek POLSTR wstecz za okres odsetkowy pozostaje poza zakresem MVP.
- Kwoty prezentowane użytkownikowi i eksportowane do CSV są wyrażone w złotych z dwoma miejscami po przecinku, a obliczenia zachowują dokładność groszową.
- MVP obsługuje jedną walutę: PLN.
- CSV jest eksportem bieżącego wyniku po stronie użytkownika i nie wymaga przechowywania pliku po stronie systemu.
- Widok musi działać na ekranie desktopowym oraz na węższym ekranie z przewijaniem tabeli; osobne wymagania dostępności i testy end-to-end nie rozszerzają zakresu tej specyfikacji.
- Produkcyjne wdrożenie jest publikowane po połączeniu repozytorium z usługą wdrożeniową zgodnie z wymaganiami projektu; specyfikacja nie definiuje procesu kont ani konfiguracji dostawcy.
