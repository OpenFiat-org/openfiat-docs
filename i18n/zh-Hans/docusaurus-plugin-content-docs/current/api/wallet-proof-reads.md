---
title: 钱包证明读取
sidebar_position: 2
---

# 钱包证明读取

一个节点的 [JSON-RPC 接口](./index.md)上几乎每一次读取都是开放的，因为
它所返回的东西已经复制到每个节点。少数几个并非如此，而
区分它们的界线不是「这是否是秘密」——这里没有任何东西是秘密——而是
「把这个答复给一个陌生人，是否会拼装出协议刻意留作
散落的某种东西」。

## 被保护的东西是交易图谱

一个答复*这个钱包与谁交易、多久一次*的端点，会向任何人
交出一张真实交易关系的地图：某个钱包总是回到哪个商家、
一个繁忙商家的常客是谁，因而谁值得被跟踪回家。在一个
点对点的法币市场里，那是一个人身安全问题，而非一种偏好。

那个论点曾提出过一次，并在一个方法
（`getCounterparties`）中被强制执行，而同一图谱仍可通过
`getSettlements`、`getReservations` 和 `getDisputes` 获取——它们都不取
参数，且都返回网络上每一条记录，其中双方都被
指名并带密钥。那道门并不弱；它被绕过了。它同时也是
三个方法而非一个：一个预约指名买方、其广告指名商家，因此
同一条边在更早一步就已可得，包括那些从未结算的
交易。

因此公开读取现已[删节](./trade-privacy.md)，而当事方通过
证明其持有钱包来完整读取自己的记录。

## 握手

本协议中没有账户，因此「这真的是你吗？」只能
通过要求调用方签署某个他不可能事先签好的东西来回答。

### 1. 请求一个 nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

签发是刻意开放的。没有签署它的私钥，一个 nonce 毫无
价值，而要求一个签名去获取你所要签的东西将是
循环的；该响应不确认关于钱包的任何事，甚至不确认它
存在。挑战只存活于内存中，并在五分钟后过期——足够长，
让一个人读到并批准一个钱包提示，足够短，使一个
未花费的 nonce 不至于被遗留在四处。

`getCounterpartiesChallenge` 和 `getProviderEarningsChallenge` 是同一个
签发者的不同名称。一个 nonce 恰好答复一次调用，无论它在哪个
接口上被花费。

### 2. 签署挑战

要签署的字节是 UTF-8 字符串：

```
<domain>:<subject>:<nonce>
```

`subject` 是挑战返回时所带的规范 base64 peer id，而非
你碰巧发送的那种 base64 写法。`domain` 因方法而固定：

| 方法 | 域 |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

域分隔符正是为一个受门控接口收集的签名，之所以不能在
另一个接口上出示的原因，即使两者都以相同方式标识其
主体，并从同一个账本抽取 nonce。

### 3. 调用方法

```json
{
  "method": "getMySettlements",
  "params": {
    "wallet": "<base64 PeerId>",
    "public_key": "<base64 raw 32-byte Ed25519 public key>",
    "nonce": "<the nonce from step 1>",
    "signature": "<base64 64-byte Ed25519 signature>"
  }
}
```

`getMyReservations`、`getMyDisputes` 和 `getCounterparties` 取的正是
相同的四个字段。公钥被显式发送，而非从 `wallet` 恢复，
因此身份声明是调用方陈述、节点核对的东西，而非
节点代其推断的东西——它必须精确地推导到被询问的那个
钱包。

返回的东西未经删节，且仅限钱包为当事方的那些记录。
`getMyDisputes` 也答复一位就座的仲裁员，因为读取整个
案件是他们的工作。

## 若你在实现这个，需要注意的细节

**拒绝，而非收窄。** 一个无法证明钱包的调用方会得到一个
错误，绝不是一个经过过滤的答复。一个带过滤的实现，在
每一个通过的测试中看起来都一模一样，直到某次重构去掉了过滤为止；
拒绝会响亮而立即地失败。

**检查的顺序。** 密钥派生检查先发生，在触碰 nonce 之前，
因此一个陌生人失败的尝试无法花掉其真正拥有者
正在签署到一半的那个 nonce。随后 nonce 会在签名被验证*之前*
被消耗，因此出示一个被截获的签名会烧掉 nonce 而
非重放它。

**「未知」与「已花费」是同一个错误。** 区分它们
会确认某个其他当事方正在为该主体进行握手中途。

**不存储任何新东西。** 未完成的挑战在内存中，答案则
按需从节点已经复制的记录折算得出。一个节点操作者
不会获得关于谁问了什么的任何记录——这很重要，因为操作者
恰恰是这件事绝不能悄悄为其建立档案的那一方。
