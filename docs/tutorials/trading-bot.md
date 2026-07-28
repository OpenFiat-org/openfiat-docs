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
CLI_HTTP_ADDR=127.0.0.1:8080 cargo run -p openfiat-cli
```

## Rust

Full source: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` from `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    asset: "USDT".to_string(),
    direction: Direction::Sell,
    fiat_currency: "KES".to_string(),
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: Amount::new(12_950, 2) },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// A real bot would instead call client.get_advertisements() and pick one
// matching its own strategy — reservation just needs the ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

## TypeScript

Full source: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` from `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

const create: AdvertisementCreate = {
  id: "my-ad",
  merchant: toBytes(peerIdFromPublicKey(merchant.publicKey)),
  merchant_public_key: toBytes(merchant.publicKey),
  asset: "USDT",
  direction: "Sell",
  fiat_currency: "KES",
  min_trade: { base_units: 1_000, decimals: 2 },
  max_trade: { base_units: 50_000, decimals: 2 },
  initial_liquidity: { base_units: 200_000, decimals: 2 },
  pricing: { Fixed: { price: { base_units: 12_950, decimals: 2 } } },
  payment_methods: ["M-Pesa"],
  timestamp: Date.now(),
};
const adId = await advertisements.sendAdvertisementCreate(client, create, merchant);

// A real bot would instead call advertisements.getAdvertisements(client)
// and pick one matching its own strategy — reservation just needs the ID.
const request: ReservationRequest = {
  id: "my-reservation",
  advertisement_id: adId,
  requester: toBytes(peerIdFromPublicKey(bot.publicKey)),
  requester_public_key: toBytes(bot.publicKey),
  amount: { base_units: 5_000, decimals: 2 },
  timestamp: Date.now(),
};
const reservationId = await reservations.sendReservationRequest(client, request, bot);

const reservation = await reservations.getReservation(client, reservationId);
console.log(reservation?.state); // "EscrowLocked"
```
