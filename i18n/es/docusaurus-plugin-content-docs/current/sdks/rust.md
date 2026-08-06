---
title: Rust
---

# SDK de Rust

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
un cliente tipado para la [superficie JSON-RPC](../api) de un nodo, más firma de
cartera Ed25519 y soporte del puente de cadena de Solana.

## Instalación

Pre-1.0 y aún no publicado en crates.io — dependa de él como una dependencia
git, fijada a un commit:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Inicio rápido

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Firmar y enviar una escritura

Cada método `sendX` toma el propio struct de evento del dominio más un
`Keypair` — el SDK construye la carga firmada y la envía; un nodo
nunca construye ni firma nada en tu nombre:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // o Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Ejemplos

Cada ejemplo en [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
corre contra un nodo real y está cubierto por un test de integración en
`tests/live_node.rs` (ejecutado en CI), así que un ejemplo roto rompe la build
igual que lo haría un test roto:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — construye un cliente.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — regístrate como Proveedor de Oráculo, publica un tipo.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — regístrate como Proveedor de Notificaciones, reporta una entrega.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — publica un anuncio, abre una reserva contra él.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — firma y envía una transacción real de Solana por el puente de cadena.

Ejecuta cualquiera de ellos contra un nodo local:

```bash
# terminal 1 — desde openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — desde openfiat-sdks/rust
cargo run --example trading_bot
```
