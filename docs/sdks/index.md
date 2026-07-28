---
title: SDKs
---

# SDKs

Official SDKs are maintained in a single monorepo,
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks). Both are
real, tested against a live [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
node in CI (not just typechecked) and cover the full [RPC surface](../api):
advertisements, reservations, settlement, trade, disputes, identity,
governance, service providers, notifications, oracles, risk, snapshots,
sessions, and the [Solana chain bridge](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md).

- **[Rust →](rust)** — `openfiat-sdk` in the monorepo's `rust/` directory.
- **[TypeScript →](typescript)** — `@openfiat/sdk` in `typescript/`.

Every SDK shares the same shape: a `Client`/`ClientConfig` for talking to
a node's JSON-RPC surface, typed `getX`/`sendX` methods per domain (one
module per domain — see either SDK's own module layout), and a signing
primitive that never leaves your own process — a node only ever receives
an already-signed payload, exactly like Solana's `sendTransaction`.

## Not yet ready

Python, Go, Swift, Kotlin, and C# have scaffolding in the monorepo
(`python/`, `go/`, `swift/`, `kotlin/`, `csharp/`) but no real
implementation yet — tracked in the monorepo's `ROADMAP.md`. Use Rust or
TypeScript today; contributions extending one of the others are welcome.
