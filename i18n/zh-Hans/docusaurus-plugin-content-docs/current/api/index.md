---
title: API
sidebar_position: 1
---

# API

每个 OpenFiat 节点都暴露一个直接以 Solana 自身 JSON-RPC API 为蓝本的
JSON-RPC 2.0 端点——在单个 POST 端点上使用 `getX`/`sendX` 这样的
camelCase 方法名，而非 REST 资源层级。它由
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core) 中的
`rpc` 和 `api` crate 实现。

## 端点

```
POST /rpc
Content-Type: application/json
```

每个请求都是一个标准的 JSON-RPC 2.0 信封：

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

而每个响应要么是 `result`，要么是 `error`，绝不同时出现：

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

公共 devnet 节点位于 `https://openfiat.allenhark.com`——同一主机
还为*节点*发布一个入口点 multiaddr，那是用于不同工作的不同
地址（参见
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)）。
你自己运行的任何节点都在 `:7080` 上提供相同的接口。

## 密钥、peer id 和签名都是 base58

每个公钥、peer 标识符、签名和事件标识符都是一个
base58 字符串：

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

直到不久前它们还是整数数组。如果你看到
`"provider_public_key": [192, 74, 15, ...]`，说明你正在与一个
早于此变更的节点通信——而该响应中没有任何东西能把已发布的
公钥与泄露的私钥区分开，因为一个 Ed25519 私钥
同样是三十二字节。正是这种含混才促成了变更。base58
形式也是唯一可用的：`12D3KooW…` 才是 `--entrypoint` 所接受、
也是能在日志中被搜索到的东西。

**这不仅是显示上的变更。** 一个 `sendX` 载荷是针对其内部结构体的
JSON 进行签名的，因此一个把密钥以数组形式写入载荷的客户端，
会产生一份节点无法复现的记录。签名于是
验证失败——这表现为一次被拒绝的变更，而
不是解析错误。使用[SDK](../sdks)就会替你处理好这些；若要
手写线格式，请将标识符编码为 base58。

**不是**标识符的字节字段仍保持为数组。一个争议投票的
`commitment` 及其揭示的 `secret` 是不透明的三十二字节值，
而非身份，会作为数组发送。区分依据是字段*是什么*，
而非其长度。

## 方法命名

读取方法以 `get` 开头，绝不改变状态：

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

`getMyX` 方法仍然是一次读取，但它只对调用方证明其持有的
钱包作答——参见[钱包证明读取](./wallet-proof-reads.md)。

变更方法以 `send` 开头，并取一个字段——`data`，一份 base64 编码、
**已签名**的线格式载荷，由调用方自己的钱包在本地产生。
这与 Solana 的 `sendTransaction` 相仿：节点从不代表调用方
构造或签署任何东西，它只解码载荷，并通过一个 gossip 收到的
事件所经过的同一签名验证路径来应用它。

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

每个[SDK](../sdks)的类型化 `Client` 都会替你构建并签署该载荷——
它是推荐的集成点，而非手工构造线格式。

## 方法类别

| 领域 | 示例方法 |
| --- | --- |
| 广告 | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| 预约 | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| 结算 | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| 交易（只读联接） | `getTrade`, `getTrades` |
| 争议 | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| 钱包证明 | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| 交易量 | `getSettledVolume` |
| 附件与内容 | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| 身份 | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| 声誉（只读） | `getReputation` |
| 治理 | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| 服务提供者 | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| 通知 | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| 预言机 | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| 风险情报 | `getWalletScreening`, `sendRiskPublish` |
| 奖励 | `getRewardObservations` |
| 快照 | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| 会话 | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| 链桥（Solana，OFS-4300） | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| 节点 | `getVersion`, `getHealth`, `getPeers` |

## 不指明当事方的读取

`getSettlement(s)`、`getReservation(s)` 和 `getDispute(s)` 返回的记录
已移除当事方身份。这是一个出于安全考量的刻意变更，
而非疏漏，它有自己独立的一页：
[公开读取返回什么](./trade-privacy.md)。当事方通过
[钱包证明读取](./wallet-proof-reads.md)完整读取自己的记录。

## 争议在链上裁决，而非由答复你的节点裁决

一个 `getDispute` 响应携带某节点已收集的揭示，且**不**
携带由它们推导出的结果。裁决只在此节点已观察到执行交易
确认并读取其裁决内容之后才出现——参见
[争议如何解决](./dispute-resolution.md)。一个自行清点
揭示的客户端，已经重新引入了节点已停止产生的那种
分歧。

## 两个汇率方法，以及该用哪一个

`getMedianExchangeRate` 返回一个裸数字或 `null`，当你所要的
只是一个价格或什么都没有时，这是恰当的形态。

`getExchangeRate` 取相同的 `{ base, quote }`，但以带标签的
状态作答，因为 `null` 会把两个不同的事实混为一谈：

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

这个区分并非学究之见。**Stale** 意味着确有提供者发布此
交易对，且每条记录都已过期（OFS-7000 §12：过期数据不是当前
数据，无论其失效有多近）——数据源很可能会恢复，因此等待
是明智的。**NoData** 意味着根本没人为这条通道定价，等待
毫无意义。二者都不是数字，调用方也不得将任何一个显示为数字。

除非你有理由不这么做，否则请使用 `getExchangeRate`。`getMedianExchangeRate`
之所以保留，是因为客户端依赖它。

## Service id

一个节点以 `node-<其 base58 公钥>` 注册，而一个快照
提供者以 `snapshot-<同一密钥>` 注册——前缀正是让一个
节点持有多条注册记录而不致相撞的原因。

该 id 是推导出来的而非随机的，从而使一个重启的节点更新
其现有记录，而不是留下一条死条目。从*整个*密钥
推导它很重要：早先的一种方案把 peer id 的前八个
字节当作十六进制，看起来像十六位身份数字，
其实只有两位，因为每个 Ed25519 peer id 都以相同的六字节前缀开头。
两个节点在数百次注册之内就相撞了，而
后注册者取代了先注册者。

## 一个节点对网络知道什么

`getPeers` 报告此节点已发现的 peer、它关于自身所
公布的地址，以及它自己那个 `12D3Koo…` 形式、用于
`--entrypoint` 的 `self_peer_id`。参见
[peer 发现](../node-operators/peer-discovery.md)了解操作者视角。

## 错误

标准的 JSON-RPC 2.0 错误码（`-32700` 解析错误、`-32601` 方法未
找到、`-32602` 参数无效、`-32603` 内部错误）覆盖了传输
层面的失败。每一个领域层面的失败——流动性不足、重复
事件、未授权的签名方——都作为单一的 `-32000` 应用
错误返回，并在 `data` 中附带协议自身的数字码和符号名（来自
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)）：

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## 订阅

```
GET /ws
```

在每一次成功变更发生时将其流式推送——`{"method": "sendX", "result": ...}`——从而使客户端无需轮询即可对市场活动作出反应。在客户端按你关心的方法进行过滤。

## 快照按 slot 标记，而非按高度

`getCheckpointSlot` 返回上一次导入的快照状态所对应为当前的
Solana slot，或在尚未导入任何快照的节点上返回 `null`。

它曾是 `getCheckpointHeight`，而这次改名并非表面文章。旧值
是*生产该快照的节点自己对 gossip 事件的计数*，这是
逐生产者而异的：两个持有相同状态的节点报告不同的数字，
一个上周才加入的节点报告的数字，低于一个自创世起就
运行的节点。比较两个生产者的数字什么也没比较。

一个 slot 是每个参与者早已共享的那一个时钟。它还使一个
断言变得**可核验**——一个节点可以把公布的 slot 与它自己
对链的视图相比较，并拒绝一个来自不合情理之未来的 slot，而
这对一个只有公布者才能看到的数字是不可能的。

**一个 slot 所断言的东西比看起来要狭窄。** 它说明状态是*何时*
被捕获的，而非它*包含什么*：两个在同一 slot 做快照的
节点，可能持有略有不同的 gossip 状态，因为传播并非
即时。把它当作一个近因锚点，而非一个快照
包含另一个的证明——这与 Solana 自身快照对它的含义相同。

一个从未观察到 slot 的节点不产生快照，并会如此声明。
这并不要求运行一个 RPC 连接：一个仅 gossip 的节点
通过链桥学习 slot。

## 已结算交易量，以及为何按资产统计

`getSettledVolume` 以每个资产一行作答，绝不给出总计：

```json
{
  "assets": [
    { "asset_mint": "2bHPi…RRU", "asset_symbol": "USDC", "decimals": 6,
      "base_units": 4500000, "settlements": 12 },
    { "asset_mint": "So111…112", "asset_symbol": "wSOL", "decimals": 9,
      "base_units": 2000000000, "settlements": 3 }
  ],
  "unattributed_settlements": 1,
  "settlements_known": 16,
  "scope": "settlements this node has replicated and observed confirmed"
}
```

对此，客户端有四件事绝不能做：

**不要跨资产求和。** 它们是不同尺度的不同代币；
一个合并的数字把 SOL 加到 USDC 上，毫无意义。

**不要猜测 `decimals`。** 当此节点对某个 mint 没有名称时，
它连同一个 `null` 的 `asset_symbol` 一起为 `null`。请显示地址
和原始的 base units。假定为 `6` 正是 wSOL——它有九位——
会算大一千倍的原因。

**不要隐藏 `unattributed_settlements`。** 那些是真实的、已确认的
结算，其广告此后已被删除，因此其资产
无法恢复。省略它们会让总计看起来完整，而实际上
恰恰少了那么多。

**不要丢弃 `scope`。** 它说明这些是*此节点*
复制并确认的结算——而非整个网络的历史。一个不带其
范围呈现的交易量数字，会被读作全局总计。`settlements_known`
与已计数的行并列，会让余数被读作在途交易，而
非一处不一致。

## 交互式参考

**[浏览每个方法 →](pathname:///api/reference.html)**

一份 [OpenRPC](https://open-rpc.org) 1.2.6 文档（JSON-RPC 相当于
OpenAPI/Swagger 规范的等价物）——[`/api/openrpc.json`](pathname:///api/openrpc.json)——
外加一个自包含的交互式页面，用于浏览每个方法。方法*列表*
直接由 `openfiat-rpc` 自身的活动分派表生成
（`cargo run -p openfiat-api --example dump_openrpc`），因此它不可能漂移到
一个真实节点并不运行的方法上；由于本文档站点没有自己的
节点来实时提供它，它在此以静态快照发布。把参考页面的
「Try it」面板指向你自己运行的一个节点（默认为
`http://localhost:7080`），即可真正调用一个方法。

该文档中的逐方法**模式**是一种刻意简化、基于约定的
近似——每个 `getX(id)` 取 `{id}`，每个 `sendX`
取 `{data}`——而非从每个方法具体的 Rust 类型派生出的
JSON Schema。当某个方法偏离这些约定时，本站点才是
权威形态：[钱包证明读取](./wallet-proof-reads.md)、
`getExchangeRate` 和 `getPeers` 都取约定未
描述的参数。

一个运行中的节点也会以与其自身 `/rpc` 同源、实时的方式
提供相同的参考：`GET /openrpc.json` 和 `GET /docs`。`GET /metrics`
为操作者暴露 Prometheus 格式的请求计数器。
