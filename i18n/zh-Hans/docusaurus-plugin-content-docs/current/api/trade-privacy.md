---
title: 公开读取返回什么
sidebar_position: 3
---

# 公开读取返回什么

`getSettlement`、`getSettlements`、`getReservation`、`getReservations`、
`getDispute` 和 `getDisputes` 是开放的、无需认证的读取，它们
不再返回当事方身份。当事方通过[钱包证明方法](./wallet-proof-reads.md)
完整读取自己的记录。

## 为何是删节而非认证

一个展示结算量、状态和时间的浏览器，是对一个公开
网络的合法公开视图。在其前面加一道签名会
破坏这一点，同时把任何执意者推回到原始 gossip，而那毫无
成果。浏览器从不需要的是*谁*——因此公开读取保留了
除身份之外的一切。

身份所拼装出来的东西是交易图谱，反对把它
交出去的理由在[钱包证明读取](./wallet-proof-reads.md)
一页中被完整阐述：在一个点对点的法币市场里，知道某个钱包
总是回到哪个商家、以及一个繁忙商家的常客是谁，是一个
人身安全问题，而非一种偏好。曾经一次无需认证的调用
就能重建它。

## 这诚实地值多少

这些记录会 gossip 到每个节点。任何运行一个节点的人都能读到
全部，删节并不改变这一点。受保护的是查询的*容易程度*——
`curl` 别人的公共访问节点，与架起一个节点去索引网络，
两者之间的差别。那种差别正是随手采集所依赖的大部分。

把这一点直白说清，比看起来更重要：一个相信这些
记录是保密的集成方，会构建出依赖于协议并未做出的
某个保证的东西。

## 各种形态

### Settlement

| 保留 | 移除 |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` 得以保留，因为它指名一笔任何人在
Solana 上已经能读到的链上交易，而它正是使一次结算
可被独立核验的东西。

`payment_reference` 可以说是两处移除中较糟的一个：它是买方在其中
填入自己银行参考号的自由文本，因此常常携带一个真实姓名
或账号。

### Reservation

| 保留 | 移除 |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` 是刻意保留的。一个广告是一个公开报价，
且已在每一行订单簿上携带其商家的 peer id，因此它
披露了一条从未私密的边的一端。它不披露的
是另一端——而那正是使它成为一条边的东西。

### Dispute

| 保留 | 移除 |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`、`seller`、`opener` 及其密钥 |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`、`reveals`（计数） | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | 各个单独的承诺和揭示 |
| `opened_at`, `updated_at` | 相互和解协议标志 |

请注意，这里的 `commitments` 和 `reveals` 是**计数**，而非列表——足以
让浏览器显示一个案件在推进，而不把任何人的投票与其
姓名挂钩。

被丢弃之物有三个不同的理由。当事方，因为争议是
知道谁与谁反目最显然值得被滥用的那种情形。`reason`，因为它是
关于围绕真实金钱的真实分歧的自由文本，并且理所当然地
指名人、银行和参考号。仲裁员列表，因为一位仲裁员是一位
注册的提供者，其身份本身并非秘密——但*哪位仲裁员抽到哪个
案件、以及他们如何投票*，恰恰是使施压其中一位变得
值得的那种配对。相互和解标志随之一起去除：「卖方已同意而
买方尚未」是一个谈判立场，把它公之于旁观者，会改变
两个人之间的一场谈判。

## 如果你要添加一个字段

一个字段只在它讲述关于*交易*而非关于*人*的某事时，
才属于公开视图。存疑时它就该留在外面：日后添加一个
是一条发布说明，而移除一个则是一次已经发生的披露。
