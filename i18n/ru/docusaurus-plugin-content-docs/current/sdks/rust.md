---
title: Rust
---

# Rust SDK

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
типизированный клиент для [JSON-RPC-поверхности](../api) узла, плюс подпись
кошелька Ed25519 и поддержка моста цепочки Solana.

## Установка

До 1.0 и пока не опубликован на crates.io — зависите от него как от git-зависимости,
закреплённой на коммите:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Быстрый старт

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Подпись и отправка записи

Каждый метод `sendX` принимает собственную структуру события домена плюс
`Keypair` — SDK строит подписанную нагрузку и отправляет её; узел никогда ничего
не конструирует и не подписывает от вашего имени:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // или Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Примеры

Каждый пример в [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
работает против реального узла и покрыт интеграционным тестом в
`tests/live_node.rs` (запускается в CI), поэтому сломанный пример ломает сборку
так же, как сломанный тест:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — постройте клиента.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — зарегистрируйтесь как поставщик оракула, опубликуйте курс.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — зарегистрируйтесь как поставщик уведомлений, сообщите о доставке.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — опубликуйте объявление, откройте резервирование против него.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — подпишите и отправьте реальную транзакцию Solana через мост цепочки.

Запустите любой из них против локального узла:

```bash
# терминал 1 — из openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# терминал 2 — из openfiat-sdks/rust
cargo run --example trading_bot
```
