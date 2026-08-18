# Contributing

Thanks for helping improve Open Travel Platform.

## Development

1. Fork or clone the repository.
2. Use Node.js 24 LTS.
3. Copy `.env.example` to `.env.local` if you need custom local settings.
4. Keep `NEXT_PUBLIC_DATA_MODE=demo` unless you are testing an API adapter.
5. Run the checks before opening a pull request:

```bash
npm install
npm run check
```

## Architecture rules

- Keep domain types independent from Next.js and infrastructure SDKs.
- Add vendor integrations as adapters rather than hard-coding them in components.
- Keep demo data fictional and free of personal information.
- Do not add production endpoints, credentials or customer data.
- Document new environment variables in `.env.example`.

## Pull requests

A pull request should explain:

- what changes;
- why the change is needed;
- any architecture or security impact;
- how the change was validated.

Small, focused pull requests are preferred.
