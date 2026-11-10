# Validate prepared lesson locale packages

Author lesson locale packages outside this repository. Use the existing localization contract to preserve lesson IDs, structure, answer choices, and locale-specific copy.

Validate the prepared packages and the platform locale contract from the repository root.

```sh
bun run locale-lessons:validate-localized -- --target all
bun run scripts/locale-lessons/validate-localization-contract.ts
```

The package validator checks the canonical Arabic source and the prepared Gulf Arabic and English packages. The contract check verifies catalogue and title parity, UI keys, and locale boundaries. Review accepted packages before using the existing content import process.

The offline Phase 13 report collectors and package repair remain available for previously exported artifacts. Test repairs against owned copies of the reference packages.
