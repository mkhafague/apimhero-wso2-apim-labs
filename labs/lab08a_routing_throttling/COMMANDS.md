# Lab 8a — Context collision & throttling — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Part A — The collision

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore-demo/1.0.0/pets
```

## Part B — The burst and the 429

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_COURTIERPLUS 15
```

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_BURST 15
```

```bash
curl -k -s -i -H "Authorization: Bearer TOKEN_BURST" https://localhost:8243/petstore/1.0.0/pets
```
