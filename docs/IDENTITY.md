# Identity and customer accounts

Open Travel Platform treats identity as an infrastructure concern behind a small repository contract.

```text
Account UI
   |
   v
IdentityRepository
   |
   +--> DemoIdentityRepository
   |
   +--> Future Auth.js / OAuth / SSO / external API adapter
```

## Domain contract

`IdentityRepository` exposes only the capabilities application pages need:

- resolve the current identity;
- resolve the customer profile for that identity.

Provider SDKs, tokens and session implementation details must stay outside UI components and travel-domain code.

## Built-in demo mode

The repository ships with a fictional customer and a passwordless demo session. It exists only to demonstrate account routing and customer UI without requiring external infrastructure.

The demo session:

- handles no passwords or credentials;
- stores only a fictional identity id in an HTTP-only cookie;
- uses `SameSite=Lax`;
- uses the `Secure` flag in production;
- expires after eight hours;
- grants access only to fictional local demo data.

It is **not** a production authentication or authorization mechanism.

## Production rule

In production, demo sign-in is disabled unless `DEMO_IDENTITY_ENABLED=true` is explicitly configured.

A production integration should implement `IdentityRepository` using a suitable provider or backend and enforce authorization on trusted server-side boundaries.

Recommended concerns for a production adapter include:

- verified identity/session validation;
- CSRF protections where applicable;
- secure cookie/token lifecycle;
- role/permission mapping;
- account revocation;
- audit logging;
- rate limiting;
- MFA or stronger assurance when required;
- server-side authorization for private resources.

## Configuration

```text
IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false
```

`IDENTITY_MODE` is intentionally server-only. Identity secrets must never use a `NEXT_PUBLIC_*` variable.

## Roles

The domain currently defines:

- `customer`
- `operator`
- `admin`

v0.3 uses the `customer` role only. Operator/admin authorization will be built on the same role model in later milestones.
