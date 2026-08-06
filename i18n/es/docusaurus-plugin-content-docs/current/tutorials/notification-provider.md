---
title: Registra un proveedor de notificaciones
---

# Registra un proveedor de notificaciones

Regístrate en el Registro de Servicios (OFS-1500) de un nodo como Proveedor de
Notificaciones, haz que una cartera se suscriba a una categoría, y aprende la regla que
gobierna los reportes de entrega (OFS-6000).

:::warning Un reporte de entrega no es autoafirmado

Un nodo acepta un reporte solo si tiene un registro de despacho coincidente **propio**.
Así que este recorrido termina viendo cómo un reporte bien formado y correctamente
firmado es **rechazado** — porque el nodo nunca enrutó la
notificación que nombra.

Esa es la parte interesante, y la razón por la que existe la regla: la compensación
y la reputación de un proveedor siguen el volumen que reporta, así que aceptar
un id de notificación arbitrario permitiría a cualquier gateway registrado fabricar
evidencia de un trabajo que nadie le pidió.

Ganar un recibo necesita un despacho real, que necesita una suscripción
que lleve un destino sellado a tu gateway. El sellado aún no lo expone
ninguno de los SDK, así que esa ruta se describe aquí en lugar de realizarse.

:::

Arranca primero un nodo local:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Fuente completa: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` desde `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Debe resolverse. Un nodo se niega a registrar un endpoint en un dominio
    // reservado (`.invalid`, `.example`, `.test`): un registro firmado
    // se replica a cada nodo y se ofrece a los usuarios como infraestructura
    // en vivo, así que una dirección que nunca puede resolverse no es un
    // marcador de posición inofensivo — es un servicio fabricado que nadie puede borrar.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Requerido siempre que se fije `pricing` — un nodo rechaza un precio sin
    // lugar donde pagarse. Los servicios gratuitos dejan ambos sin fijar.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Vacío aquí, pero el campo debe estar presente: el nodo verifica la
    // firma contra una reserialización de este struct, así que omitirlo
    // cambia los bytes que se hashean y la actualización vuelve como
    // INVALID_SIGNATURE en lugar de como algo sobre destinos.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// Un proveedor registrado, firmando correctamente, reportando una entrega de una
// notificación que este nodo nunca despachó. Es rechazado, y no se escribe ningún
// recibo.
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

Fuente completa: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` desde `openfiat-sdks/typescript`).

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
  // Debe resolverse — un dominio reservado se rechaza en el registro.
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
  // Vacío, pero presente: la firma se verifica contra una
  // reserialización de este struct, así que omitir el campo hace que los bytes
  // difieran de los firmados aquí y la actualización se rechaza como
  // INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Rechazado: este nodo nunca despachó `notif-1`, así que no tiene registro de
// despacho contra el cual comprobar el reporte.
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

## Qué comprueba un nodo, y qué cuesta

`apply_delivery_report` requiere un `DispatchRecord` que este nodo hizo él mismo,
y luego contrasta el servicio, el destinatario y el disparador del reporte contra él.
Sin uno responde `RESOURCE_NOT_FOUND`.

Eso tiene un coste real y deliberado: **un nodo que nunca enrutó una notificación
dada descarta un reporte que no puede comprobar**, incluso uno veraz. Eso es
recuperable — los nodos que *sí* la enrutaron siguen aceptando y difundiendo el
reporte, y el despacho es determinista, así que en estado estable eso es cada
nodo. Aceptar una afirmación no comprobable no es recuperable: escribe una
declaración no verificable en el estado replicado de forma permanente.
