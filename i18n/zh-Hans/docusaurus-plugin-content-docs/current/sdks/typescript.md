---
title: TypeScript
---

# TypeScript SDK

`@openfiat/sdk`（[`openfiat-sdks/typescript`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript)）——
一个面向节点 [JSON-RPC 接口](../api)的类型化客户端，外加 Ed25519
钱包签名（通过 `@noble/ed25519`，与 Rust SDK 的
`ed25519-dalek` 互操作——同一钱包种子在两种语言中产生相同的密钥和
签名）以及 Solana 链桥支持。
按设计对浏览器/边缘安全；仅 Node 的钱包文件 I/O 位于一个
单独的 `@openfiat/sdk/node` 入口点。

## 安装

Pre-1.0，尚未发布到 npm——以 git 依赖的形式引入，
固定到某个 commit：

```bash
pnpm add "github:OpenFiat-org/openfiat-sdks#<commit>&path:typescript"
```

## 快速开始

```typescript
import { Client } from "@openfiat/sdk";

const client = new Client({ endpoint: "http://localhost:7080", timeoutMs: 30_000 });
const version = await client.call("getVersion", {});
```

类型化方法按每个领域一个模块分组——`node`、`chain`、
`oracles`、`providers`、`advertisements`、`reservations`、`notifications`：

```typescript
import { node } from "@openfiat/sdk";

const version = await node.getVersion(client);
```

## 签署并提交一次写入

每个 `sendX` 方法取该领域自己的事件对象加上一个
`Keypair`——SDK 构建已签名的载荷并提交；一个节点
从不代表你构造或签署任何东西：

```typescript
import { generateKeypair, oracles } from "@openfiat/sdk";

const keypair = await generateKeypair(); // 或来自 "@openfiat/sdk/node" 的 keypairFromSeed(...) / loadWalletFile(...)
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);
```

## 示例

[`typescript/examples`](https://github.com/OpenFiat-org/openfiat-sdks/tree/main/typescript/examples)
中的每个示例都针对一个真实节点运行，并由
`tests/live_node.test.ts` 中的一个测试覆盖，在 CI 中针对一个真实的
`openfiat-node` 进程运行（参见 `.github/workflows/ci.yml` 的
`typescript-sdk-live-node` 任务）——一个损坏的示例会像一个损坏的
测试一样让构建失败：

- [`basic.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/basic.ts)——构造一个客户端。
- [`oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts)——注册为预言机提供者，发布一个汇率。
- [`notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)——注册为通知提供者，报告一次投递。
- [`trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)——发布一个广告，对它开一个预约。
- [`solana_transaction.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/solana_transaction.ts)——通过链桥签署并提交一笔真实的 Solana 交易。

针对一个本地节点运行其中任意一个：

```bash
# 终端 1 —— 在 openfiat-core 中
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080

# 终端 2 —— 在 openfiat-sdks/typescript 中
pnpm tsx examples/trading_bot.ts
```
