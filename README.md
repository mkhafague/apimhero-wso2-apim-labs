# WSO2 API Management — La Mission · ressources des labs

Dossier de travail des 13 labs de la formation **WSO2 API Management — La Mission**
(Apim Hero, https://learn.apimhero.com) : la stack Docker, les backends d'exemple et le
harnais de tests. Les fiches pas à pas de chaque lab sont sur la plateforme de formation.

Même contenu que l'archive `ressources-labs.zip` jointe à la fiche du lab 0 — ce dépôt en
est la version suivie : `git pull` pour récupérer une correction.

```bash
git clone https://github.com/mkhafague/apimhero-wso2-apim-labs.git WSO2-APIM-training
cd WSO2-APIM-training/labs
cp .env.example .env
docker compose --profile core up -d
```

| Dossier | Contenu |
|---|---|
| `labs/` | `docker-compose.yml` à profils (`core`, `apps`, `staging`, `iam`, `integration`), configuration par lab |
| `apps/` | backends Node d'exemple : `petstore`, `invoices`, `legacy-mock` |
| `apis/specs/` | contrats OpenAPI `petstore.yaml`, `invoices.yaml` |
| `apis/tests/` | harnais `run-tests.mjs` et ses fichiers d'environnement |

Prérequis : Docker Desktop ou Docker Engine avec Compose V2, curl, Node.js 18+, 16 Go de
mémoire recommandés (8 Go suffisent en n'activant que les profils du lab en cours). Tout est
détaillé dans la fiche du lab 0.

Les comptes (`admin` / `admin`, keystores `wso2carbon`) sont les valeurs par défaut WSO2,
pour un poste de travail isolé — jamais en entreprise.

---

**English** — Working folder for the 13 labs of the *WSO2 API Management — The Mission*
course (Docker stack, sample backends, test harness). The step-by-step lab handouts are on
the training platform. Same content as the `ressources-labs.zip` archive attached to lab 0;
this repository is the tracked version: `git pull` to get a fix.

**Español** — Carpeta de trabajo de las 13 prácticas del curso *WSO2 API Management — La
Misión* (stack Docker, backends de ejemplo, suite de pruebas). Las fichas paso a paso están
en la plataforma de formación. Mismo contenido que el archivo `ressources-labs.zip` adjunto
a la práctica 0; este repositorio es la versión con seguimiento: `git pull` para obtener una
corrección.
