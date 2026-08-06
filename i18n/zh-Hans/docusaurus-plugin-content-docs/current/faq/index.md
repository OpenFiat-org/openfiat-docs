---
title: 常见问题
---

# 常见问题

**OpenFiat 是一条区块链吗？**
不是。OpenFiat 是一个构建在 Solana 之上的点对点协调协议，
由 Solana 处理结算。

**我的节点需要一个单独的 IPFS 守护进程吗？**
不需要。一个节点通过其自己的 libp2p 身份自行提供协议内容，
并且默认开启——`--ipfs-api-url` 和一个 Kubo 守护进程不再是
它的工作方式。参见[内容提供](../node-operators/content-serving)。

**我必须列出我的节点应当与之通信的每个 peer 吗？**
不必。`--entrypoint` 建立第一次连接；此后一个节点会学到
从未给过它的 peer，并公布它可被到达的地址。参见
[peer 发现](../node-operators/peer-discovery)。

**谁运营 OpenFiat？**
AllenHark 正在主导初期开发并资助早期增长，其明确的
长期目标是渐进式去中心化——参见
[前言](../whitepaper)和第 24 章（治理与协议演进）。

**代码采用什么许可证？**
Apache License 2.0，涵盖
[OpenFiat-org](https://github.com/OpenFiat-org) 中的每一个仓库。

**我该在哪里报告安全问题？**
参见相关仓库中的 `SECURITY.md`——不要开一个公开 issue。
