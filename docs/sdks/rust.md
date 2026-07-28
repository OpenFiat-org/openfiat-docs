---
title: Rust
---

# Rust SDK

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
a typed client for a node's [JSON-RPC surface](../api), plus Ed25519
wallet signing and Solana chain bridge support.

## Install

Pre-1.0 and not published to crates.io yet — depend on it as a git
dependency, pinned to a commit:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Quick start

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:8080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Signing and submitting a write

Every `sendX` method takes the domain's own event struct plus a
`Keypair` — the SDK builds the signed payload and submits it; a node
never constructs or signs anything on your behalf:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // or Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Examples

Every example in [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
runs against a real node and is covered by an integration test in
`tests/live_node.rs` (run in CI), so a broken example fails the build the
same way a broken test would:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — construct a client.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — register as an Oracle Provider, publish a rate.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — register as a Notification Provider, report a delivery.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — publish an advertisement, open a reservation against it.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — sign and submit a real Solana transaction through the chain bridge.

Run any of them against a local node:

```bash
# terminal 1 — from openfiat-core
CLI_HTTP_ADDR=127.0.0.1:8080 cargo run -p openfiat-cli

# terminal 2 — from openfiat-sdks/rust
cargo run --example trading_bot
```
