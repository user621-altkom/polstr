# Badanie i decyzje projektowe

## Decyzja: domena liczy w groszach

**Rationale:** `ParametryKredytu.kwotaGr` już wyznacza granicę domeny, a konstytucja wymaga całkowitych groszy. Wynik domenowy będzie przechowywał `kapitalGr`, `odsetkiGr`, `rataGr`, `saldoGr` i `nadplataGr`. Zaokrąglanie wartości pośrednich nastąpi w jednym helperze domenowym.

**Alternatives considered:** Liczenie w złotych jako `number` i zaokrąglanie dopiero przy JSON. Odrzucone, ponieważ błędy zmiennoprzecinkowe mogłyby naruszyć bilans kapitału.

## Decyzja: jedna funkcja domenowa, adapter danych wskaźników

**Rationale:** `src/domena/harmonogram.ts` pozostaje czysta i otrzymuje serię wskaźnika jako zależność albo korzysta z małego adaptera o deterministycznym interfejsie. `src/dane/wskazniki.ts` nadal importuje JSON i udostępnia serie. Route nie zawiera matematyki.

**Alternatives considered:** Odczyt JSON bezpośrednio w route handlerze. Odrzucone przez zasadę, że logika i źródło danych domenowych mają być niezależne od HTTP.

## Decyzja: wartość wskaźnika wybierana jako ostatni wpis `od <= data raty`

**Rationale:** Taki wybór implementuje opis danych „obowiązuje od dnia `od`” i „po ostatnim wpisie obowiązuje ostatnia znana wartość”. POLSTR jest sprawdzany przy każdej kolejnej dacie raty, a WIBOR korzysta z kwartalnych wpisów znajdujących się w serii; kod nie zgaduje wartości ani nie zmienia dat rat.

**Alternatives considered:** Wyznaczanie kwartału/miesiąca przez osobną tabelę kalendarzową. Odrzucone, ponieważ daty obowiązywania w JSON są źródłem prawdy, a częstotliwość jest już reprezentowana przez serię.

## Decyzja: odsetki i rata są zaokrąglane deterministycznie na okres

**Rationale:** Odsetki liczone są od salda początkowego okresu według `saldoGr * stopaRoczna / 12`, następnie zaokrąglane do grosza. Część kapitałowa jest ograniczana do bieżącego salda i zaokrąglana według tej samej reguły. Rata jest sumą zaokrąglonych składników. Ostatni okres koryguje kapitał do pozostałego salda, aby bilans był dokładny.

**Alternatives considered:** Przechowywanie pełnej precyzji aż do końca harmonogramu. Odrzucone, ponieważ wynik ma być groszowy w każdym wierszu i zgodny z liczbą kontrolną.

## Decyzja: rata równa jest przeliczana po zmianie warunków

**Rationale:** Dla rat równych wzór annuitetowy wyznacza ratę dla pozostałego salda i liczby pozostałych rat przy aktualnej stopie. Przy zmianie wskaźnika oraz po nadpłacie w trybie „obniż ratę” kolejne okresy otrzymują nową ratę. Dla trybu „skróć okres” zachowana jest rata wynikająca z warunków przed nadpłatą, a harmonogram kończy się po spłacie salda.

**Alternatives considered:** Jedna rata ustalona na początku dla całego harmonogramu. Odrzucone, bo nie obsługuje zmian wskaźnika ani wymaganych skutków nadpłat.

## Decyzja: nadpłata jest osobnym składnikiem wiersza

**Rationale:** W okresie najpierw naliczane są odsetki i regularny kapitał, następnie stosowana jest nadpłata ograniczona do pozostałego salda. Dzięki temu suma `kapitalGr + nadplataGr` jest kontrolowana, saldo nie jest ujemne, a CSV może pokazać nadpłatę osobno.

**Alternatives considered:** Wliczanie nadpłaty w `kapitalGr`. Odrzucone, ponieważ utrudnia spełnienie kontraktu eksportu i rozróżnienie regularnej spłaty od dodatkowej.

## Decyzja: API prezentuje kwoty w złotych, domena pozostaje groszowa

**Rationale:** Istniejący ekran i specyfikacja opisują JSON z kwotami dziesiętnymi w złotych, natomiast konstytucja wymaga groszowej arytmetyki. Route będzie jedynym miejscem konwersji groszy na liczby złotowe i zaokrąglenia serializacyjnego; kontrakt jawnie opisuje tę granicę.

**Alternatives considered:** Publiczne API w groszach. Możliwe technicznie, ale wymagałoby zmiany istniejącego interfejsu UI i zwiększałoby ryzyko pomylenia jednostek.

## Decyzja: błąd API nie uruchamia fallbacku finansowego w UI

**Rationale:** Obecny `buildFallbackResponse` używa stałej stopy i ignoruje część reguł MVP, więc może prezentować niepoprawny harmonogram jako wynik. Po błędzie UI wyświetli komunikat i nie zastąpi go obliczeniem zastępczym.

**Alternatives considered:** Pozostawienie fallbacku jako graceful degradation. Odrzucone przez wymaganie, że błąd nie może być przedstawiony jako poprawny harmonogram.

## Decyzja: bez nowych zależności i bez testów E2E w MVP

**Rationale:** Obecny stos zapewnia Vitest, Next.js i Tailwind. Zakres testów konstytucji obejmuje domenę i dane; quickstart sprawdza API oraz ręczny przepływ UI. To utrzymuje plan w zakresie MVP.

**Alternatives considered:** Dodanie biblioteki dat lub Playwrighta. Odrzucone: nie ma potrzeby nowej zależności dla dat ISO i obecnego wymogu, a testy E2E są poza zakresem specyfikacji.
