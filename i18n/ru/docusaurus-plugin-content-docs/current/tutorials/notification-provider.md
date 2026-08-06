---
title: Зарегистрируйте поставщика уведомлений
---

# Зарегистрируйте поставщика уведомлений

Зарегистрируйтесь в реестре сервисов (OFS-1500) узла как поставщик уведомлений,
подпишите кошелёк на категорию и узнайте правило, управляющее отчётами о доставке
(OFS-6000).

:::warning Отчёт о доставке не самозаверяем

Узел принимает отчёт только если у него есть **собственная** соответствующая
запись диспетчеризации. Поэтому этот разбор заканчивается наблюдением, как хорошо
сформированный, корректно подписанный отчёт **отклоняется** — потому что узел
никогда не маршрутизировал уведомление, которое он называет.

Это интересная часть и причина, по которой правило существует: вознаграждение и
репутация поставщика следуют за объёмом, о котором он отчитывается, поэтому приём
произвольного id уведомления позволил бы любому зарегистрированному шлюзу
фабриковать доказательства работы, которую никто у него не просил.

Заработать квитанцию требует реальной диспетчеризации, которая требует подписки,
несущей назначение, запечатанное на ваш шлюз. Запечатывание пока не раскрыто ни
одним SDK, поэтому этот путь описан здесь, а не выполнен.

:::

Сначала запустите локальный узел:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Полный исходник: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` из `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Должен разрешаться. Узел отказывается регистрировать endpoint в
    // зарезервированном домене (`.invalid`, `.example`, `.test`): подписанная
    // регистрация реплицируется на каждый узел и предлагается пользователям как
    // живая инфраструктура, поэтому адрес, который никогда не может разрешиться,
    // не безобидная заглушка — это сфабрикованный сервис, который никто не может
    // удалить.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Обязательно всегда, когда задан `pricing` — узел отклоняет цену без места,
    // куда платить. Бесплатные сервисы оставляют оба незаданными.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Здесь пусто, но поле должно присутствовать: узел проверяет подпись против
    // ре-сериализации этой структуры, поэтому его пропуск меняет хешируемые
    // байты и обновление возвращается как INVALID_SIGNATURE, а не как что-то о
    // назначениях.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// Зарегистрированный поставщик, подписывающий корректно, отчитывающийся о
// доставке уведомления, которое этот узел никогда не диспетчеризировал. Оно
// отклоняется, и никакая квитанция не пишется.
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

Полный исходник: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` из `openfiat-sdks/typescript`).

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
  // Должен разрешаться — зарезервированный домен отклоняется при регистрации.
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
  // Пусто, но присутствует: подпись проверяется против ре-сериализации этой
  // структуры, поэтому пропуск поля делает байты отличными от подписанных здесь,
  // и обновление отклоняется как INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Отклонено: этот узел никогда не диспетчеризировал `notif-1`, поэтому у него
// нет записи диспетчеризации для проверки отчёта.
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

## Что узел проверяет, и что это стоит

`apply_delivery_report` требует `DispatchRecord`, который этот узел сделал сам,
затем перекрёстно сверяет сервис, получателя и триггер отчёта с ним. Без такой
записи он отвечает `RESOURCE_NOT_FOUND`.

У этого реальная и намеренная цена: **узел, который никогда не маршрутизировал
данное уведомление, отбрасывает отчёт, который не может проверить**, даже
правдивый. Это восстановимо — узлы, которые *маршрутизировали* его, всё же
принимают и распространяют отчёт, а диспетчеризация детерминирована, так что в
установившемся режиме это каждый узел. Приём непроверяемого утверждения
невосстановим: он навсегда записывает непроверяемое высказывание в реплицированное
состояние.
