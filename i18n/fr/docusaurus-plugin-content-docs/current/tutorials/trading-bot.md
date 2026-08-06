---
title: Construire un bot de trading
---

# Construire un bot de trading

Un bot de trading minimal : un commerçant publie une annonce de vente (OFS-2100),
puis une identité de bot séparée la découvre et ouvre une réservation contre elle
(OFS-2200). Le verrouillage de l’escrow est automatique à la demande — pas
d’étape de confirmation séparée.

Démarrez d’abord un nœud local :

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Source complète : [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` depuis `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Lié une fois. La réservation ci-dessous doit y correspondre exactement, et
// écrire le nombre deux fois est la façon dont les deux dérivent.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // Une adresse de mint, pas un ticker — voir ci-dessous.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Libellé dans l’ACTIF, pas dans la monnaie fiat ci-dessus.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// Un vrai bot appellerait plutôt client.get_advertisements() avec un filtre
// décrivant sa stratégie — la réservation n’a besoin que de l’ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // Le prix que le bot accepte, signé dans la requête.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### Une annonce nomme un mint, pas un ticker

`asset_mint` est une adresse de mint Solana en base58. Un ticker est une étiquette
que le commerçant a choisie, et rien ne l’attache au token que l’escrow
déplacerait réellement — une annonce pourrait dire « USDT » et se régler en autre
chose, chaque couche s’accordant sur le fait que l’échange s’est achevé, parce
que chacune a fait exactement ce qu’on lui a demandé.

Vous ne fournissez jamais un symbole. Le nœud en résout un à partir du mint et le
renvoie à côté de l’enregistrement comme `asset_symbol`, qui vaut `null` pour un
mint dont il n’a pas de nom. Affichez l’adresse dans ce cas ; une adresse sans
surnom est inutile et vraie, et une supposition est utile et fausse.

### Une réservation épingle le prix convenu

`agreed_price` est signé dans la requête, et le nœud vérifie qu’il découle des
propres termes de l’annonce — refusant par `PRICE_DISAGREEMENT` sinon. C’est ce
qui empêche un commerçant de reprixer entre la cotation qu’un bot a lue et
l’escrow qu’il verrouille.

Cette annonce est `Fixed`, donc le prix convenu est simplement ce qu’elle annonce
et il n’y a pas de mid à enregistrer. Contre une `Floating`, un bot lit les deux
depuis le `quote` sur `getAdvertisement` et passe aussi `agreed_mid` — c’est ce
qui permet au nœud de re-dériver le même nombre à partir de la même observation
d’oracle plutôt que de la sienne, qui peut différer.

`getReservation` est une lecture ouverte et non authentifiée, donc ce qui revient
est la [vue rédigée](../api/trade-privacy.md) : l’état, le montant et l’annonce
sont là, le demandeur non. Un bot qui a besoin de ses propres réservations en
entier — y compris les champs des parties — les lit plutôt avec une
[preuve de portefeuille](../api/wallet-proof-reads.md).

## TypeScript

Source complète : [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` depuis `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Lié une fois : la réservation ci-dessous doit y correspondre exactement.
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

// Un vrai bot appellerait plutôt advertisements.getAdvertisements(client, {…})
// avec un filtre décrivant sa stratégie — la réservation n’a besoin que de l’ID.
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

## Lire le carnet

`getAdvertisements` prend un filtre et un curseur et répond par une page :
`{ advertisements, next_cursor }`. Il répondait par un tableau nu de chaque
annonce du réseau, à partir d’un appel qui ne prenait aucun paramètre — une
réponse croissant sans limite sur un carnet que personne ne pouvait chercher.

Restreignez dans la **requête**. Filtrer une page après son arrivée ne gaspille
pas seulement le transfert : la limite de page a été décidée sur des lignes que
vous avez ensuite jetées, donc le curseur ne signifie plus ce que vous pensez.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` est une union discriminée, et les trois cas sont trois promesses
    // différentes. `Fixed` ne bouge que quand le commerçant en signe une
    // nouvelle ; `Floating` est valide jusqu’à `mid_expires_at` et peut bouger
    // avant ; `Unpriceable` signifie que l’annonce existe et n’a pas de prix
    // pour l’instant. Lire `price` dessus sans restreindre rendrait une annonce
    // non tarifable comme gratuite.
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

Repassez `next_cursor` **tel quel**. Il se trouve être un id d’annonce, et il
n’est pourtant pas à reconstruire depuis la dernière ligne reçue : le faire
signifie réimplémenter l’ordonnancement du nœud, et un lecteur dont
l’ordonnancement diverge se voit remettre certaines lignes deux fois et d’autres
jamais, sans que rien ne le signale. Arrêtez quand le curseur vaut `null`, pas
quand une page est vide — une page pleine ne prouve pas qu’une autre existe, donc
le nœud peut renvoyer un curseur sans rien derrière.
