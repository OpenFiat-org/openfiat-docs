---
title: Rust
---

# Rust SDK

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
عميل مطبوع لـ[واجهة JSON-RPC](../api) لعقدة، إضافةً إلى توقيع محفظة
Ed25519 ودعم جسر سلسلة Solana.

## التثبيت

قبل 1.0 ولم يُنشر على crates.io بعد — اعتمد عليه كاعتمادية git، مثبَّتة
إلى commit:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## بداية سريعة

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## توقيع كتابة وتقديمها

يأخذ كل طريقة `sendX` بنية حدث المجال الخاصة إضافةً إلى `Keypair` — تبني
الحزمة الحمولة الموقَّعة وتقدّمها؛ لا تُنشئ عقدة أو توقّع شيئًا نيابةً
عنك قط:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // أو Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## أمثلة

كل مثال في [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
يعمل ضد عقدة حقيقية ويغطّيه اختبار تكامل في `tests/live_node.rs` (يُشغَّل
في CI)، فمثال معطوب يُفشل البناء تمامًا كما يُفشله اختبار معطوب:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — أنشئ عميلًا.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — سجّل كمزوّد أوراكل، انشر سعرًا.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — سجّل كمزوّد إشعارات، أبلغ عن تسليم.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — انشر إعلانًا، افتح حجزًا عليه.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — وقّع وقدّم معاملة Solana حقيقية عبر جسر السلسلة.

شغّل أيًا منها ضد عقدة محلية:

```bash
# الطرفية 1 — من openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# الطرفية 2 — من openfiat-sdks/rust
cargo run --example trading_bot
```
