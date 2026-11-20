# Lab 1 — Installer WSO2 API Manager avec Docker — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 1 — Deux vérifications

```bash
docker --version
```

```bash
docker info --format "{{.MemTotal}}" | awk '{printf "%.1f Go\n", $1/1073741824}'
```

## Étape 3 — Le sabotage : poser le proxy fantôme

```bash
docker images wso2/wso2am
```

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/proxy-simulation-lab01.conf <<'EOF'
[Service]
Environment="HTTP_PROXY=http://203.0.113.1:3128"
Environment="HTTPS_PROXY=http://203.0.113.1:3128"
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker    # le proxy doit apparaître
```

## Étape 4 — La panne

```bash
docker compose --profile core up -d
```

## Étape 6 — La résolution

```bash
sudo rm /etc/systemd/system/docker.service.d/proxy-simulation-lab01.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker    # ne doit plus lister le proxy
```

## Étape 7 — La relance et le démarrage

```bash
docker compose --profile core up -d
```

```bash
docker compose ps
docker compose logs -f wso2am
```

## Étape 9 — Vérifications curl

```bash
curl -k -s -L -o /dev/null -w "%{http_code}\n" https://localhost:9443/publisher
curl -k -s -i https://localhost:8243/
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Nettoyage (fin de session de travail)

```bash
docker compose --profile core stop      # arrêt sans suppression (conteneur conservé, pas de nouveau téléchargement)
```
