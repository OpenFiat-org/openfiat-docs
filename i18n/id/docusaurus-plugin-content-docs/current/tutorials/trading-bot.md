---
title: Bangun bot trading
---

# Bangun bot trading

Bot trading minimal: seorang merchant menerbitkan iklan jual (OFS-2100), lalu
identitas bot terpisah menemukannya dan membuka pemesanan terhadapnya (OFS-2200).
Penguncian escrow otomatis saat permintaan — tanpa langkah konfirmasi terpisah.

Mulai sebuah node lokal dulu:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Sumber lengkap: [`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
(`cargo run --example trading_bot` dari `openfiat-sdks/rust`).

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// Diikat sekali. Pemesanan di bawah harus setuju dengannya secara tepat, dan
// menulis angka dua kali adalah bagaimana keduanya menyimpang.
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // Alamat mint, bukan ticker — lihat di bawah.
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // Didenominasi dalam ASET, bukan dalam mata uang fiat di atas.
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// Bot nyata malah akan memanggil client.get_advertisements() dengan filter yang
// menjelaskan strateginya — pemesanan hanya butuh ID.
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // Harga yang disetujui bot, ditandatangani ke dalam permintaan.
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### Sebuah iklan menamai mint, bukan ticker

`asset_mint` adalah alamat mint Solana base58. Ticker adalah label yang dipilih
merchant, dan tak ada yang mengikatnya ke token yang benar-benar akan digerakkan
escrow — sebuah iklan bisa berkata «USDT» dan diselesaikan dalam sesuatu yang lain,
dengan tiap lapisan menyetujui transaksi selesai, karena masing-masing melakukan
tepat yang diminta.

Anda tak pernah menyuplai simbol. Node me-resolve satu dari mint dan
mengembalikannya di samping rekaman sebagai `asset_symbol`, yang `null` untuk mint
yang tak punya nama baginya. Tampilkan alamat dalam kasus itu; alamat tanpa julukan
tak berguna dan benar, dan tebakan berguna dan salah.

### Sebuah pemesanan menyematkan harga yang disetujuinya

`agreed_price` ditandatangani ke dalam permintaan, dan node memeriksa bahwa ia
mengikuti syarat iklan itu sendiri — menolak dengan `PRICE_DISAGREEMENT` bila
tidak. Itulah yang menghentikan seorang merchant menetapkan harga ulang antara
kuotasi yang dibaca bot dan escrow yang dikuncinya.

Iklan ini `Fixed`, jadi harga yang disetujui sekadar yang diiklankannya dan tak ada
mid untuk dicatat. Terhadap sebuah `Floating`, sebuah bot membaca keduanya dari
`quote` pada `getAdvertisement` dan meneruskan `agreed_mid` juga — itu yang
memungkinkan node menurunkan ulang angka yang sama dari observasi oracle yang sama
alih-alih miliknya sendiri, yang bisa berbeda.

`getReservation` adalah baca terbuka, tak terautentikasi, jadi yang kembali adalah
[tampilan tersunting](../api/trade-privacy.md): keadaan, jumlah, dan iklan ada di
sana, peminta tidak. Sebuah bot yang butuh pemesanannya sendiri secara penuh —
termasuk bidang pihak — membacanya dengan [bukti dompet](../api/wallet-proof-reads.md)
sebagai gantinya.

## TypeScript

Sumber lengkap: [`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
(`pnpm tsx examples/trading_bot.ts` dari `openfiat-sdks/typescript`).

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// Diikat sekali: pemesanan di bawah harus setuju dengannya secara tepat.
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

// Bot nyata malah akan memanggil advertisements.getAdvertisements(client, {…})
// dengan filter yang menjelaskan strateginya — pemesanan hanya butuh ID.
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

## Membaca buku pesanan

`getAdvertisements` mengambil filter dan kursor dan menjawab dengan satu halaman:
`{ advertisements, next_cursor }`. Dulu ia menjawab dengan larik telanjang tiap
iklan di jaringan, dari panggilan yang tak mengambil parameter — respons yang
tumbuh tanpa batas di atas buku yang tak bisa dicari siapa pun.

Persempit di **permintaan**. Menyaring sebuah halaman setelah tiba tak sekadar
membuang transfer: batas halaman diputuskan di atas baris yang lalu Anda buang,
jadi kursor tak lagi berarti yang Anda kira.

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` adalah union terdiskriminasi, dan tiga kasusnya adalah tiga janji
    // berbeda. `Fixed` bergerak hanya ketika merchant menandatangani yang baru;
    // `Floating` berlaku hingga `mid_expires_at` dan bisa bergerak sebelumnya;
    // `Unpriceable` berarti iklan ada dan tanpa harga saat ini. Membaca `price`
    // darinya tanpa mempersempit akan merender iklan tak-berharga sebagai gratis.
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

Teruskan `next_cursor` kembali **apa adanya**. Ia kebetulan adalah id iklan, dan ia
tetap bukan yang direkonstruksi dari baris terakhir yang Anda terima: melakukannya
berarti mengimplementasikan ulang pengurutan node, dan pembaca yang pengurutannya
tak sepakat diserahkan sebagian baris dua kali dan lainnya tak pernah, tanpa apa
pun yang menunjukkannya. Berhenti ketika kursor `null`, bukan ketika sebuah halaman
kosong — halaman penuh tak membuktikan yang lain ada, jadi node bisa mengembalikan
kursor tanpa apa pun di baliknya.
