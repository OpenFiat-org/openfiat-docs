---
title: Enregistrer un fournisseur de notifications
---

# Enregistrer un fournisseur de notifications

Enregistrez-vous auprès du Registre de services (OFS-1500) d’un nœud comme
fournisseur de notifications, faites qu’un portefeuille s’abonne à une catégorie,
et apprenez la règle qui gouverne les rapports de livraison (OFS-6000).

:::warning Un rapport de livraison n’est pas auto-attesté

Un nœud n’accepte un rapport que s’il détient un enregistrement de dispatch
correspondant **qui lui est propre**. Ce parcours se termine donc en regardant un
rapport bien formé et correctement signé être **refusé** — parce que le nœud n’a
jamais routé la notification qu’il nomme.

C’est la partie intéressante, et la raison pour laquelle la règle existe : la
rémunération et la réputation d’un fournisseur suivent le volume qu’il signale,
donc accepter un id de notification arbitraire permettrait à toute passerelle
enregistrée de fabriquer la preuve d’un travail que personne ne lui a demandé.

Gagner un reçu nécessite un vrai dispatch, qui nécessite un abonnement portant
une destination scellée à votre passerelle. Le scellement n’est encore exposé par
aucun SDK, ce chemin est donc décrit ici plutôt qu’exécuté.

:::

Démarrez d’abord un nœud local :

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Source complète : [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` depuis `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Doit se résoudre. Un nœud refuse d’enregistrer un endpoint dans un domaine
    // réservé (`.invalid`, `.example`, `.test`) : un enregistrement signé se
    // réplique à chaque nœud et est offert aux utilisateurs comme une
    // infrastructure en direct, donc une adresse qui ne peut jamais se résoudre
    // n’est pas un placeholder inoffensif — c’est un service fabriqué que
    // personne ne peut supprimer.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Requis dès que `pricing` est défini — un nœud rejette un prix sans endroit
    // où être payé. Les services gratuits laissent les deux non définis.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Vide ici, mais le champ doit être présent : le nœud vérifie la signature
    // contre une resérialisation de ce struct, donc l’omettre change les octets
    // hachés et la mise à jour revient en INVALID_SIGNATURE au lieu de quoi que
    // ce soit à propos des destinations.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// Un fournisseur enregistré, signant correctement, signalant une livraison pour
// une notification que ce nœud n’a jamais dispatchée. Elle est refusée, et aucun
// reçu n’est écrit.
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

Source complète : [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` depuis `openfiat-sdks/typescript`).

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
  // Doit se résoudre — un domaine réservé est refusé à l’enregistrement.
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
  // Vide, mais présent : la signature est vérifiée contre une resérialisation de
  // ce struct, donc omettre le champ fait différer les octets de ceux signés
  // ici et la mise à jour est rejetée en INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Refusé : ce nœud n’a jamais dispatché `notif-1`, il n’a donc aucun
// enregistrement de dispatch pour vérifier le rapport.
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

## Ce qu’un nœud vérifie, et ce que cela coûte

`apply_delivery_report` exige un `DispatchRecord` que ce nœud a fait lui-même,
puis recoupe le service, le destinataire et le déclencheur du rapport contre lui.
Sans un tel enregistrement, il répond `RESOURCE_NOT_FOUND`.

Cela a un coût réel et délibéré : **un nœud qui n’a jamais routé une notification
donnée écarte un rapport qu’il ne peut vérifier**, même véridique. C’est
récupérable — les nœuds qui l’*ont* routée acceptent et diffusent encore le
rapport, et le dispatch est déterministe, donc en régime permanent c’est chaque
nœud. Accepter une affirmation invérifiable n’est pas récupérable : cela écrit un
énoncé non vérifiable dans l’état répliqué de façon permanente.
