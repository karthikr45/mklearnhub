# LearnHub Helm chart

Deploys the LearnHub platform (api, web, admin) to Kubernetes with an nginx
Ingress, cert-manager TLS, a ConfigMap for non-secret env, a Secret for
credentials, and a HorizontalPodAutoscaler on the API.

## Prerequisites

- Kubernetes 1.25+
- Helm 3.8+
- An `ingress-nginx` controller
- [cert-manager](https://cert-manager.io/) with a `ClusterIssuer` named
  `letsencrypt-prod` (or change `ingress.annotations`)
- Postgres, Redis and (optionally) Elasticsearch reachable in-cluster — this
  chart does **not** provision them; point `postgres`/`redis`/`elasticsearch`
  values at your managed or in-cluster instances.

## Install

```bash
# Lint / preview the rendered manifests
helm lint ./infra/helm
helm template learnhub ./infra/helm -f my-values.yaml

# Install
helm install learnhub ./infra/helm -f my-values.yaml

# Upgrade
helm upgrade learnhub ./infra/helm -f my-values.yaml
```

## Configuration

| Key                                          | Description                                  | Default            |
| -------------------------------------------- | -------------------------------------------- | ------------------ |
| `images.<app>.repository` / `.tag`           | Container image per app                      | `ghcr.io/learnhub/*` |
| `replicaCount.{api,web,admin}`               | Replicas (api overridden by HPA)             | 2 / 2 / 1          |
| `ingress.host`                               | Public hostname                              | `app.learnhub.com` |
| `ingress.tls.secretName`                     | cert-manager TLS secret                      | `learnhub-tls`     |
| `autoscaling.minReplicas/maxReplicas`        | API HPA bounds                               | 2 / 10             |
| `autoscaling.targetCPUUtilizationPercentage` | HPA CPU target                               | 70                 |
| `config.*`                                   | Non-secret env → ConfigMap                   | see `values.yaml`  |
| `secrets.values.*`                           | Secret env → base64 Secret                   | see `values.yaml`  |

### Routing

The single Ingress fans out by path on `ingress.host`:

- `/api` → api service (`/api/v1/health` is the readiness probe)
- `/admin` → admin service
- `/` → web service

## Secrets & Vault

`secrets.create: true` renders an in-chart `Secret` from `secrets.values` (base64
via `b64enc`). This is convenient for dev but **not recommended for production** —
plaintext lives in your values file.

For production, set `secrets.create: false` and supply the Secret out-of-band:

- **External Secrets Operator** — sync from AWS Secrets Manager / GCP Secret
  Manager into a Secret named `<release>-learnhub-secret`.
- **HashiCorp Vault** — use the Vault Agent Injector or `vault-secrets-operator`
  to materialize the same Secret name.

Both deployments reference the Secret via `envFrom.secretRef`, so as long as the
Secret name matches (`{{ include "learnhub.secretName" . }}`), no template change
is needed.

Generate the encryption key with `openssl rand -hex 32` and store it in your
secret manager as `ENCRYPTION_KEY`.
