# Lab 8a — Colisión de contexto y throttling — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Parte A — La colisión

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore-demo/1.0.0/pets
```

## Parte B — La ráfaga y el 429

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_COURTIERPLUS 15
```

```bash
node burst.mjs https://localhost:8243/petstore/1.0.0/pets TOKEN_BURST 15
```

```bash
curl -k -s -i -H "Authorization: Bearer TOKEN_BURST" https://localhost:8243/petstore/1.0.0/pets
```
