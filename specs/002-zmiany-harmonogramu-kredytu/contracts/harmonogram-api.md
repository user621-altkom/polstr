# Kontrakt API: tryb nadpłaty

## Endpoint

`GET /api/harmonogram`

Istniejące parametry kredytu pozostają bez zmian. Dla każdego wpisu nadpłaty:

| Parametr | Format | Wymagany | Znaczenie |
|---|---|---:|---|
| `nadplata[i][nrRaty]` | dodatnia liczba całkowita | nie | Numer raty, po której księgowana jest nadpłata |
| `nadplata[i][kwota]` | dodatnia liczba w zł | nie | Kwota nadpłaty |
| `nadplata[i][efekt]` | `rata` albo `okres` | nie | `rata` obniża kolejne raty; `okres` zachowuje ratę i skraca okres |

Brak `nadplata[i][efekt]` oznacza `okres`. Wartość inna niż `rata` lub `okres` skutkuje odpowiedzią 400. Każdy wpis musi zawierać numer raty i dodatnią kwotę.

## Odpowiedź 200

Kształt odpowiedzi pozostaje zgodny z istniejącym kontraktem. W `op.nadplaty` zwracany jest znormalizowany efekt:

```json
{
  "op": {
    "nadplaty": [
      { "nrRaty": 1, "kwota": 30000, "efekt": "okres" }
    ]
  },
  "harmonogram": [
    {
      "nr": 1,
      "rata": 2265.07,
      "nadplata": 30000,
      "saldo": 269399.93
    }
  ]
}
```

Dla trybu `rata` liczba rat pozostaje niezmieniona, a kolejne raty są niższe. Dla trybu `okres` rata pozostaje niezmieniona, a harmonogram kończy się wcześniej z ostatnią ratą wyrównującą.

## Odpowiedź 400

```json
{
  "blad": "nadpłata musi zawierać nrRaty, kwotę i efekt",
  "przyklad": "/api/harmonogram?..."
}
```

Odpowiedź 400 dotyczy niepoprawnego numeru raty, kwoty lub jawnie nieznanego efektu. Brak efektu nie jest błędem i jest normalizowany do `okres`.
