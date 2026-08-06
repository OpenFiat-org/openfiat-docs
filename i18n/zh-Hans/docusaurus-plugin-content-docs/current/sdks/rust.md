---
title: Rust
---

# Rust SDK

`openfiat-sdk`（[`openfiat-sdks/rust`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust)）——
一个面向节点 [JSON-RPC 接口](../api)的类型化客户端，外加 Ed25519
钱包签名和 Solana 链桥支持。

## 安装

Pre-1.0，尚未发布到 crates.io——以 git 依赖的形式引入，
固定到某个 commit：

```toml
[dependencies]
openfiat-sdk = { git = "https://github.com/OpenFiat-org/openfiat-sdks", rev = "<commit>" }
```

## 快速开始

```rust
use openfiat_sdk::{Client, ClientConfig};

let client = Client::new(ClientConfig {
    endpoint: "http://localhost:7080".to_string(),
    ..ClientConfig::default()
});

let version = client.get_version().await?;
```

## 签署并提交一次写入

每个 `sendX` 方法取该领域自己的事件结构体加上一个
`Keypair`——SDK 构建已签名的载荷并提交；一个节点
从不代表你构造或签署任何东西：

```rust
use openfiat_sdk::wallet::Keypair;
use openfiat_oracles::events::OraclePublish;

let keypair = Keypair::generate(); // 或 Keypair::from_seed(...) / solana_keyfile::load(...)
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;
```

## 示例

[`rust/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/rust/examples)
中的每个示例都针对一个真实节点运行，并由 `tests/live_node.rs`
中的一个集成测试覆盖（在 CI 中运行），因此一个损坏的示例会像一个
损坏的测试一样让构建失败：

- [`basic_client.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/basic_client.rs)——构造一个客户端。
- [`oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs)——注册为预言机提供者，发布一个汇率。
- [`notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)——注册为通知提供者，报告一次投递。
- [`trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)——发布一个广告，对它开一个预约。
- [`solana_transaction.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/solana_transaction.rs)——通过链桥签署并提交一笔真实的 Solana 交易。

针对一个本地节点运行其中任意一个：

```bash
# 终端 1 —— 在 openfiat-core 中
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# 终端 2 —— 在 openfiat-sdks/rust 中
cargo run --example trading_bot
```
