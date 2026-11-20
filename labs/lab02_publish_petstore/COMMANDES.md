# Lab 2 — Publier votre première API (Petstore) — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 1 — Le backend d'abord

```bash
docker compose --profile core --profile apps up -d
docker compose ps
```

```bash
curl -s -i http://localhost:8081/health
curl -s -i http://localhost:8081/pets
# la réponse dépasse l'écran ? lisez-la page par page (q pour quitter) :
curl -s -i http://localhost:8081/pets | less
```

```bash
curl -s http://localhost:8081/pets/6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets/99
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/new-pet.json
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/bad-pet.json
```

## Étape 4 — L'incident (ne le sautez pas !)

### 4.2 — Provoquez la panne

```bash
docker compose stop petstore
```

```bash
docker compose ps -a
```

```bash
docker compose start petstore
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
```

## Étape 5 — Vérifier la sécurité par défaut *(optionnel, prépare le lab 3)*

```bash
curl -k -s -i https://localhost:8243/petstore/1.0.0/pets
```

## Panne simulée (pour aller plus loin)

```bash
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-on.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-off.json
```

## Nettoyage

```bash
docker compose --profile core --profile apps stop
docker compose ps -a      # les conteneurs sont toujours listés, en état exited
```
