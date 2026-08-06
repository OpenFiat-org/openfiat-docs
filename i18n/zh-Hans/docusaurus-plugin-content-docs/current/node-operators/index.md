---
title: 节点操作者
sidebar_position: 1
---

# 节点操作者

节点操作者是 OpenFiat 网络的骨干——他们运行参考
[`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core) 二进制文件，
并参与 peer 发现、gossip、内容提供和
服务注册。

## 一个节点在完全没有配置时会做什么

`openfiat-node` 完全由命令行标志配置——刻意地没有
环境变量回退，也没有配置文件，从而使
`systemctl cat openfiat-node` 恰好显示一个运行中的节点被给了什么，
而不是把你送去横跨 shell 配置文件和单元文件的一场考古。
`openfiat-node --help` 就是全部接口。

在不设置任何东西的情况下运行它，它已经会：

- 生成或加载它的身份（一个 Solana CLI 格式的 `wallet.json`），并用
  那一个密钥同时作为它的 Solana 签名密钥和它的 libp2p peer id；
- 在 `0.0.0.0:7080` 上提供 JSON-RPC、WebSocket 和 REST；
- 在 `/ip4/0.0.0.0/udp/4001/quic-v1` 上侦听 peer，公布它可被到达的
  地址，并学到从未给过它的 peer——参见
  [Peer 发现](./peer-discovery)；
- 持有协议记录所引用的内容，并在它自己的 libp2p 身份上通过
  bitswap 提供它——参见[内容提供](./content-serving)；
- 将该内容保留一个滚动的 30 天（`--retention`），因此运行一个节点
  是一个有界的存储承诺，而非一个开放式的。

有两件事它*不会*在没被要求时做：与 Solana 通信（`--solana-rpc-url` 会
把它从 `GossipOnly` 移到 `RpcConnected`）以及为他人生产快照
（`--snapshot-public-url`）。二者都是可选的，因为二者都对
网络的其余部分做出只有操作者才能担保的一个断言。

## 什么是可选的，以及它的代价

| 要禁用 | 这样做 | 你放弃什么 |
| --- | --- | --- |
| Solana 连接 | 省略 `--solana-rpc-url` | 节点保持 `GossipOnly`：链上答案经由 gossip 二手传来，可能滞后。它仍然提供市场服务并把交易转发给一个 RPC 连接的 peer，并赚取被降低的连接份额。 |
| 内容提供 | `--no-content-serving` | 节点不存储任何附件内容，也无法答复一次可取回性挑战，因此它赚取被降低的份额。它仍然挑战它的 peer。 |
| 生产快照 | 省略 `--snapshot-public-url` | 无人能从此节点做 bootstrap。*消费*快照不需要配置。 |
| Peer 发现 | 不可能 | 它不是一个标志。一个既不公布任何地址、也不学到任何 peer 的节点，会在每一次本地检查看来都很健康，同时不与任何人通信。 |

## 更进一步

- **完整的操作者演练**——`openfiat-core` 中的
  [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)：
  构建、带其真实默认值的每个标志、公共 devnet 入口点、在节点
  前面放置 TLS 和 nginx，以及链上程序 id。
- **部署**——[openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  提供 Docker 镜像、Kubernetes Helm chart 和 Terraform 模块；
  `openfiat-core` 中的 `packaging/systemd` 和 `packaging/windows` 用于把
  二进制文件直接作为一个服务运行。
- **本地测试网络**——[openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  （`testnet/`、`devnet/`）。
- **声誉与 stake 加权 QoS**——[协议规范](../protocol-specs)中的 OFS-1600。
