---
title: 架构
---

# 架构

OpenFiat 不是一条区块链——它是一个构建在 Solana 之上的
去中心化点对点协议。Solana 通过经过审计的智能合约提供安全、
透明的链上结算；OpenFiat 提供负责广告、交易
发现、加密通信、声誉、治理和
通知的点对点协调网络。

## 各层

- **网络层**——peer 发现、gossip、快照/会话同步、服务注册（参见 `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`）。
- **内容层**——协议记录所指向的文件，按 CID 寻址，并在节点之间通过 bitswap 提供（`crates/content`）。
- **交易层**——广告、预约、结算、争议。
- **信任层**——身份声明、声誉、风险情报。
- **协调层**——治理、通知、预言机。

上述每一层都运行在单个进程之内，且在传输层面上运行在单个
libp2p 身份之上——没有第二个守护进程，也没有第二个 peer id。发现与
gossip 在一条连接上多路复用，并按其信封所携带的 OFS 规范
编号被分开路由；内容提供在同一 swarm 上讲标准的
`/ipfs/bitswap/1.2.0`，这正是让任何 IPFS peer
都能直接从一个节点获取协议内容的原因。

有关当前的 crate 级拆分，请参见
[参考实现](https://github.com/OpenFiat-org/openfiat-core)，
以及那里的
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
了解 crate 依赖图、线格式和传输。
