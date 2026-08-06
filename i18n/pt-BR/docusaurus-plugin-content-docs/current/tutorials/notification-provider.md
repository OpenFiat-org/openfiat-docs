---
title: Registre um provedor de notificações
---

# Registre um provedor de notificações

Registre-se no Registro de Serviços (OFS-1500) de um nó como Provedor de
Notificações, faça uma carteira se inscrever numa categoria, e aprenda a regra
que governa os relatórios de entrega (OFS-6000).

:::warning Um relatório de entrega não é autoafirmado

Um nó aceita um relatório apenas se tiver um registro de despacho correspondente
**próprio**. Então este passo a passo termina vendo um relatório bem formado e
corretamente assinado ser **recusado** — porque o nó nunca roteou a notificação
que ele nomeia.

Essa é a parte interessante, e a razão pela qual a regra existe: a compensação e
a reputação de um provedor seguem o volume que ele reporta, então aceitar um id
de notificação arbitrário permitiria a qualquer gateway registrado fabricar
evidência de um trabalho que ninguém lhe pediu.

Ganhar um recibo precisa de um despacho real, que precisa de uma inscrição
carregando um destino selado ao seu gateway. A selagem ainda não é exposta por
nenhum SDK, então esse caminho é descrito aqui em vez de realizado.

:::

Inicie primeiro um nó local:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Fonte completa: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` a partir de `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Deve resolver. Um nó recusa registrar um endpoint num domínio reservado
    // (`.invalid`, `.example`, `.test`): um registro assinado é replicado a
    // cada nó e oferecido aos usuários como infraestrutura ao vivo, então um
    // endereço que nunca pode resolver não é um marcador inofensivo — é um
    // serviço fabricado que ninguém pode apagar.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Obrigatório sempre que `pricing` for definido — um nó rejeita um preço sem
    // lugar para ser pago. Serviços gratuitos deixam ambos sem definir.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Vazio aqui, mas o campo deve estar presente: o nó verifica a assinatura
    // contra uma reserialização deste struct, então omiti-lo muda os bytes
    // sendo hasheados e a atualização volta como INVALID_SIGNATURE em vez de
    // como algo sobre destinos.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// Um provedor registrado, assinando corretamente, reportando uma entrega de uma
// notificação que este nó nunca despachou. É recusado, e nenhum recibo é
// escrito.
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

Fonte completa: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` a partir de `openfiat-sdks/typescript`).

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
  // Deve resolver — um domínio reservado é recusado no registro.
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
  // Vazio, mas presente: a assinatura é verificada contra uma reserialização
  // deste struct, então omitir o campo faz os bytes diferirem dos assinados
  // aqui e a atualização é rejeitada como INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Recusado: este nó nunca despachou `notif-1`, então não tem registro de
// despacho para conferir o relatório.
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

## O que um nó confere, e quanto custa

`apply_delivery_report` exige um `DispatchRecord` que este nó fez ele mesmo, e
depois cruza o serviço, o destinatário e o gatilho do relatório contra ele. Sem
um, ele responde `RESOURCE_NOT_FOUND`.

Isso tem um custo real e deliberado: **um nó que nunca roteou uma dada
notificação descarta um relatório que não pode conferir**, mesmo um verdadeiro.
Isso é recuperável — os nós que *rotearam* a notificação ainda aceitam e
difundem o relatório, e o despacho é determinístico, então em estado estável isso
é todo nó. Aceitar uma afirmação não conferível não é recuperável: escreve um
enunciado não verificável no estado replicado de forma permanente.
