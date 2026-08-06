---
title: एक ऑरेकल प्रदाता पंजीकृत करें
---

# एक ऑरेकल प्रदाता पंजीकृत करें

एक नोड की सेवा रजिस्ट्री (OFS-1500) में एक ऑरेकल प्रदाता के रूप में पंजीकृत करें,
फिर एक हस्ताक्षरित विनिमय-दर रिकॉर्ड (OFS-7000) प्रकाशित करें। किसी जोड़ी के लिए
हर प्रदाता में मध्यमान दर वही है जिसे फ्लोटिंग-प्राइस विज्ञापन संदर्भित करते हैं।

पहले एक स्थानीय नोड शुरू करें:

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

पूर्ण स्रोत: [`examples/oracle_provider.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/oracle_provider.rs)
(`openfiat-sdks/rust` से `cargo run --example oracle_provider`)।

```rust
let keypair = Keypair::generate();
let provider = peer_id(&keypair);

let registration = Registration {
    service_id: ServiceId::new("my-oracle"),
    service_type: ServiceType::MarketData(MarketDataService::FxOracle),
    provider: provider.clone(),
    provider_public_key: keypair.public_key(),
    endpoints: vec!["/ip4/127.0.0.1/udp/4001/quic-v1".to_string()],
    supported_ofs: vec![1500, 7000],
    region: Some("Kenya".to_string()),
    capabilities: vec!["USDC/KES".to_string()],
    pricing: None,
    timestamp: Timestamp::now(),
};
let service_id = client.send_provider_register(registration, &keypair).await?;

let now = Timestamp::now();
let publish = OraclePublish {
    id: OracleId::new("usdc-kes"),
    provider,
    provider_public_key: keypair.public_key(),
    data: OracleData::ExchangeRate { base: "USDC".to_string(), quote: "KES".to_string(), rate: 129.52 },
    version: 1,
    timestamp: now,
    expires_at: Timestamp::from_millis(now.as_millis() + 60_000),
};
let oracle_id = client.send_oracle_publish(publish, &keypair).await?;

let median = client.get_median_exchange_rate("USDC", "KES").await?;
println!("median rate: {:?}", median);
```

## TypeScript

पूर्ण स्रोत: [`examples/oracle_provider.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/oracle_provider.ts)
(`openfiat-sdks/typescript` से `pnpm tsx examples/oracle_provider.ts`)।

```typescript
const keypair = await generateKeypair();
const peerId = peerIdFromPublicKey(keypair.publicKey);

const registration: Registration = {
  service_id: "my-oracle",
  service_type: { MarketData: "FxOracle" },
  provider: toBytes(peerId),
  provider_public_key: toBytes(keypair.publicKey),
  endpoints: ["/ip4/127.0.0.1/udp/4001/quic-v1"],
  supported_ofs: [1500, 7000],
  region: "Kenya",
  capabilities: ["USDC/KES"],
  pricing: null,
  timestamp: Date.now(),
};
const serviceId = await providers.sendProviderRegister(client, registration, keypair);

const now = Date.now();
const publish: OraclePublish = {
  id: "usdc-kes",
  provider: toBytes(peerId),
  provider_public_key: toBytes(keypair.publicKey),
  data: { ExchangeRate: { base: "USDC", quote: "KES", rate: 129.52 } },
  version: 1,
  timestamp: now,
  expires_at: now + 60_000,
};
const oracleId = await oracles.sendOraclePublish(client, publish, keypair);

const median = await oracles.getMedianExchangeRate(client, "USDC", "KES");
console.log(`median rate: ${median}`);
```
