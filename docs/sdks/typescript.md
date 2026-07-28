---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk` ([`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)) —
a typed client for a node's [JSON-RPC surface](../api), plus Ed25519
wallet signing (via `@noble/ed25519`, interoperable with the Rust SDK's
`ed25519-dalek` — the same wallet seed produces the same keys and
signatures in either language) and Solana chain bridge support.
Browser/edge-safe by design; Node-only wallet file I/O lives in a
separate `@openfiat/sdk/node` entry point.

## Install

Pre-1.0 and not published to npm yet — depend on it as a git dependency,
pinned to a commit:

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## Quick start

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:8080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

Typed methods are grouped one module per domain — `node`, `chain`,
`oracles`, `providers`, `advertisements`, `reservations`, `notifications`:

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## Signing and submitting a write

Every `sendX` method takes the domain's own event object plus a
`Keypair` — the SDK builds the signed payload and submits it; a node
never constructs or signs anything on your behalf:

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // or keypairFromSeed(...) / loadWalletFile(...) from "@openfiat/sdk/node"
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## Examples

Every example in [`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
runs against a real node and is covered by a test in
`tests/live_node.test.ts`, run in CI against an actual `openfiat-node`
process (see `.github/workflows/ci.yml`'s `typescript-sdk-live-node`
job) — a broken example fails the build the same way a broken test
would:

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts) — construct a client.
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts) — register as an Oracle Provider, publish a rate.
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts) — register as a Notification Provider, report a delivery.
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts) — publish an advertisement, open a reservation against it.
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts) — sign and submit a real Solana transaction through the chain bridge.

Run any of them against a local node:

```bash
# terminal 1 — from openfiat-core
CLI_HTTP_ADDR=127.0.0.1:8080 cargo run -p openfiat-cli

# terminal 2 — from openfiat-sdks/typescript
pnpm tsx examples/trading_bot.ts
```
