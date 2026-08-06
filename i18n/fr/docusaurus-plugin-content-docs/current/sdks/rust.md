---
title: Rust
---

# SDK Rust

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
un client typé pour la [surface JSON-RPC](../api) d’un nœud, plus la signature de
portefeuille Ed25519 et le support du pont de chaîne Solana.

## Installation

Pré-1.0 et pas encore publié sur crates.io — dépendez-en comme d’une dépendance
git, épinglée à un commit :

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Démarrage rapide

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Signer et soumettre une écriture

Chaque méthode `sendX` prend le propre struct d’événement du domaine plus un
`Keypair` — le SDK construit la charge signée et la soumet ; un nœud ne construit
ni ne signe jamais rien en votre nom :

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // ou Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Exemples

Chaque exemple dans [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
tourne contre un nœud réel et est couvert par un test d’intégration dans
`tests/live_node.rs` (exécuté dans la CI), donc un exemple cassé casse le build
de la même façon qu’un test cassé :

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — construire un client.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — s’enregistrer comme fournisseur d’oracle, publier un taux.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — s’enregistrer comme fournisseur de notifications, signaler une livraison.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — publier une annonce, ouvrir une réservation contre elle.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — signer et soumettre une vraie transaction Solana via le pont de chaîne.

Exécutez l’un d’eux contre un nœud local :

```bash
# terminal 1 — depuis openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — depuis openfiat-sdks/rust
cargo run --example trading_bot
```
