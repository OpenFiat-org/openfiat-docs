---
title: Register a notification provider
---

# Register a notification provider

Register with a node's Service Registry (OFS-1500) as a Notification
Provider, have a wallet subscribe to a category, and learn the rule that
governs delivery reports (OFS-6000).

:::warning A delivery report is not self-attested

A node accepts a report only if it holds a matching dispatch record **of
its own**. So this walkthrough ends by watching a well-formed, correctly
signed report be **refused** — because the node never routed the
notification it names.

That is the interesting part, and the reason the rule exists: a provider's
compensation and reputation follow the volume it reports, so accepting an
arbitrary notification id would let any registered gateway manufacture
evidence of work nobody asked it to do.

Earning a receipt needs a real dispatch, which needs a subscription
carrying a destination sealed to your gateway. Sealing is not exposed by
either SDK yet, so that path is described here rather than performed.

:::

Start a local node first:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Full source: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` from `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Must resolve. A node refuses to register an endpoint in a reserved
    // domain (`.invalid`, `.example`, `.test`): a signed registration
    // replicates to every node and is offered to users as live
    // infrastructure, so an address that can never resolve is not a
    // harmless placeholder — it is a fabricated service nobody can delete.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Required whenever `pricing` is set — a node rejects a price with
    // nowhere to be paid. Free services leave both unset.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Empty here, but the field must be present: the node verifies the
    // signature against a re-serialization of this struct, so omitting it
    // changes the bytes being hashed and the update comes back as
    // INVALID_SIGNATURE rather than as anything about destinations.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// A registered provider, signing correctly, reporting a delivery for a
// notification this node never dispatched. It is refused, and no receipt
// is written.
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

Full source: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` from `openfiat-sdks/typescript`).

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
  // Must resolve — a reserved domain is refused at registration.
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
  // Empty, but present: the signature is verified against a
  // re-serialization of this struct, so omitting the field makes the bytes
  // differ from the ones signed here and the update is rejected as
  // INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Refused: this node never dispatched `notif-1`, so it has no dispatch
// record to check the report against.
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

## What a node checks, and what it costs

`apply_delivery_report` requires a `DispatchRecord` this node made itself,
then cross-checks the report's service, recipient and trigger against it.
Without one it answers `RESOURCE_NOT_FOUND`.

That has a real and deliberate cost: **a node that never routed a given
notification drops a report it cannot check**, even a truthful one. That is
recoverable — the nodes that *did* route it still accept and gossip the
report, and dispatch is deterministic, so in steady state that is every
node. Accepting an uncheckable claim is not recoverable: it writes an
unverifiable statement into replicated state permanently.
