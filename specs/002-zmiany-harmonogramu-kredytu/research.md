# Research: Wybór skutku nadpłaty

## Decyzja 1: Zachować istniejące wartości trybu

**Decyzja**: Pozostawić domenowe wartości `rata` i `okres`, odpowiadające odpowiednio „obniż ratę” i „skróć okres”. Nie zmieniać nazw w formularzu ani w kontrakcie odpowiedzi.

**Uzasadnienie**: Model domeny, route handler i UI już używają tych wartości. Zmiana nazw nie dodaje wartości biznesowej i zwiększa ryzyko niezgodności z istniejącym API.

**Rozważane alternatywy**: Wprowadzenie wartości `obniz_rata` i `skroc_okres` odrzucono, ponieważ wymagałoby niepotrzebnej migracji wszystkich warstw.

## Decyzja 2: Domyślny tryb braku pola

**Decyzja**: Brak `efekt` w wejściu normalizować do `okres`, czyli „skróć okres”. Jawny `rata` oznacza „obniż ratę”, a jawny `okres` pozostaje bez zmian.

**Uzasadnienie**: To dokładnie zachowanie wymagane przez CR-A i zachowuje dotychczasowy domyślny skutek nadpłaty.

**Rozważane alternatywy**: Odrzucanie braku pola odrzucono, ponieważ łamałoby kryterium domyślnego trybu.

## Decyzja 3: Moment zastosowania nadpłaty

**Decyzja**: Najpierw naliczyć odsetki i regularną ratę od salda z początku okresu, potem odjąć nadpłatę; przeliczenie raty w trybie `rata` obowiązuje od następnego okresu.

**Uzasadnienie**: Jest to jawna konwencja CR-A i zapobiega wpływowi nadpłaty na odsetki już zakończonego okresu.

**Rozważane alternatywy**: Naliczanie odsetek od salda po nadpłacie odrzucono jako sprzeczne z wymaganiem i liczbami kontrolnymi.

## Decyzja 4: Zakres zmian

**Decyzja**: Nie zmieniać danych wskaźników ani warstwy UI poza weryfikacją istniejącego wyboru trybu.

**Uzasadnienie**: Specyfikacja obejmuje wyłącznie wybór skutku nadpłaty; istniejące UI już pozwala wybrać oba tryby.

**Rozważane alternatywy**: Rozszerzenie zakresu na pozostałe zmiany z pliku wymagań odrzucono jako sprzeczne z aktualnym poleceniem.
