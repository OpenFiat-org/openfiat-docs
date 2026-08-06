---
title: 注册一个通知提供者
---

# 注册一个通知提供者

在一个节点的服务注册（OFS-1500）中注册为通知
提供者，让一个钱包订阅某个类别，并了解支配投递
报告的规则（OFS-6000）。

:::warning 投递报告不是自证的

一个节点只在它持有一条**自己的**匹配分派记录时才接受一份报告。
因此本演练以观看一份格式良好、正确
签名的报告被**拒绝**收尾——因为该节点从未路由它
所指名的那条通知。

那是有趣的部分，也是此规则存在的原因：一个提供者的
补偿和声誉跟随它所报告的交易量，因此接受
一个任意的通知 id，会让任何注册的网关都能捏造
无人要求其做的工作的证据。

赚得一份回执需要一次真实的分派，而这需要一份携带
封给你网关之目的地的订阅。任一 SDK 尚未暴露
封装功能，因此该路径在此加以描述而非执行。

:::

请先启动一个本地节点：

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

完整源代码：[`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
（在 `openfiat-sdks/rust` 中运行 `cargo run --example notification_provider`）。

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // 必须能解析。节点会拒绝在保留域（`.invalid`、`.example`、
    // `.test`）中注册一个端点：一份已签名的注册会复制到每个
    // 节点，并作为实时基础设施提供给用户，因此一个永远无法解析的
    // 地址不是一个无害的占位——它是一个无人能删除的捏造服务。
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // 只要设置了 `pricing` 就必需——节点会拒绝一个无处可付的
    // 价格。免费服务将二者都留空。
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // 这里为空，但该字段必须存在：节点会针对此结构体的
    // 重新序列化来验证签名，因此省略它会改变被哈希的字节，
    // 更新会作为 INVALID_SIGNATURE 而非任何关于目的地的东西返回。
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// 一个注册的提供者，正确签名，为此节点从未分派过的一条
// 通知报告一次投递。它被拒绝，且不写入任何回执。
let report = DeliveryReport {
    notification_id: NotificationId::new("notif-1"),
    service_id,
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    recipient_wallet: peer_id(&wallet),
    trigger: NotificationTrigger::TradeCompleted,
    status: DeliveryStatus::Delivered,
    timestamp: Timestamp::now(),
};
match client.send_delivery_report(report, &provider).await {
    Err(refusal) => println!("refused, as it should be: {refusal}"),
    Ok(_) => panic!("a node accepted a report for a notification it never sent"),
}

let receipts = client.get_delivery_receipts_by_wallet(&peer_id(&wallet)).await?;
println!("{} receipt(s)", receipts.len()); // 0
```

## TypeScript

完整源代码：[`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
（在 `openfiat-sdks/typescript` 中运行 `pnpm tsx examples/notification_provider.ts`）。

```typescript
const provider = await generateKeypair();
const wallet = await generateKeypair();
const providerId = peerIdFromPublicKey(provider.publicKey);
const walletId = peerIdFromPublicKey(wallet.publicKey);
const serviceId = "my-notification-provider";

const registration: Registration = {
  service_id: serviceId,
  service_type: { Notifications: "Webhook" },
  provider: toBytes(providerId),
  provider_public_key: toBytes(provider.publicKey),
  // 必须能解析——保留域在注册时被拒绝。
  endpoints: ["https://notify.example.com/webhook"],
  supported_ofs: [1500, 6000],
  region: null,
  capabilities: ["Webhook"],
  pricing: null,
  payout_wallet: null,
  timestamp: Date.now(),
};
await providers.sendProviderRegister(client, registration, provider);

const update: SubscriptionUpdate = {
  wallet: toBytes(walletId),
  wallet_public_key: toBytes(wallet.publicKey),
  enabled_categories: ["Trading"],
  // 为空，但存在：签名会针对此结构体的重新序列化来验证，
  // 因此省略该字段会使字节与这里所签的不同，更新会作为
  // INVALID_SIGNATURE 被拒绝。
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// 被拒绝：此节点从未分派过 `notif-1`，因此它没有可用于核对该
// 报告的分派记录。
const report: DeliveryReport = {
  notification_id: "notif-1",
  service_id: serviceId,
  provider: toBytes(providerId),
  provider_public_key: toBytes(provider.publicKey),
  recipient_wallet: toBytes(walletId),
  trigger: "TradeCompleted",
  status: "Delivered",
  timestamp: Date.now(),
};
await expect(
  notifications.sendDeliveryReport(client, report, provider),
).rejects.toThrow(/RESOURCE_NOT_FOUND/);

const receipts = await notifications.getDeliveryReceiptsByWallet(client, walletId);
console.log(`${receipts.length} receipt(s)`); // 0
```

## 一个节点检查什么，以及代价是什么

`apply_delivery_report` 要求一条此节点自己生成的 `DispatchRecord`，
然后针对它交叉核对报告的服务、接收者和触发。
没有这样一条记录，它就答复 `RESOURCE_NOT_FOUND`。

这有一个真实且刻意的代价：**一个从未路由过某条给定通知的
节点会丢弃一份它无法核对的报告**，即使是真实的一份。那是
可恢复的——*确实*路由过它的那些节点仍会接受并 gossip 该
报告，而分派是确定性的，因此在稳态下那就是每个
节点。接受一个不可核对的主张则不可恢复：它会把一条
无法验证的陈述永久写入复制状态。
