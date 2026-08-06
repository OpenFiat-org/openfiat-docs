---
title: एक सूचना प्रदाता पंजीकृत करें
---

# एक सूचना प्रदाता पंजीकृत करें

एक नोड की सेवा रजिस्ट्री (OFS-1500) में एक सूचना प्रदाता के रूप में पंजीकृत करें,
एक वॉलेट को एक श्रेणी की सदस्यता दिलाएँ, और उस नियम को जानें जो डिलीवरी रिपोर्ट
(OFS-6000) को नियंत्रित करता है।

:::warning एक डिलीवरी रिपोर्ट स्व-प्रमाणित नहीं है

एक नोड एक रिपोर्ट केवल तभी स्वीकार करता है जब उसके पास **अपना** एक मिलता-जुलता
डिस्पैच रिकॉर्ड हो। इसलिए यह वॉकथ्रू एक सुगठित, सही-हस्ताक्षरित रिपोर्ट को
**अस्वीकृत** होते देखकर समाप्त होता है — क्योंकि नोड ने कभी उस सूचना को रूट नहीं
किया जिसे वह नामित करती है।

वह दिलचस्प हिस्सा है, और वह कारण जिससे नियम मौजूद है: एक प्रदाता का मुआवज़ा और
प्रतिष्ठा उस आयतन का अनुसरण करते हैं जो वह रिपोर्ट करता है, इसलिए एक मनमाना
सूचना id स्वीकार करना किसी भी पंजीकृत गेटवे को उस काम का सबूत गढ़ने देगा जो किसी
ने उससे नहीं माँगा।

एक रसीद कमाने के लिए एक असली डिस्पैच चाहिए, जिसके लिए आपके गेटवे को सील किया गया
एक गंतव्य ले जाती एक सदस्यता चाहिए। सीलिंग को अभी कोई भी SDK उजागर नहीं करता,
इसलिए वह पथ यहाँ किया जाने के बजाय वर्णित है।

:::

पहले एक स्थानीय नोड शुरू करें:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

पूर्ण स्रोत: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`openfiat-sdks/rust` से `cargo run --example notification_provider`)।

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // हल होना ही चाहिए। एक नोड एक आरक्षित डोमेन (`.invalid`, `.example`,
    // `.test`) में एक endpoint पंजीकृत करने से इनकार करता है: एक हस्ताक्षरित
    // पंजीकरण हर नोड को प्रतिकृत होता है और उपयोगकर्ताओं को जीवंत बुनियादी ढाँचे
    // के रूप में प्रस्तुत किया जाता है, इसलिए एक पता जो कभी हल नहीं हो सकता एक
    // हानिरहित प्लेसहोल्डर नहीं है — यह एक गढ़ी हुई सेवा है जिसे कोई नहीं मिटा सकता।
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // जब भी `pricing` सेट हो तब आवश्यक — एक नोड एक ऐसी कीमत को अस्वीकार करता है
    // जिसे चुकाने की कोई जगह नहीं। मुफ़्त सेवाएँ दोनों को अनसेट छोड़ती हैं।
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // यहाँ खाली, पर फ़ील्ड मौजूद होनी चाहिए: नोड इस struct के एक पुनः-क्रमांकन के
    // विरुद्ध हस्ताक्षर सत्यापित करता है, इसलिए इसे छोड़ना हैश किए जा रहे बाइट
    // बदल देता है और अपडेट गंतव्यों के बारे में कुछ के बजाय INVALID_SIGNATURE के
    // रूप में वापस आता है।
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// एक पंजीकृत प्रदाता, सही हस्ताक्षर करते हुए, एक ऐसी सूचना के लिए एक डिलीवरी
// रिपोर्ट करते हुए जिसे इस नोड ने कभी डिस्पैच नहीं किया। यह अस्वीकृत होती है, और
// कोई रसीद नहीं लिखी जाती।
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

पूर्ण स्रोत: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`openfiat-sdks/typescript` से `pnpm tsx examples/notification_provider.ts`)।

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
  // हल होना ही चाहिए — एक आरक्षित डोमेन पंजीकरण पर अस्वीकृत होता है।
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
  // खाली, पर मौजूद: हस्ताक्षर इस struct के एक पुनः-क्रमांकन के विरुद्ध सत्यापित
  // होता है, इसलिए फ़ील्ड छोड़ना बाइट को यहाँ हस्ताक्षरित से भिन्न कर देता है
  // और अपडेट INVALID_SIGNATURE के रूप में अस्वीकृत होता है।
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// अस्वीकृत: इस नोड ने कभी `notif-1` डिस्पैच नहीं किया, इसलिए इसके पास रिपोर्ट को
// जाँचने के लिए कोई डिस्पैच रिकॉर्ड नहीं।
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

## एक नोड क्या जाँचता है, और इसकी लागत क्या है

`apply_delivery_report` को एक `DispatchRecord` चाहिए जिसे इस नोड ने स्वयं बनाया,
फिर रिपोर्ट की सेवा, प्राप्तकर्ता और ट्रिगर को उसके विरुद्ध क्रॉस-चेक करता है।
एक के बिना यह `RESOURCE_NOT_FOUND` उत्तर देता है।

इसकी एक असली और जानबूझकर की गई लागत है: **एक नोड जिसने एक दी गई सूचना कभी रूट
नहीं की, एक ऐसी रिपोर्ट गिरा देता है जिसे वह जाँच नहीं सकता**, यहाँ तक कि एक
सच्ची भी। वह पुनर्प्राप्य है — जिन नोड्स ने उसे *रूट किया* वे अब भी रिपोर्ट को
स्वीकार और gossip करते हैं, और डिस्पैच नियतात्मक है, इसलिए स्थिर अवस्था में वह हर
नोड है। एक अ-जाँच-योग्य दावा स्वीकार करना पुनर्प्राप्य नहीं है: यह एक अ-सत्यापन-
योग्य कथन को प्रतिकृत स्थिति में स्थायी रूप से लिख देता है।
