---
title: Construye un bot de trading
---

# Construye un bot de trading

Un bot de trading mínimo: un comerciante publica un anuncio de venta (OFS-2100),
y luego una identidad de bot separada lo descubre y abre una reserva contra
él (OFS-2200). El bloqueo del escrow es automático al solicitarlo — no hay un paso de
confirmación aparte.

Arranca primero un nodo local:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Fuente completa: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` desde `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Fijado una vez. La reserva de abajo tiene que coincidir con él exactamente, y
// escribir el número dos veces es cómo ambos se desvían.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // Una dirección de mint, no un ticker — ver abajo.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Denominado en el ACTIVO, no en la moneda fiat de arriba.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// Un bot real llamaría en su lugar a client.get_advertisements() con un filtro
// que describa su estrategia — la reserva solo necesita el ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // El precio que el bot acepta, firmado dentro de la petición.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### Un anuncio nombra un mint, no un ticker

`asset_mint` es una dirección de mint de Solana en base58. Un ticker es una etiqueta que el
comerciante eligió, y nada lo ata al token que el escrow movería en realidad —
un anuncio podría decir «USDT» y liquidarse en otra cosa, con
cada capa coincidiendo en que la operación se completó, porque cada una hizo exactamente lo que
se le pidió.

Nunca aportas un símbolo. El nodo resuelve uno a partir del mint y lo devuelve
junto al registro como `asset_symbol`, que es `null` para un mint del que no tiene
nombre. Muestra la dirección en ese caso; una dirección sin apodo es
inútil y verdadera, y una suposición es útil y falsa.

### Una reserva fija el precio que acordó

`agreed_price` se firma dentro de la petición, y el nodo comprueba que se deriva
de los propios términos del anuncio — rechazando con `PRICE_DISAGREEMENT`
en caso contrario. Eso es lo que impide a un comerciante volver a poner precio entre la cotización que un bot
leyó y el escrow que bloquea.

Este anuncio es `Fixed`, así que el precio acordado es simplemente lo que
anuncia y no hay un mid que registrar. Contra uno `Floating`, un bot
lee ambos del `quote` en `getAdvertisement` y pasa `agreed_mid`
también — eso es lo que permite al nodo re-derivar el mismo número a partir de la misma
observación del oráculo en lugar de la suya propia, que puede diferir.

`getReservation` es una lectura abierta y no autenticada, así que lo que vuelve es la
[vista redactada](../api/trade-privacy.md): el estado, el importe y el anuncio
están ahí, el solicitante no. Un bot que necesita sus propias reservas por completo
— incluidos los campos de las partes — las lee con una
[prueba de cartera](../api/wallet-proof-reads.md) en su lugar.

## TypeScript

Fuente completa: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` desde `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Fijado una vez: la reserva de abajo debe coincidir con él exactamente.
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

// Un bot real llamaría en su lugar a advertisements.getAdvertisements(client, {…})
// con un filtro que describa su estrategia — la reserva solo necesita el ID.
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

## Leer el libro

`getAdvertisements` toma un filtro y un cursor y responde con una página:
`{ advertisements, next_cursor }`. Antes respondía con un arreglo desnudo de
cada anuncio de la red, desde una llamada que no tomaba parámetros —
una respuesta creciendo sin límite sobre un libro que nadie podía buscar.

Acota en la **petición**. Filtrar una página después de que llega no solo
desperdicia la transferencia: el límite de la página se decidió sobre filas que luego descartaste,
así que el cursor ya no significa lo que crees.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` es una unión discriminada, y los tres casos son tres
    // promesas distintas. `Fixed` se mueve solo cuando el comerciante firma uno
    // nuevo; `Floating` vale hasta `mid_expires_at` y puede moverse antes
    // de eso; `Unpriceable` significa que el anuncio existe y no tiene precio ahora mismo.
    // Leer `price` sin acotar renderizaría un anuncio sin precio
    // como gratis.
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

Pasa `next_cursor` de vuelta **tal cual**. Resulta ser un id de anuncio,
y aun así no es uno que reconstruir a partir de la última fila que recibiste:
hacerlo significa reimplementar el ordenamiento del nodo, y un lector cuyo
ordenamiento discrepa recibe algunas filas dos veces y otras nunca, sin nada
que lo indique. Detente cuando el cursor sea `null`, no cuando una página esté vacía — una
página llena no prueba que exista otra, así que el nodo puede devolver un cursor
sin nada detrás.
