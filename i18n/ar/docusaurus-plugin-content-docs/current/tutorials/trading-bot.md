---
title: ابنِ روبوت تداول
---

# ابنِ روبوت تداول

روبوت تداول أدنى: ينشر تاجر إعلان بيع (OFS-2100)، ثم تكتشفه هوية روبوت
منفصلة وتفتح حجزًا عليه (OFS-2200). قفل الضمان تلقائي عند الطلب — لا خطوة
تأكيد منفصلة.

شغّل عقدة محلية أولًا:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

المصدر الكامل: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` من `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// مربوط مرة واحدة. على الحجز أدناه أن يتوافق معه تمامًا، وكتابة الرقم
// مرتين هي كيف ينحرف الاثنان.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // عنوان mint، لا رمز مؤشر — انظر أدناه.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // مقوَّم بـ«الأصل»، لا بعملة الفيات أعلاه.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// روبوت حقيقي سيستدعي بدلًا من ذلك client.get_advertisements() بمرشِّح
// يصف استراتيجيته — الحجز يحتاج المعرّف فقط.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // السعر الذي يوافق عليه الروبوت، موقَّعًا داخل الطلب.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### يسمّي الإعلان mint، لا رمز مؤشر

`asset_mint` عنوان mint لـ Solana بصيغة base58. الرمز المؤشر عنوان اختاره
التاجر، ولا شيء يربطه بالرمز الذي سيحرّكه الضمان فعلًا — إعلان قد يقول
«USDT» ويُسوّى بشيء آخر، مع موافقة كل طبقة على أن الصفقة اكتملت، لأن كلًّا
فعل بالضبط ما طُلب منه.

أنت لا تزوّد رمزًا قط. تحلّ العقدة واحدًا من الـ mint وتعيده إلى جانب
السجل كـ `asset_symbol`، وهو `null` لـ mint لا اسم لها لديه. اعرض العنوان
في تلك الحالة؛ عنوان بلا كنية عديم الفائدة وصادق، والتخمين مفيد وكاذب.

### يثبّت الحجز السعر الذي وافق عليه

`agreed_price` موقَّع داخل الطلب، وتفحص العقدة أنه يتبع شروط الإعلان
نفسها — رافضةً بـ `PRICE_DISAGREEMENT` خلاف ذلك. ذلك ما يمنع تاجرًا من
إعادة التسعير بين العرض الذي قرأه روبوت والضمان الذي يقفله.

هذا الإعلان `Fixed`، فالسعر المتفَق عليه هو ببساطة ما يعلنه ولا وسيط
لتسجيله. أمام `Floating`، يقرأ روبوت كليهما من `quote` على
`getAdvertisement` ويمرّر `agreed_mid` أيضًا — ذلك ما يتيح للعقدة أن
تعيد اشتقاق الرقم نفسه من ملاحظة الأوراكل نفسها بدلًا من ملاحظتها هي،
التي قد تختلف.

`getReservation` قراءة مفتوحة غير مصادَق عليها، فما يعود هو
[العرض المنقَّح](../api/trade-privacy.md): الحالة والمبلغ والإعلان هناك،
الطالب ليس. روبوت يحتاج حجوزاته كاملةً — بما فيها حقول الأطراف — يقرؤها
بـ[إثبات محفظة](../api/wallet-proof-reads.md) بدلًا من ذلك.

## TypeScript

المصدر الكامل: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` من `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// مربوط مرة واحدة: على الحجز أدناه أن يتوافق معه تمامًا.
const advertisedPrice = { base_units: 12_950, decimals: 2 };

const create: AdvertisementCreate = {
  id: "my-ad",
  merchant: toBytes(peerIdFromPublicKey(merchant.publicKey)),
  merchant_public_key: toBytes(merchant.publicKey),
  asset_mint: "C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y",
  direction: "Sell",
  fiat_currency: "KES",
  min_trade: { base_units: 1_000, decimals: 2 },
  max_trade: { base_units: 50_000, decimals: 2 },
  initial_liquidity: { base_units: 200_000, decimals: 2 },
  pricing: { Fixed: { price: advertisedPrice } },
  payment_methods: ["M-Pesa"],
  timestamp: Date.now(),
};
const adId = await advertisements.sendAdvertisementCreate(client, create, merchant);

// روبوت حقيقي سيستدعي بدلًا من ذلك advertisements.getAdvertisements(client, {…})
// بمرشِّح يصف استراتيجيته — الحجز يحتاج المعرّف فقط.
const request: ReservationRequest = {
  id: "my-reservation",
  advertisement_id: adId,
  requester: toBytes(peerIdFromPublicKey(bot.publicKey)),
  requester_public_key: toBytes(bot.publicKey),
  amount: { base_units: 5_000, decimals: 2 },
  agreed_price: advertisedPrice,
  agreed_mid: null,
  timestamp: Date.now(),
};
const reservationId = await reservations.sendReservationRequest(client, request, bot);

const reservation = await reservations.getReservation(client, reservationId);
console.log(reservation?.state); // "EscrowLocked"
```

## قراءة الدفتر

يأخذ `getAdvertisements` مرشِّحًا ومؤشِّرًا ويجيب بصفحة واحدة:
`{ advertisements, next_cursor }`. كان يجيب بمصفوفة مجردة لكل إعلان على
الشبكة، من استدعاء لم يأخذ معاملات — استجابة تنمو بلا حد فوق دفتر لا
يستطيع أحد البحث فيه.

ضيِّق في **الطلب**. ترشيح صفحة بعد وصولها لا يهدر النقل فحسب: حدُّ الصفحة
تقرّر فوق صفوف رميتها بعد ذلك، فالمؤشِّر لم يعد يعني ما تظن.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` اتحاد مميَّز، والحالات الثلاث ثلاثة وعود مختلفة.
    // `Fixed` يتحرك فقط حين يوقّع التاجر واحدًا جديدًا؛ `Floating`
    // صالح حتى `mid_expires_at` وقد يتحرك قبله؛ `Unpriceable` يعني
    // أن الإعلان موجود وبلا سعر الآن. قراءة `price` منه دون تضييق
    // ستعرض إعلانًا غير قابل للتسعير كمجاني.
    switch (ad.quote.kind) {
      case "Fixed":
        consider(ad, ad.quote.price);
        break;
      case "Floating":
        if (ad.quote.mid_expires_at > Date.now()) consider(ad, ad.quote.price);
        break;
      case "Unpriceable":
        skip(ad, ad.quote.reason); // NoOracleData | StaleOracleData | PriceOutOfRange
        break;
    }
  }
  cursor = page.next_cursor;
} while (cursor !== null);
```

مرِّر `next_cursor` **حرفيًا**. يصادف أنه معرّف إعلان، ومع ذلك ليس ما
تعيد بناءه من آخر صف تلقّيته: فعل ذلك يعني إعادة تنفيذ ترتيب العقدة،
وقارئ يخالف ترتيبه يُسلَّم بعض الصفوف مرتين وأخرى أبدًا، دون ما يشير إلى
ذلك. توقّف حين يكون المؤشِّر `null`، لا حين تكون صفحة فارغة — فصفحة
ممتلئة لا تثبت وجود أخرى، فقد تعيد العقدة مؤشِّرًا لا شيء خلفه.
