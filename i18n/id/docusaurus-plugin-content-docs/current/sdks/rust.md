---
title: Rust
---

# Rust SDK

`openfiat-sdk` ([`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)) —
klien bertipe untuk [permukaan JSON-RPC](../api) node, plus penandatanganan dompet
Ed25519 dan dukungan jembatan rantai Solana.

## Pemasangan

Pra-1.0 dan belum diterbitkan ke crates.io — bergantunglah padanya sebagai
dependensi git, disematkan ke sebuah commit:

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## Mulai cepat

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## Menandatangani dan menyubmit sebuah tulisan

Tiap metode `sendX` mengambil struct peristiwa domainnya sendiri plus sebuah
`Keypair` — SDK membangun muatan yang ditandatangani dan menyubmitnya; sebuah node
tak pernah menyusun atau menandatangani apa pun atas nama Anda:

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // atau Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## Contoh

Tiap contoh di [`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
berjalan terhadap node nyata dan dicakup oleh tes integrasi di `tests/live_node.rs`
(dijalankan di CI), jadi contoh yang rusak menggagalkan build sama seperti tes yang
rusak:

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs) — bangun sebuah klien.
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs) — daftar sebagai penyedia oracle, terbitkan kurs.
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs) — daftar sebagai penyedia notifikasi, laporkan pengiriman.
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs) — terbitkan iklan, buka pemesanan terhadapnya.
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs) — tandatangani dan submit transaksi Solana nyata lewat jembatan rantai.

Jalankan salah satunya terhadap node lokal:

```bash
# terminal 1 — dari openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# terminal 2 — dari openfiat-sdks/rust
cargo run --example trading_bot
```
