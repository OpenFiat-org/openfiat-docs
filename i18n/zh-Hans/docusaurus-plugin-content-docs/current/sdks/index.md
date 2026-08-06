---
title: SDK
---

# SDK

官方 SDK 维护在单一 monorepo
[openfiat-sdks](https://github.com/OpenFiat-org/openfiat-sdks) 中。两者都是
真实的，在 CI 中针对一个实时的 [`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core)
节点做过测试（不只是类型检查），并覆盖完整的 [RPC 接口](../api)：
广告、预约、结算、交易、争议、身份、
治理、服务提供者、通知、预言机、风险、快照、
会话，以及 [Solana 链桥](https://github.com/OpenFiat-org/openfiat-specs/blob/main/Whitepaper/Specifications/OFS-4300%20-%20OpenFiat%20Chain%20Bridge%20Protocol%20(OCBP).md)。

- **[Rust →](rust)**——monorepo 的 `rust/` 目录中的 `openfiat-sdk`。
- **[TypeScript →](typescript)**——`typescript/` 中的 `@openfiat/sdk`。

每个 SDK 共享相同的形态：一个用于与节点 JSON-RPC 接口通信的
`Client`/`ClientConfig`，每个领域一组类型化的 `getX`/`sendX` 方法（每个
领域一个模块——参见任一 SDK 自己的模块布局），以及一个从不离开
你自己进程的签名原语——一个节点永远只接收
一份已签名的载荷，与 Solana 的 `sendTransaction` 完全一致。

## 尚未就绪

Python、Go、Swift、Kotlin 和 C# 在 monorepo 中有脚手架
（`python/`、`go/`、`swift/`、`kotlin/`、`csharp/`），但尚无真正的
实现——在 monorepo 的 `ROADMAP.md` 中追踪。今天请使用 Rust 或
TypeScript；欢迎扩展其他语言之一的贡献。
