---
title: Build a trading bot
---

# Build a trading bot

A minimal trading bot: a merchant publishes a Sell advertisement (OFS-2100),
then a separate bot identity discovers it and opens a reservation against
it (OFS-2200). Locking escrow is automatic on request — no separate
confirmation step.

Start a local node first:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Full source: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` from `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Bound once. The reservation below has to agree with it exactly, and
// writing the number twice is how the two drift apart.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // A mint address, not a ticker — see below.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Denominated in the ASSET, not in the fiat currency above.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// A real bot would instead call client.get_advertisements() with a filter
// describing its strategy — reservation just needs the ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // The price the bot is agreeing to, signed into the request.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### An advertisement names a mint, not a ticker

`asset_mint` is a base58 Solana mint address. A ticker is a label the
merchant chose, and nothing tied it to the token the escrow would actually
move — an advertisement could say "USDT" and settle in something else, with
every layer agreeing the trade completed, because each did exactly what it
was asked.

You never supply a symbol. The node resolves one from the mint and returns
it beside the record as `asset_symbol`, which is `null` for a mint it has
no name for. Show the address in that case; an address with no nickname is
unhelpful and true, and a guess is helpful and false.

### A reservation pins the price it agreed to

`agreed_price` is signed into the request, and the node checks it follows
from the advertisement's own terms — refusing with `PRICE_DISAGREEMENT`
otherwise. That is what stops a merchant repricing between the quote a bot
read and the escrow it locks.

This advertisement is `Fixed`, so the agreed price is simply what it
advertises and there is no mid to record. Against a `Floating` one, a bot
reads both from the `quote` on `getAdvertisement` and passes `agreed_mid`
too — that is what lets the node re-derive the same number from the same
oracle observation rather than from its own, which may differ.

`getReservation` is an open, unauthenticated read, so what comes back is the
[redacted view](../api/trade-privacy.md): the state, amount and advertisement
are there, the requester is not. A bot that needs its own reservations in full
— including the party fields — reads them with a
[wallet proof](../api/wallet-proof-reads.md) instead.

## TypeScript

Full source: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` from `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Bound once: the reservation below must agree with it exactly.
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

// A real bot would instead call advertisements.getAdvertisements(client, {…})
// with a filter describing its strategy — reservation just needs the ID.
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

## Reading the book

`getAdvertisements` takes a filter and a cursor and answers with one page:
`{ advertisements, next_cursor }`. It used to answer with a bare array of
every advertisement on the network, from a call that took no parameters —
a response growing without bound over a book nobody could search.

Narrow in the **request**. Filtering a page after it arrives does not just
waste the transfer: the page boundary was decided over rows you then threw
away, so the cursor no longer means what you think it does.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` is a discriminated union, and the three cases are three
    // different promises. `Fixed` moves only when the merchant signs a new
    // one; `Floating` is good until `mid_expires_at` and may move before
    // then; `Unpriceable` means the ad exists and has no price right now.
    // Reading `price` off it without narrowing would render an unpriceable
    // advertisement as free.
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

Pass `next_cursor` back **verbatim**. It happens to be an advertisement id,
and it is still not one to reconstruct from the last row you received:
doing that means reimplementing the node's ordering, and a reader whose
ordering disagrees is handed some rows twice and others never, with nothing
to say so. Stop when the cursor is `null`, not when a page is empty — a
full page does not prove another exists, so the node may hand back a cursor
with nothing behind it.
