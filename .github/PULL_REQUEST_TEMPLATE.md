## Summary

Describe the focused change and the problem it solves.

## Capability / architecture impact

- Which capability boundary changes?
- Does this introduce or modify an adapter/interface?
- Does it couple core UI/domain code to a provider?

## Security and privacy

- Does this change authentication, authorization, booking writes, staff operations or customer data handling?
- Are new browser-visible environment variables safe to expose publicly?

## Validation

- [ ] `npm run check:safety`
- [ ] `npm run check:release`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Relevant flows were tested
- [ ] No private customer data or protected deployment values were committed
- [ ] Documentation/config examples were updated when behavior changed
