---
title: Rust
---

# Rust SDK

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
एक नोड के [JSON-RPC इंटरफ़ेस](../api) के लिए एक टाइप्ड क्लाइंट, साथ ही Ed25519
वॉलेट हस्ताक्षर और Solana चेन ब्रिज समर्थन।

## स्थापना

Pre-1.0 और अभी crates.io पर प्रकाशित नहीं — इसे एक git निर्भरता के रूप में लें,
एक commit पर पिन:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## त्वरित प्रारंभ

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## एक लेखन पर हस्ताक्षर और सबमिट करना

हर `sendX` मेथड डोमेन के अपने इवेंट struct के साथ एक `Keypair` लेता है — SDK
हस्ताक्षरित payload बनाता और सबमिट करता है; एक नोड कभी आपकी ओर से कुछ भी संरचित या
हस्ताक्षरित नहीं करता:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // या Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## उदाहरण

[`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
का हर उदाहरण एक असली नोड के विरुद्ध चलता है और `tests/live_node.rs` (CI में चलाया
गया) में एक इंटीग्रेशन टेस्ट द्वारा कवर है, इसलिए एक टूटा उदाहरण बिल्ड को उसी
तरह विफल करता है जैसे एक टूटा टेस्ट करता:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — एक क्लाइंट बनाएँ।
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — एक ऑरेकल प्रदाता के रूप में पंजीकृत करें, एक दर प्रकाशित करें।
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — एक सूचना प्रदाता के रूप में पंजीकृत करें, एक डिलीवरी रिपोर्ट करें।
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — एक विज्ञापन प्रकाशित करें, उसके विरुद्ध एक आरक्षण खोलें।
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — चेन ब्रिज के माध्यम से एक असली Solana लेनदेन हस्ताक्षरित और सबमिट करें।

इनमें से किसी को एक स्थानीय नोड के विरुद्ध चलाएँ:

```bash
# टर्मिनल 1 — openfiat-core से
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# टर्मिनल 2 — openfiat-sdks/rust से
cargo run --example trading_bot
```
