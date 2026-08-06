---
title: Operator node
sidebar_position: 1
---

# Operator node

Operator node adalah tulang punggung jaringan OpenFiat — mereka menjalankan biner
rujukan [`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core) dan
berpartisipasi dalam penemuan peer, gossip, penyajian konten, dan registri layanan.

## Apa yang dilakukan sebuah node tanpa konfigurasi sama sekali

`openfiat-node` dikonfigurasi sepenuhnya oleh flag baris perintah — tak ada
cadangan variabel lingkungan dan tak ada berkas konfigurasi, dengan sengaja, agar
`systemctl cat openfiat-node` menampilkan tepat apa yang diberikan ke node yang
berjalan alih-alih mengirim Anda ke latihan arkeologi lintas profil shell dan
berkas unit. `openfiat-node --help` adalah seluruh permukaannya.

Jalankan tanpa menyetel apa pun dan ia sudah:

- menghasilkan atau memuat identitasnya (sebuah `wallet.json` format CLI Solana)
  dan memakai satu kunci itu sebagai kunci penandatanganan Solana-nya dan peer id
  libp2p-nya sekaligus;
- menyajikan JSON-RPC, WebSocket, dan REST di `0.0.0.0:7080`;
- mendengarkan peer di `/ip4/0.0.0.0/udp/4001/quic-v1`, mengumumkan alamat tempat
  ia terjangkau, dan belajar peer yang tak pernah diberikan padanya — lihat
  [Penemuan peer](./peer-discovery);
- menahan konten yang dirujuk rekaman protokol dan menyajikannya lewat bitswap di
  identitas libp2p-nya sendiri — lihat [Penyajian konten](./content-serving);
- menyimpan konten itu selama 30 hari bergulir (`--retention`), jadi menjalankan
  sebuah node adalah komitmen penyimpanan yang terbatas alih-alih tak berujung.

Dua hal yang *tidak* dilakukannya tanpa diminta: berbicara dengan Solana
(`--solana-rpc-url` memindahkannya dari `GossipOnly` ke `RpcConnected`) dan
memproduksi snapshot untuk yang lain (`--snapshot-public-url`). Keduanya opsional
karena keduanya membuat klaim kepada sisa jaringan yang hanya bisa dijamin
operator.

## Apa yang opsional, dan biayanya

| Untuk menonaktifkan | Lakukan ini | Apa yang Anda relakan |
| --- | --- | --- |
| Konektivitas Solana | hilangkan `--solana-rpc-url` | Node tetap `GossipOnly`: jawaban on-chain datang bekas lewat gossip dan bisa tertinggal. Ia masih menyajikan pasar dan merelai transaksi ke peer yang terhubung RPC, dan memperoleh porsi konektivitas yang dikurangi. |
| Penyajian konten | `--no-content-serving` | Node tak menyimpan konten lampiran dan tak bisa menjawab tantangan keterambilan, jadi memperoleh porsi yang dikurangi. Ia masih menantang peer-nya. |
| Memproduksi snapshot | hilangkan `--snapshot-public-url` | Tak seorang pun bisa bootstrap dari node ini. *Mengonsumsi* snapshot tak butuh konfigurasi. |
| Penemuan peer | tak mungkin | Ia bukan flag. Node yang tak mengumumkan alamat dan tak belajar peer akan tampak sehat bagi tiap pemeriksaan lokal sementara tak berbicara dengan siapa pun. |

## Melangkah lebih jauh

- **Panduan operator lengkap** — [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)
  di `openfiat-core`: membangun, tiap flag dengan bawaan aslinya, entrypoint devnet
  publik, menaruh TLS dan nginx di depan node, dan id program on-chain.
- **Deployment** — [openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  untuk image Docker, chart Helm Kubernetes, dan modul Terraform;
  `packaging/systemd` dan `packaging/windows` di `openfiat-core` untuk menjalankan
  biner langsung sebagai layanan.
- **Jaringan uji lokal** — [openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  (`testnet/`, `devnet/`).
- **Reputasi dan QoS berbobot stake** — OFS-1600 di
  [Spesifikasi protokol](../protocol-specs).
