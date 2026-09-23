# Specyfikacja funkcji: Wybór skutku nadpłaty

**Feature Branch**: `002-zmiany-harmonogramu-kredytu`

**Created**: 2026-09-23

**Status**: Ready for planning

**Input**: User description: "Zrealizować wyłącznie wymaganie dotyczące wyboru skutku nadpłaty z pliku dodatkowe_wymagania.md."

## User Scenarios & Testing

### User Story 1 - Wybór skutku nadpłaty (Priority: P1)

Doradca bankowy dodaje nadpłatę i wybiera, czy klient chce zachować dotychczasową ratę i skrócić okres, czy zachować okres i obniżyć ratę. Doradca może porównać oba warianty dla tych samych warunków kredytu.

**Why this priority**: To jedyna zmiana w bieżącym zakresie i bezpośrednio określa wynik finansowy nadpłaty.

**Independent Test**: Dla kredytu 300 000 zł, 240 rat równych, oprocentowania 6,66% i nadpłaty 30 000 zł po pierwszej racie można obliczyć oba tryby oraz porównać ratę, liczbę rat, saldo i sumę kapitału.

**Acceptance Scenarios**:

1. **Given** nadpłata bez wskazanego trybu, **When** doradca oblicza harmonogram, **Then** system stosuje tryb „skróć okres”.
2. **Given** nadpłata z trybem „obniż ratę”, **When** nadpłata zostaje zaksięgowana po racie danego miesiąca, **Then** liczba rat pozostaje bez zmian, a rata od kolejnego okresu jest wyliczona od salda po nadpłacie dla pozostałych rat.
3. **Given** nadpłata z trybem „skróć okres”, **When** nadpłata zostaje zaksięgowana po racie danego miesiąca, **Then** rata pozostaje bez zmian, harmonogram kończy się wcześniej, a ostatnia rata wyrównuje pozostałe saldo.
4. **Given** dowolny z dwóch trybów, **When** harmonogram zostaje zakończony, **Then** suma kapitału z rat i nadpłat jest równa kwocie kredytu, a saldo końcowe wynosi 0,00 zł.
5. **Given** kilka nadpłat, **When** każda z nich ma przypisany tryb, **Then** system stosuje tryb niezależnie dla właściwego okresu i nie zastępuje go trybem innej nadpłaty.

### Edge Cases

- Brak trybu nadpłaty oznacza „skróć okres”; tylko dwa jawne tryby są poprawne.
- Nadpłata równa lub większa od bieżącego salda kończy kredyt z saldem 0,00 zł, bez ujemnego salda.
- Nadpłata przypisana do nieistniejącego lub zakończonego okresu jest odrzucona jako niepoprawna.
- Kwota kredytu i kwota nadpłaty muszą być dodatnie; niepoprawna nadpłata nie może zostać zastosowana.
- Nadpłata jest księgowana po racie danego miesiąca, a odsetki tego okresu są liczone od salda sprzed nadpłaty.
- Zaokrąglenia nie mogą spowodować, że suma rat i nadpłat różni się od kwoty kredytu albo że końcowe saldo jest ujemne.
- Ostatnia rata w trybie „skróć okres” może być niższa od raty regularnej i musi wyrównać pozostałe saldo.
- Harmonogram bez nadpłat zachowuje dotychczasowe działanie.

## Requirements

### Functional Requirements

- **FR-001**: System MUSI obsługiwać przy każdej nadpłacie tryb „skróć okres” albo „obniż ratę”, a brak trybu MUSI oznaczać „skróć okres”.
- **FR-002**: System MUSI dla trybu „obniż ratę” zachować pierwotną liczbę rat i wyliczyć ratę od salda po nadpłacie dla pozostałego okresu.
- **FR-003**: System MUSI dla trybu „skróć okres” zachować ratę regularną, zakończyć harmonogram wcześniej po spłacie salda i zastosować ostatnią ratę wyrównującą.
- **FR-004**: System MUSI stosować nadpłatę po zaksięgowaniu raty danego miesiąca, a odsetki tego okresu MUSZĄ być liczone od salda sprzed nadpłaty.
- **FR-005**: System MUSI zapewnić, że w obu trybach suma kapitału z rat i nadpłat równa się kwocie kredytu, a saldo końcowe wynosi 0,00 zł.
- **FR-006**: System MUSI umożliwiać dodanie, zmianę i usunięcie nadpłaty wraz z jej numerem raty, kwotą i trybem.
- **FR-007**: System MUSI stosować kilka nadpłat w przypisanych okresach, niezależnie od tego, czy mają ten sam, czy różne tryby.
- **FR-008**: System MUSI odrzucić ujemną lub zerową kwotę nadpłaty, niepoprawny numer raty oraz nieznany tryb.
- **FR-009**: System MUSI zaokrąglać kwoty finansowe do grosza według jednej, spójnej reguły i uwzględniać ratę wyrównującą na końcu harmonogramu.
- **FR-010**: System MUSI zachować dotychczasowe zachowanie dla harmonogramu bez nadpłat.

### Key Entities

- **Nadpłata**: Dodatkowa spłata przypisana do numeru raty, zawierająca kwotę i tryb rozliczenia.
- **Tryb nadpłaty**: Decyzja „skróć okres” albo „obniż ratę”, określająca wpływ nadpłaty na dalszy harmonogram.
- **Okres harmonogramu**: Wiersz spłaty zawierający ratę, kapitał, odsetki, nadpłatę i saldo po spłacie.
- **Podsumowanie harmonogramu**: Zestawienie liczby rat, raty, sumy kapitału, nadpłat, odsetek i salda końcowego.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dla danych kontrolnych CR-A rata przed nadpłatą wynosi 2 265,07 zł, a saldo po pierwszej racie i nadpłacie 30 000 zł wynosi 269 399,93 zł, z tolerancją 0,05 zł.
- **SC-002**: Dla danych kontrolnych CR-A tryb „obniż ratę” daje 240 rat łącznie i ratę od drugiego okresu 2 038,11 zł, z tolerancją 0,05 zł.
- **SC-003**: Dla danych kontrolnych CR-A tryb „skróć okres” zachowuje ratę 2 265,07 zł, kończy harmonogram po 196 ratach łącznie, w tym 195 po nadpłacie, a ostatnia rata wynosi 2 200,53 zł, z tolerancją 0,05 zł.
- **SC-004**: Dla 100% poprawnych harmonogramów suma kapitału z rat i nadpłat jest równa kwocie kredytu z dokładnością do 0,01 zł, a saldo końcowe wynosi 0,00 zł.
- **SC-005**: Doradca może rozpoznać wybrany tryb nadpłaty, jej kwotę i wpływ na liczbę rat oraz wysokość raty na podstawie wyniku bez dodatkowych obliczeń.
- **SC-006**: Ponowne obliczenie bez nadpłaty daje wynik zgodny z dotychczasowym harmonogramem, bez zmiany liczby rat, odsetek ani salda wynikającej z samego wdrożenia trybu.

## Assumptions

- Zakres obejmuje wyłącznie wybór skutku nadpłaty; inne zmiany opisane w pliku dodatkowych wymagań nie są częścią tej funkcji.
- Nadpłata jest księgowana po racie danego miesiąca, zgodnie z konwencją podaną w wymaganiu CR-A.
- W trybie „obniż ratę” pierwotna liczba rat oznacza całkowitą liczbę rat kredytu, łącznie z ratą, po której zaksięgowano nadpłatę.
- W trybie „skróć okres” regularna rata pozostaje niezmieniona po nadpłacie, a ostatnia rata może być wyrównująca.
- Wszystkie kwoty są prezentowane w PLN z dokładnością do grosza, a obliczenia zachowują istniejącą regułę zaokrąglania projektu.
- Istniejące zasady dotyczące rat równych, rat malejących i serii wskaźników pozostają bez zmian poza wpływem wybranego trybu nadpłaty.
- Wymaganie prawne stanowi kontekst biznesowy; wartości z przykładu CR-A są danymi kontrolnymi produktu.
