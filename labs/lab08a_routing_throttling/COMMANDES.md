# Lab 8a — Collision de contexte & throttling — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Partie A — La collision

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore-demo/1.0.0/pets
```

## Partie B — La rafale et le 429

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_COURTIERPLUS 15
```

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_BURST 15
```

```bash
curl -k -s -i -H "Authorization: Bearer TOKEN_BURST" https://localhost:8243/petstore/1.0.0/pets
```
