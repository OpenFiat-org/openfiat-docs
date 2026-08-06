---
title: एक ट्रेडिंग बॉट बनाएँ
---

# एक ट्रेडिंग बॉट बनाएँ

एक न्यूनतम ट्रेडिंग बॉट: एक व्यापारी एक बिक्री विज्ञापन (OFS-2100) प्रकाशित करता
है, फिर एक अलग बॉट पहचान उसे खोजती है और उसके विरुद्ध एक आरक्षण खोलती है
(OFS-2200)। अनुरोध पर एस्क्रो लॉक करना स्वचालित है — कोई अलग पुष्टिकरण चरण नहीं।

पहले एक स्थानीय नोड शुरू करें:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

पूर्ण स्रोत: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`openfiat-sdks/rust` से `cargo run --example trading_bot`)।

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// एक बार बाँधा गया। नीचे का आरक्षण इससे ठीक-ठीक सहमत होना चाहिए, और संख्या को दो
// बार लिखना ही वह तरीका है जिससे दोनों बहक जाते हैं।
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // एक mint पता, कोई ticker नहीं — नीचे देखें।
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // ऊपर की फिएट मुद्रा में नहीं, बल्कि “संपत्ति” में अंकित।
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// एक असली बॉट इसके बजाय अपनी रणनीति का वर्णन करने वाले एक फ़िल्टर के साथ
// client.get_advertisements() कॉल करेगा — आरक्षण को केवल ID चाहिए।
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // वह कीमत जिस पर बॉट सहमत हो रहा है, अनुरोध में हस्ताक्षरित।
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### एक विज्ञापन एक mint को नामित करता है, एक ticker को नहीं

`asset_mint` एक base58 Solana mint पता है। एक ticker एक लेबल है जिसे व्यापारी ने
चुना, और कुछ भी उसे उस टोकन से नहीं बाँधता जिसे एस्क्रो वास्तव में हिलाता — एक
विज्ञापन «USDT» कह सकता है और किसी और चीज़ में निपट सकता है, हर परत के इस पर सहमत
होते हुए कि व्यापार पूरा हुआ, क्योंकि हर एक ने ठीक वही किया जो उससे माँगा गया।

आप कभी एक प्रतीक नहीं देते। नोड mint से एक हल करता है और उसे रिकॉर्ड के साथ
`asset_symbol` के रूप में लौटाता है, जो एक ऐसे mint के लिए `null` है जिसका उसके पास
कोई नाम नहीं। उस स्थिति में पता दिखाएँ; बिना उपनाम वाला एक पता अनुपयोगी और सच्चा
है, और एक अनुमान उपयोगी और झूठा है।

### एक आरक्षण उस कीमत को पिन करता है जिस पर वह सहमत हुआ

`agreed_price` अनुरोध में हस्ताक्षरित है, और नोड जाँचता है कि यह विज्ञापन के अपने
शर्तों से निकलती है — अन्यथा `PRICE_DISAGREEMENT` के साथ अस्वीकार करते हुए। वही
एक व्यापारी को बॉट द्वारा पढ़ी गई कोटेशन और उसके द्वारा लॉक किए एस्क्रो के बीच
पुनः मूल्य निर्धारण करने से रोकता है।

यह विज्ञापन `Fixed` है, इसलिए सहमत कीमत बस वही है जो यह विज्ञापित करता है और
रिकॉर्ड करने के लिए कोई mid नहीं। एक `Floating` के विरुद्ध, एक बॉट दोनों को
`getAdvertisement` पर `quote` से पढ़ता है और `agreed_mid` भी पास करता है — वही
नोड को उसी ऑरेकल अवलोकन से वही संख्या फिर से निकालने देता है, न कि अपने से, जो
भिन्न हो सकती है।

`getReservation` एक खुला, अप्रमाणित पठन है, इसलिए जो वापस आता है वह
[संपादित दृश्य](../api/trade-privacy.md) है: स्थिति, राशि और विज्ञापन वहाँ हैं,
अनुरोधकर्ता नहीं। एक बॉट जिसे अपने आरक्षण पूर्ण रूप में चाहिए — पक्ष फ़ील्ड सहित —
वह इसके बजाय एक [वॉलेट प्रूफ](../api/wallet-proof-reads.md) से उन्हें पढ़ता है।

## TypeScript

पूर्ण स्रोत: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`openfiat-sdks/typescript` से `pnpm tsx examples/trading_bot.ts`)।

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// एक बार बाँधा गया: नीचे का आरक्षण इससे ठीक-ठीक सहमत होना चाहिए।
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

// एक असली बॉट इसके बजाय अपनी रणनीति का वर्णन करने वाले एक फ़िल्टर के साथ
// advertisements.getAdvertisements(client, {…}) कॉल करेगा — आरक्षण को केवल ID चाहिए।
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

## ऑर्डर-बुक पढ़ना

`getAdvertisements` एक फ़िल्टर और एक कर्सर लेता है और एक पृष्ठ से उत्तर देता है:
`{ advertisements, next_cursor }`। यह पहले नेटवर्क पर हर विज्ञापन के एक नंगे array
से उत्तर देता था, एक ऐसी कॉल से जो कोई पैरामीटर नहीं लेती थी — एक ऐसी ऑर्डर-बुक पर
बिना सीमा बढ़ती एक प्रतिक्रिया जिसे कोई नहीं खोज सकता था।

**अनुरोध** में संकुचित करें। एक पृष्ठ के आने के बाद उसे फ़िल्टर करना केवल
स्थानांतरण बर्बाद नहीं करता: पृष्ठ की सीमा उन पंक्तियों पर तय हुई थी जिन्हें आपने
फिर फेंक दिया, इसलिए कर्सर अब वह अर्थ नहीं रखता जो आप सोचते हैं।

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` एक विभेदित यूनियन है, और तीन स्थितियाँ तीन भिन्न वादे हैं।
    // `Fixed` केवल तभी हिलता है जब व्यापारी एक नया हस्ताक्षरित करता है;
    // `Floating` `mid_expires_at` तक अच्छा है और उससे पहले हिल सकता है;
    // `Unpriceable` का अर्थ है कि विज्ञापन मौजूद है और अभी कोई कीमत नहीं।
    // संकुचित किए बिना उससे `price` पढ़ना एक अ-मूल्य-योग्य विज्ञापन को मुफ़्त
    // के रूप में रेंडर करेगा।
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

`next_cursor` को **ज्यों-का-त्यों** वापस पास करें। यह संयोगवश एक विज्ञापन id है,
और यह फिर भी वह नहीं जिसे आपको प्राप्त अंतिम पंक्ति से पुनर्निर्मित करना है: ऐसा
करने का अर्थ है नोड के क्रम को फिर से लागू करना, और एक पाठक जिसका क्रम असहमत है
उसे कुछ पंक्तियाँ दो बार और अन्य कभी नहीं दी जाती हैं, बिना किसी सूचना के। तब रुकें
जब कर्सर `null` हो, न कि जब एक पृष्ठ खाली हो — एक भरा पृष्ठ यह सिद्ध नहीं करता कि
एक और मौजूद है, इसलिए नोड पीछे कुछ भी न होते हुए एक कर्सर लौटा सकता है।
