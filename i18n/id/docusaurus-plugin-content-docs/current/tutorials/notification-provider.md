---
title: Daftarkan penyedia notifikasi
---

# Daftarkan penyedia notifikasi

Daftar ke Registri Layanan (OFS-1500) sebuah node sebagai penyedia notifikasi,
buat sebuah dompet berlangganan ke sebuah kategori, dan pelajari aturan yang
mengatur laporan pengiriman (OFS-6000).

:::warning Laporan pengiriman tidak swa-atestasi

Sebuah node menerima laporan hanya jika ia menahan rekaman dispatch yang cocok
**miliknya sendiri**. Jadi panduan ini berakhir dengan menyaksikan laporan yang
terbentuk baik dan ditandatangani dengan benar **ditolak** — karena node tak
pernah merutekan notifikasi yang dinamainya.

Itu bagian menariknya, dan alasan aturan ini ada: kompensasi dan reputasi penyedia
mengikuti volume yang dilaporkannya, jadi menerima id notifikasi sembarang akan
membiarkan gateway terdaftar mana pun memfabrikasi bukti pekerjaan yang tak diminta
siapa pun.

Memperoleh sebuah tanda terima butuh dispatch nyata, yang butuh langganan yang
membawa tujuan yang disegel ke gateway Anda. Penyegelan belum diekspos oleh SDK
mana pun, jadi jalur itu dijelaskan di sini alih-alih dilakukan.

:::

Mulai sebuah node lokal dulu:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

Sumber lengkap: [`examples/notification_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/notification_provider.rs)
(`cargo run --example notification_provider` dari `openfiat-sdks/rust`).

```rust
let provider = Keypair::generate();
let wallet = Keypair::generate();
let service_id = ServiceId::new("my-notification-provider");

let registration = Registration {
    service_id: service_id.clone(),
    service_type: ServiceType::Notifications(NotificationChannel::Webhook),
    provider: peer_id(&provider),
    provider_public_key: provider.public_key(),
    // Harus dapat di-resolve. Sebuah node menolak mendaftarkan endpoint di
    // domain cadangan (`.invalid`, `.example`, `.test`): registrasi yang
    // ditandatangani direplikasi ke tiap node dan ditawarkan ke pengguna sebagai
    // infrastruktur langsung, jadi alamat yang tak pernah bisa di-resolve bukan
    // placeholder tak berbahaya — ia layanan fabrikasi yang tak bisa dihapus
    // siapa pun.
    endpoints: vec!["https://notify.example.com/webhook".to_string()],
    supported_ofs: vec![1500, 6000],
    region: None,
    capabilities: vec!["Webhook".to_string()],
    pricing: None,
    // Wajib kapan pun `pricing` disetel — sebuah node menolak harga tanpa tempat
    // untuk dibayar. Layanan gratis membiarkan keduanya tak disetel.
    payout_wallet: None,
    timestamp: Timestamp::now(),
};
client.send_provider_register(registration, &provider).await?;

let update = SubscriptionUpdate {
    wallet: peer_id(&wallet),
    wallet_public_key: wallet.public_key(),
    enabled_categories: vec![NotificationCategory::Trading],
    // Kosong di sini, tapi bidang harus ada: node memverifikasi tanda tangan
    // terhadap serialisasi ulang struct ini, jadi menghilangkannya mengubah byte
    // yang di-hash dan pembaruan kembali sebagai INVALID_SIGNATURE alih-alih apa
    // pun tentang tujuan.
    destinations: Vec::new(),
    timestamp: Timestamp::now(),
};
client.send_subscription_update(update, &wallet).await?;

// Penyedia terdaftar, menandatangani dengan benar, melaporkan pengiriman untuk
// notifikasi yang tak pernah didispatch node ini. Ia ditolak, dan tak ada tanda
// terima ditulis.
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

Sumber lengkap: [`examples/notification_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/notification_provider.ts)
(`pnpm tsx examples/notification_provider.ts` dari `openfiat-sdks/typescript`).

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
  // Harus dapat di-resolve — domain cadangan ditolak saat registrasi.
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
  // Kosong, tapi ada: tanda tangan diverifikasi terhadap serialisasi ulang
  // struct ini, jadi menghilangkan bidang membuat byte berbeda dari yang
  // ditandatangani di sini dan pembaruan ditolak sebagai INVALID_SIGNATURE.
  destinations: [],
  timestamp: Date.now(),
};
await notifications.sendSubscriptionUpdate(client, update, wallet);

// Ditolak: node ini tak pernah mendispatch `notif-1`, jadi ia tak punya rekaman
// dispatch untuk memeriksa laporan.
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

## Apa yang diperiksa sebuah node, dan biayanya

`apply_delivery_report` membutuhkan sebuah `DispatchRecord` yang dibuat node ini
sendiri, lalu memeriksa silang layanan, penerima, dan pemicu laporan terhadapnya.
Tanpa satu, ia menjawab `RESOURCE_NOT_FOUND`.

Itu punya biaya nyata dan disengaja: **sebuah node yang tak pernah merutekan
notifikasi tertentu menjatuhkan laporan yang tak bisa diperiksanya**, bahkan yang
benar. Itu dapat dipulihkan — node yang *merutekannya* tetap menerima dan
mem-gossip laporan, dan dispatch bersifat deterministik, jadi dalam keadaan mantap
itu adalah tiap node. Menerima klaim yang tak dapat diperiksa tak dapat dipulihkan:
ia menulis pernyataan yang tak dapat diverifikasi ke keadaan tereplikasi secara
permanen.
