---
title: Peer 发现
sidebar_position: 3
---

# Peer 发现

一个节点通过拨号一个入口点加入，并自行找到网络的
其余部分。Peer 发现（OFS-1100）在 gossip 已经使用的同一
连接上交换已知的 peer，因此一个节点会学到从未给过它的 peer，并
公布它可被到达的地址。

值得直白说明这一点，因为它并非一直如此，而那次失败
是不可见的：发现服务已被完整实现，并在它自己的测试中让五个
节点收敛，却没有任何运行中的节点构造过它。节点们
既不公布任何地址，也不学到任何未被静态给予的 peer，
同时从每一次本地检查看来都完全健康。一个节点有一个 libp2p
swarm，只有一件东西能驱动那个 swarm 的事件循环，而 gossip 拥有它——
因此那个不拥有 swarm 的服务什么都收不到，永远。二者现在
共享一条连接，而消息按信封自己的 OFS 规范编号被路由到其一或另一个。

发现不是一个标志，也无法被关掉。

## 第一次连接

没有东西能从无中找到一个网络，因此 `--entrypoint` 仍是一个节点
启动的方式：

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

为若干个重复它。一个主机名可用且是首选——节点在启动时
通过操作系统自己的解析器解析它，因此集群
在入口点的 IP 变化时仍能存活。**保留 `/p2p/<peer id>` 后缀**：
DNS 未经认证，而 peer id 正是让一条被劫持的记录未能通过
握手、而非悄悄成为你唯一 peer 的东西。

一个将无法解析的入口点会在启动时停止节点，而非被
跳过。一个悄悄丢弃了一个入口点的节点，会在根本没有 peer 的情况下
启动，并在不与任何人通信时看起来完美健康——而这正是
本节开头的那种失败。

在完全没有入口点的情况下启动，节点会如此声明，在 `WARN` 级别。那对
一个新集群中的第一个节点是正确的，对其他所有人则是错误的。

## 你的节点关于自身公布什么

节点知道自己正在侦听的每一个地址，减去 bind 通配符。
`0.0.0.0` 和 `::` 是意为「每一个本地接口」的侦听指令，
而非目的地——而由于 `--gossip-bind-address` 默认恰好是那个，
不加过滤地公布它，正是让 peer 无处可拨的那个 bug。

Loopback 和私有范围被刻意*不*过滤。一台主机上的进程
通过 loopback 互相到达，一个 docker-compose 集群或一个 LAN 只
通过私有地址到达其 peer，而一个单主机集群是一个真实的
部署，而非一个测试产物。

### 在 NAT 之后、在一个容器中，或在一个带映射 IP 的云主机上

你的节点所 bind 的地址不是 peer 能到达它的地址，
而节点无法推算出公共的那个。那不是一个疏漏——按
构造，只有 NAT 另一侧的某物才能观察到公共
地址。因此操作者声明它：

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

可重复。被声明的地址在被 bind 的地址**之前**公布，因此一个
按顺序尝试它们的 peer，会在第一次尝试就连上，而非在
`172.17.0.2` 上超时。被 bind 的地址仍然也会被公布——丢弃它们会在
修复远程情形的同时破坏本地情形。

如果你的节点确实在一个公共接口上，就省略该标志。它 bind 的
地址已经是它的公共地址。

## 问一个节点它知道什么

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getPeers","params":{}}' | jq
```

```json
{
  "self_peer_id": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "announced_addresses": ["/ip4/203.0.113.7/udp/4001/quic-v1"],
  "peers": [
    {
      "peer_id": "12D3KooW...",
      "addresses": ["/ip4/198.51.100.4/udp/4001/quic-v1"],
      "node_version": "openfiat/0.1.0",
      "supported_ofs": [1000, 1100, 1200, 1300, 1400, 1500, 2000, 2100, 2200, 2300, 2400, 3000, 4000, 4300, 6000, 7000, 8200],
      "roles": ["MerchantGateway", "OracleProvider", "NotificationGateway", "RiskIntelligenceProvider"],
      "last_seen": 1753800000000,
      "latency_ms": 42,
      "successes": 17,
      "failures": 0
    }
  ]
}
```

关于那个响应有三件事值得知道。

`self_peer_id` 是那个 `12D3Koo…` 形式，会进入你向其他操作者
发布的入口点。一个无法陈述自己 peer id 的节点无法被加入，
而从一行日志里拼凑它，正是它被打错的方式。

`announced_addresses` 是你正告诉 peer 去拨号之物，按它们
将尝试的顺序。「我的节点什么都不公布」在其为真时从外部
一直不可见，而一个正在检查其 `--external-addr` 是否
生效的操作者，别无他处可看。

`successes` 和 `failures` 是**此节点自己的**与那个 peer 交换的
计数。刻意没有正常运行时间百分比，也没有健康评分：
把两个计数折成一个数字，会把单个节点的本地
体验呈现为一个全网范围的裁决，而两个诚实的节点可能
对二者都有分歧。
