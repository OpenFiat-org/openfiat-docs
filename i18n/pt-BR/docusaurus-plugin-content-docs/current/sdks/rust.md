---
title: Rust
---

# SDK de Rust

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
um cliente tipado para a [superfície JSON-RPC](../api) de um nó, mais assinatura
de carteira Ed25519 e suporte à ponte de cadeia da Solana.

## Instalação

Pré-1.0 e ainda não publicado no crates.io — dependa dele como uma dependência
git, fixada a um commit:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Início rápido

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Assinar e submeter uma escrita

Cada método `sendX` recebe o próprio struct de evento do domínio mais um
`Keypair` — o SDK constrói a carga assinada e a submete; um nó nunca constrói nem
assina nada em seu nome:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // ou Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Exemplos

Cada exemplo em [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
roda contra um nó real e é coberto por um teste de integração em
`tests/live_node.rs` (executado no CI), então um exemplo quebrado quebra o build
do mesmo modo que um teste quebrado:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — construa um cliente.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — registre-se como Provedor de Oráculo, publique uma taxa.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — registre-se como Provedor de Notificações, reporte uma entrega.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — publique um anúncio, abra uma reserva contra ele.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — assine e submeta uma transação real da Solana pela ponte de cadeia.

Execute qualquer um deles contra um nó local:

```bash
# terminal 1 — a partir de openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — a partir de openfiat-sdks/rust
cargo run --example trading_bot
```
