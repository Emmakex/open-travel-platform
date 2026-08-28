# Container deployment

<p align="center"><strong>English</strong> · <a href="./CONTAINERS.es.md">Español</a></p>

Status: **Phase 11.1 — ACTIVE until merged and verified on `main`**

## Purpose

Open Travel Platform can be packaged as a provider-neutral OCI/Docker image using the same Next.js standalone runtime already validated by the self-host workflow. The container path does not introduce a second application runtime or a provider-specific deployment dependency.

Phase 11.1 covers local/container-host deployment and CI validation only. **Registry publication is intentionally outside this slice** and will require a later Phase 11 scope.

## Build the image

From a clean checkout:

```bash
docker build -t open-travel-platform:local .
```

The multi-stage image:

1. installs the exact dependency graph with `npm ci`;
2. runs `npm run build`;
3. runs `npm run package:standalone`;
4. copies only `.next/standalone` into the runtime stage.

The final image uses Node.js 24 on Debian slim and does not need the source tree, npm cache or build toolchain at runtime.

## Infrastructure-free demo runtime

The repository demo profile remains usable without MongoDB, SMTP, PSP, CRM, ERP or supplier credentials:

```bash
docker run --rm \
  --name open-travel-platform \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

Then open `http://127.0.0.1:3000`.

`.env.demo.example` is passed at **runtime**. It is not a production configuration and must not be replaced with secrets inside the Dockerfile or committed image layers.

## Runtime configuration

Production settings are supplied when the container starts, for example with `--env-file`, an orchestrator secret/config mechanism or platform environment variables.

Do not bake credentials into the image with `ARG`, `ENV`, copied `.env` files or generated source files. This includes MongoDB credentials, SMTP passwords, PSP secrets, Traveller Data keys, integration keys and adapter tokens.

The image provides safe runtime defaults only for:

```text
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

All privileged capability configuration remains server-side and runtime-injected.

## Non-root runtime

The final image creates and runs as the dedicated `app` user with fixed UID/GID `10001:10001`.

Do not switch the final image back to root merely to mount writable paths. If an operator needs writable persistent storage, provision that storage with explicit ownership and the minimum required scope.

## Health checks

The built-in Docker healthcheck calls:

```text
GET /api/health/live
```

Use liveness to determine whether the process is running.

For production traffic routing, use the stronger readiness endpoint:

```text
GET /api/health/ready
```

Readiness can reflect required production dependencies and should be the signal used by a reverse proxy or orchestrator before sending traffic.

## Validation

Static/source invariants:

```bash
npm run check:container
```

The dedicated GitHub Actions workflow also performs a real image build, starts the image with `.env.demo.example`, waits for the application, verifies the non-root user and health state, and exercises representative HTTP routes and static assets.

The full project gate remains:

```bash
npm run verify
```

## Production deployment notes

- place TLS termination/reverse proxying in front of the container as described in `DEPLOYMENT.md`;
- inject production secrets at runtime through the deployment platform, never through image layers;
- use immutable image references/digests when a registry publication phase is introduced;
- keep MongoDB and other stateful services outside the application container unless a deployment-specific architecture explicitly manages them;
- preserve the existing provider-neutral repository/adapter authority boundaries;
- validate `/api/health/ready` before production traffic;
- record the exact Open Travel Platform version/tag and image digest in deployment records.

## Kairoseth boundary

This Dockerfile belongs to the public MIT-licensed Open Travel Platform core. It does not contain private Kairoseth/customer adapters or grant official Kairoseth Travel branding to independently operated images/services. See `TRADEMARKS.md`.

The official Kairoseth Travel deployment may consume this public container contract while keeping proprietary integrations and deployment configuration outside the MIT core.
