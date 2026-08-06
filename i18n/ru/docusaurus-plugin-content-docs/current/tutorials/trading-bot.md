---
title: Постройте торгового бота
---

# Постройте торгового бота

Минимальный торговый бот: мерчант публикует объявление о продаже (OFS-2100), затем
отдельная идентичность бота его обнаруживает и открывает резервирование против
него (OFS-2200). Блокировка эскроу автоматическая по запросу — без отдельного шага
подтверждения.

Сначала запустите локальный узел:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Полный исходник: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` из `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Привязано один раз. Резервирование ниже должно совпасть с ним в точности, а
// запись числа дважды — это как эти двое расходятся.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // Адрес mint, а не тикер — см. ниже.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Номинировано в «активе», а не в фиатной валюте выше.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// Реальный бот вместо этого вызвал бы client.get_advertisements() с фильтром,
// описывающим его стратегию — резервированию нужен только ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // Цена, на которую бот соглашается, подписанная в запрос.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### Объявление называет mint, а не тикер

`asset_mint` — это адрес mint Solana в base58. Тикер — это метка, которую выбрал
мерчант, и ничто не привязывало её к токену, который эскроу на самом деле сдвинул
бы — объявление могло бы сказать «USDT» и рассчитаться в чём-то другом, при этом
каждый слой соглашается, что сделка завершилась, потому что каждый сделал ровно
то, о чём его просили.

Вы никогда не поставляете символ. Узел разрешает его из mint и возвращает рядом с
записью как `asset_symbol`, который равен `null` для mint, для которого у него нет
имени. Показывайте адрес в этом случае; адрес без прозвища бесполезен и правдив, а
догадка полезна и ложна.

### Резервирование фиксирует цену, на которую согласилось

`agreed_price` подписан в запрос, и узел проверяет, что он следует из собственных
условий объявления, — отклоняя с `PRICE_DISAGREEMENT` иначе. Это то, что мешает
мерчанту переоценивать между котировкой, которую прочитал бот, и эскроу, который он
блокирует.

Это объявление `Fixed`, поэтому согласованная цена — просто то, что оно
объявляет, и записывать mid нечего. Против `Floating` бот читает оба из `quote` в
`getAdvertisement` и передаёт также `agreed_mid` — это позволяет узлу заново
вывести то же число из того же наблюдения оракула, а не из своего, которое может
отличаться.

`getReservation` — открытое, неаутентифицированное чтение, поэтому то, что
возвращается, — это [отредактированный вид](../api/trade-privacy.md): состояние,
сумма и объявление там, запрашивающего нет. Бот, которому нужны его собственные
резервирования полностью — включая поля сторон — читает их вместо этого с
[доказательством кошелька](../api/wallet-proof-reads.md).

## TypeScript

Полный исходник: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` из `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Привязано один раз: резервирование ниже должно совпасть с ним в точности.
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

// Реальный бот вместо этого вызвал бы advertisements.getAdvertisements(client, {…})
// с фильтром, описывающим его стратегию — резервированию нужен только ID.
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

## Чтение ордербука

`getAdvertisements` принимает фильтр и курсор и отвечает одной страницей:
`{ advertisements, next_cursor }`. Раньше он отвечал голым массивом каждого
объявления сети, из вызова, который не принимал параметров, — ответ, растущий без
границ по книге, в которой никто не мог искать.

Сужайте в **запросе**. Фильтрация страницы после её прибытия не просто тратит
передачу: граница страницы была решена по строкам, которые вы затем выбросили,
поэтому курсор больше не значит то, что вы думаете.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` — размеченное объединение, и три случая — три разных обещания.
    // `Fixed` двигается только когда мерчант подписывает новое; `Floating`
    // действителен до `mid_expires_at` и может сдвинуться раньше; `Unpriceable`
    // означает, что объявление существует и сейчас без цены. Чтение `price` из
    // него без сужения отрисовало бы неоцениваемое объявление как бесплатное.
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

Передавайте `next_cursor` обратно **дословно**. Он по случайности является id
объявления, и всё же его не следует реконструировать из последней полученной вами
строки: делать это значит заново реализовывать упорядочивание узла, а читателю,
чьё упорядочивание расходится, вручают одни строки дважды, а другие никогда, без
чего-либо, что бы на это указало. Останавливайтесь, когда курсор равен `null`, а
не когда страница пуста — полная страница не доказывает, что существует другая,
поэтому узел может вернуть курсор, за которым ничего нет.
