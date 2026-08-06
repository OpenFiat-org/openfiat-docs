---
title: سجّل مزوّد إشعارات
---

# سجّل مزوّد إشعارات

سجّل لدى سجلّ الخدمات (OFS-1500) لعقدة كمزوّد إشعارات، واجعل محفظةً تشترك
في فئة، وتعلّم القاعدة التي تحكم تقارير التسليم (OFS-6000).

:::warning تقرير التسليم ليس موثَّقًا ذاتيًا

تقبل عقدة تقريرًا فقط إن كانت تحمل سجل إرسال مطابقًا **خاصًا بها**. لذا
تنتهي هذه الجولة بمشاهدة تقرير حسن التكوين وموقَّع بشكل صحيح وهو
**يُرفَض** — لأن العقدة لم توجّه قط الإشعار الذي يسمّيه.

ذلك هو الجزء المثير، وسبب وجود القاعدة: تعويض مزوّد وسمعته يتبعان الحجم
الذي يبلّغ عنه، فقبول معرّف إشعار عشوائي سيتيح لأي بوابة مسجَّلة تلفيق
دليل على عمل لم يطلبه منها أحد.

كسب إيصال يحتاج إرسالًا حقيقيًا، الذي يحتاج اشتراكًا يحمل وِجهةً مختومةً
لبوابتك. الختم لم تكشفه أي من الحزمتين بعد، لذا يُوصَف ذلك المسار هنا
بدلًا من تنفيذه.

:::

شغّل عقدة محلية أولًا:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

المصدر الكامل: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` من `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // يجب أن يُحلَّل. ترفض عقدة تسجيل نقطة نهاية في نطاق محجوز
    // (`.invalid`، `.example`، `.test`): تسجيل موقَّع يُكرَّر إلى كل عقدة
    // ويُعرَض على المستخدمين كبنية حية، فعنوان لا يمكن أن يُحلَّل أبدًا ليس
    // عنصرًا نائبًا غير مؤذٍ — إنه خدمة ملفَّقة لا يستطيع أحد حذفها.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // مطلوب كلما ضُبط `pricing` — ترفض عقدة سعرًا بلا مكان لدفعه.
    // الخدمات المجانية تترك كليهما غير مضبوطَين.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // فارغة هنا، لكن يجب أن يكون الحقل موجودًا: تتحقق العقدة من التوقيع
    // ضد إعادة تسلسل لهذه البنية، فحذفه يغيّر البايتات التي تُجزَّأ
    // ويعود التحديث كـ INVALID_SIGNATURE بدلًا من أي شيء عن الوِجهات.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// مزوّد مسجَّل، يوقّع بشكل صحيح، يبلّغ عن تسليم لإشعار لم ترسله هذه العقدة
// قط. يُرفَض، ولا يُكتَب أي إيصال.
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

المصدر الكامل: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` من `openfiat-sdks/typescript`).

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
  // يجب أن يُحلَّل — نطاق محجوز يُرفَض عند التسجيل.
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
  // فارغة، لكن موجودة: يُتحقَّق من التوقيع ضد إعادة تسلسل لهذه البنية،
  // فحذف الحقل يجعل البايتات تختلف عمّا وُقِّع هنا ويُرفَض التحديث كـ
  // INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// مرفوض: لم ترسل هذه العقدة `notif-1` قط، فليس لديها سجل إرسال لفحص
// التقرير ضده.
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

## ماذا تفحص عقدة، وما تكلفة ذلك

يتطلب `apply_delivery_report` سجل `DispatchRecord` صنعته هذه العقدة
بنفسها، ثم يطابق خدمة التقرير ومستلمه ومُطلِقه ضده. وبدونه يجيب
`RESOURCE_NOT_FOUND`.

لذلك تكلفة حقيقية ومتعمَّدة: **عقدة لم توجّه إشعارًا معيّنًا قط تُسقط
تقريرًا لا تستطيع فحصه**، حتى الصادق منه. وذلك قابل للاسترداد — فالعُقد
التي *وجّهته* ما زالت تقبل التقرير وتنشره عبر gossip، والإرسال حتمي،
ففي الحالة المستقرة يكون ذلك كل عقدة. أما قبول ادعاء غير قابل للفحص
فليس قابلًا للاسترداد: فهو يكتب تصريحًا غير قابل للتحقق في الحالة
المكرَّرة على نحو دائم.
