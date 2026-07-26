---
title: SDKs
---

# SDKs

Official SDKs are maintained in a single monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks):

- **Rust** — `openfiat-sdks/rust` ([crate docs](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust))
- **TypeScript** — `openfiat-sdks/typescript` (`@openfiat/sdk` on npm, once published)
- **Python** — `openfiat-sdks/python` (`openfiat-sdk` on PyPI, once published)
- **Go / Swift / Kotlin / C#** — deferred; tracked in the monorepo's `ROADMAP.md`

All SDKs share the same `Client` / `ClientConfig` shape and will converge on
the RPC surface exposed by `openfiat-core`'s `rpc`/`api` crates.
