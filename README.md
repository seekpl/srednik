# Średnik by .dot – strona internetowa

Strona główna marki Średnik (modernizacja istniejących stron internetowych), zbudowana na podstawie projektu „Średnik by .dot – strona główna”.

Statyczna strona: HTML, CSS i JavaScript, bez procesu budowania. Wystarczy wgrać pliki na dowolny hosting.

## Co jest na stronie

- **Intro** – logo składa się z kropki i przecinka (raz na sesję, kliknięcie pomija).
- **Modernizacja na żywo** – makieta strony „Auto-Serwis Marek” (projekt demonstracyjny) zmienia się w trakcie przewijania: audyt z zaznaczonymi problemami → nowy nagłówek → telefon w widocznym miejscu → oferta zamiast starych aktualności → nowy układ → wersja mobilna → raport „było / jest”.
- Pasek z zakresem prac reagujący na prędkość przewijania, interaktywna lista objawów z werdyktem, cytat podświetlany słowo po słowie, liczone ceny, linia procesu wypełniana przewijaniem, animowane FAQ, formularz z walidacją, kropka zamieniająca się w średnik w stopce.
- Płynne przewijanie (Lenis), animacje GSAP + ScrollTrigger.
- Pełna obsługa `prefers-reduced-motion`: przy ograniczonym ruchu strona działa bez animacji. Bez JavaScriptu cała treść jest widoczna.

## Struktura

```
index.html                  strona główna
send.php                    wysyłka formularza kontaktowego (PHP)
polityka-prywatnosci.html   polityka prywatności (wersja robocza)
assets/css/style.css        style
assets/js/main.js           animacje i interakcje
assets/vendor/              GSAP 3.15 (ScrollTrigger, SplitText, ScrambleText, DrawSVG), Lenis 1.3
assets/fonts/               Schibsted Grotesk i Literata (lokalnie, bez Google Fonts)
assets/img/                 logo, favicon, obrazek do udostępniania (og.png)
```

## Podgląd lokalny

```bash
python3 -m http.server 8000
```

Następnie otwórz http://localhost:8000.

## Zdjęcie warsztatu w makiecie

Makieta „Auto-Serwis Marek” korzysta ze zdjęcia `assets/img/warsztat.jpg` (wygenerowane w Higgsfield, format 3:2, ok. 1024 px szerokości). Na starej stronie pokazuje je rozciągnięte i wyblakłe, a po modernizacji porządnie wykadrowane, także na ekranie telefonu. Jeśli pliku nie ma, strona sama pokazuje zapasową ilustrację, więc nic się nie psuje.

## Dane kontaktowe

E-mail sebastian.biel@me.com, telefon 790 700 061, NIP 8681879901 – w stopce, w sekcji kontaktu, w danych strukturalnych (JSON-LD) i w polityce prywatności.

## Do uzupełnienia przed publikacją

1. **Wysyłka formularza** – formularz wysyła zgłoszenia przez `send.php` na adres sebastian.biel@me.com (hosting musi obsługiwać PHP z funkcją `mail()`; ma to większość polskich hostingów). Po wgraniu wyślij zgłoszenie testowe i sprawdź, czy dotarło, także w folderze spam. Jeśli serwer nie obsługuje PHP, formularz pokaże komunikat z e-mailem i telefonem; wtedy wpisz w atrybucie `action` adres usługi typu Formspree.
2. **Polityka prywatności** – uzupełnij pola oznaczone na żółto w `polityka-prywatnosci.html` i daj tekst do sprawdzenia prawnikowi.
3. **Adres strony w meta tagach** – po wyborze domeny warto zmienić `og:image` na pełny adres (np. `https://twojadomena.pl/assets/img/og.png`).

## Licencje bibliotek

- GSAP – darmowy, także komercyjnie, na warunkach https://gsap.com/standard-license
- Lenis – MIT
- Fonty Schibsted Grotesk i Literata – SIL Open Font License
