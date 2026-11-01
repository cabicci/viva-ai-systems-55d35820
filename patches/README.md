# Dependency security compatibility

The root overrides use Seroval 1.6.11, Minimatch 11.0.1 and React Email render
2.2.0. The renderer's HTML-to-text 10 dependency removes the unfixed Deepmerge
4.3.1 path. The other two versions fix the reported serializer injection and
glob preprocessing advisories. Keep `bun audit` enabled for every severity.

`minimatch@11.0.1.patch` adds an ESM default export and its type declaration for
the existing named `minimatch` function. Installed ESLint 9 dependencies import
that legacy default; the function already carries their `Minimatch` static API.
The patch changes no matcher, parser, limits or security fix. `vite.config.ts`
also limits the old bare `entities` alias to that exact entry, so HTML-to-text
10 can resolve its own modern `entities/decode` export. CJS consumers use
the supported named APIs. Bun applies the patch from the checked-in lockfile;
do not edit an installed package as a release step.

`src/lib/__tests__/dependency-security-compat.test.ts` checks both module styles,
real ESLint matching/rule execution, the two serializer attack shapes and Arabic
email HTML/plain-text rendering. Existing email-template tests cover application
copy and routing without sending mail. Remove this compatibility patch only
after the installed consumers support the upstream named ESM exports.

Primary references:

- https://github.com/TehShrike/deepmerge/issues/273
- https://github.com/resend/react-email/releases/tag/@react-email%2Frender@2.2.0
- https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249
- https://github.com/lxsmnsyc/seroval/security/advisories/GHSA-f86p-h4j2-7qgj
- https://github.com/lxsmnsyc/seroval/security/advisories/GHSA-9wx9-5pv9-3349
