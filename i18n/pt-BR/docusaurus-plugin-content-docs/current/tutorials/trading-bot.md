---
title: Construa um bot de trading
---

# Construa um bot de trading

Um bot de trading mínimo: um comerciante publica um anúncio de venda (OFS-2100),
depois uma identidade de bot separada o descobre e abre uma reserva contra ele
(OFS-2200). O bloqueio do escrow é automático ao solicitar — sem passo de
confirmação separado.

Inicie primeiro um nó local:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Fonte completa: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` a partir de `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Vinculado uma vez. A reserva abaixo tem de concordar com ele exatamente, e
// escrever o número duas vezes é como os dois se descolam.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // Um endereço de mint, não um ticker — veja abaixo.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Denominado no ATIVO, não na moeda fiat acima.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// Um bot real chamaria em vez disso client.get_advertisements() com um filtro
// que descreve sua estratégia — a reserva só precisa do ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // O preço que o bot está aceitando, assinado na requisição.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### Um anúncio nomeia um mint, não um ticker

`asset_mint` é um endereço de mint da Solana em base58. Um ticker é um rótulo que
o comerciante escolheu, e nada o amarra ao token que o escrow de fato moveria —
um anúncio poderia dizer «USDT» e liquidar em outra coisa, com cada camada
concordando que a negociação se completou, porque cada uma fez exatamente o que
lhe foi pedido.

Você nunca fornece um símbolo. O nó resolve um a partir do mint e o retorna ao
lado do registro como `asset_symbol`, que é `null` para um mint do qual ele não
tem nome. Mostre o endereço nesse caso; um endereço sem apelido é inútil e
verdadeiro, e um palpite é útil e falso.

### Uma reserva fixa o preço com que concordou

`agreed_price` é assinado na requisição, e o nó confere que ele decorre dos
próprios termos do anúncio — recusando com `PRICE_DISAGREEMENT` caso contrário.
Isso é o que impede um comerciante de reprecificar entre a cotação que um bot leu
e o escrow que ele bloqueia.

Este anúncio é `Fixed`, então o preço acordado é simplesmente o que ele anuncia e
não há mid a registrar. Contra um `Floating`, um bot lê ambos do `quote` em
`getAdvertisement` e passa `agreed_mid` também — é o que permite ao nó
re-derivar o mesmo número a partir da mesma observação do oráculo em vez da sua
própria, que pode diferir.

`getReservation` é uma leitura aberta e não autenticada, então o que volta é a
[visão redigida](../api/trade-privacy.md): o estado, o valor e o anúncio estão
ali, o solicitante não. Um bot que precisa de suas próprias reservas por completo
— incluindo os campos das partes — as lê com uma
[prova de carteira](../api/wallet-proof-reads.md).

## TypeScript

Fonte completa: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` a partir de `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Vinculado uma vez: a reserva abaixo deve concordar com ele exatamente.
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

// Um bot real chamaria em vez disso advertisements.getAdvertisements(client, {…})
// com um filtro que descreve sua estratégia — a reserva só precisa do ID.
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

## Lendo o livro

`getAdvertisements` recebe um filtro e um cursor e responde com uma página:
`{ advertisements, next_cursor }`. Ele respondia com um arranjo nu de cada
anúncio da rede, a partir de uma chamada que não recebia parâmetros — uma
resposta crescendo sem limite sobre um livro que ninguém podia buscar.

Estreite na **requisição**. Filtrar uma página depois que ela chega não só
desperdiça a transferência: o limite da página foi decidido sobre linhas que você
depois descartou, então o cursor já não significa o que você pensa.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` é uma união discriminada, e os três casos são três promessas
    // distintas. `Fixed` se move só quando o comerciante assina um novo;
    // `Floating` vale até `mid_expires_at` e pode se mover antes disso;
    // `Unpriceable` significa que o anúncio existe e não tem preço agora.
    // Ler `price` dele sem estreitar renderizaria um anúncio sem preço como
    // gratuito.
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

Passe `next_cursor` de volta **tal e qual**. Ele por acaso é um id de anúncio, e
ainda assim não é um a reconstruir a partir da última linha que você recebeu:
fazê-lo significa reimplementar a ordenação do nó, e um leitor cuja ordenação
discorda recebe algumas linhas duas vezes e outras nunca, sem nada que o
indique. Pare quando o cursor for `null`, não quando uma página estiver vazia —
uma página cheia não prova que outra existe, então o nó pode devolver um cursor
sem nada atrás.
