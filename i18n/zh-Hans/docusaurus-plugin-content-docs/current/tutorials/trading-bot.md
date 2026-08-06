---
title: 构建一个交易机器人
---

# 构建一个交易机器人

一个最小的交易机器人：一个商家发布一个卖出广告（OFS-2100），
然后一个独立的机器人身份发现它并对它开一个预约
（OFS-2200）。锁定托管在请求时自动完成——没有单独的
确认步骤。

请先启动一个本地节点：

```bash
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

## Rust

完整源代码：[`examples/trading_bot.rs`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/rust/examples/trading_bot.rs)
（在 `openfiat-sdks/rust` 中运行 `cargo run --example trading_bot`）。

```rust
let merchant = Keypair::generate();
let bot = Keypair::generate();

// 只绑定一次。下面的预约必须与它完全一致，而把这个数字写
// 两次，正是二者产生漂移的方式。
let advertised_price = Amount::new(12_950, 2);

let create = AdvertisementCreate {
    id: AdvertisementId::new("my-ad"),
    merchant: peer_id(&merchant),
    merchant_public_key: merchant.public_key(),
    // 一个 mint 地址，而非一个代号——见下文。
    asset_mint: MintAddress::parse("C4rSGhdxWhSFQuFcAxQti1JvBxriwHJoHtJjfhs5p24Y")?,
    direction: Direction::Sell,
    fiat_currency: FiatCurrency::parse("KES")?,
    // 以“资产”计价，而非以上面的法币计价。
    min_trade: Amount::new(1_000, 2),
    max_trade: Amount::new(50_000, 2),
    initial_liquidity: Amount::new(200_000, 2),
    pricing: PricingModel::Fixed { price: advertised_price },
    payment_methods: vec!["M-Pesa".to_string()],
    timestamp: Timestamp::now(),
};
let ad_id = client.send_advertisement_create(create, &merchant).await?;

// 一个真实的机器人会改为调用 client.get_advertisements()，附带一个
// 描述其策略的过滤器——预约只需要 ID。
let request = ReservationRequest {
    id: ReservationId::new("my-reservation"),
    advertisement_id: ad_id,
    requester: peer_id(&bot),
    requester_public_key: bot.public_key(),
    amount: Amount::new(5_000, 2),
    // 机器人所同意的价格，签入请求之中。
    agreed_price: advertised_price,
    agreed_mid: None,
    timestamp: Timestamp::now(),
};
let reservation_id = client.send_reservation_request(request, &bot).await?;

let reservation = client.get_reservation(reservation_id.as_str()).await?.unwrap();
println!("{:?}", reservation.state); // EscrowLocked
```

### 一个广告指名一个 mint，而非一个代号

`asset_mint` 是一个 base58 的 Solana mint 地址。一个代号是商家
所选的一个标签，没有任何东西把它绑定到托管实际会移动的那个
代币——一个广告可以说「USDT」而以别的东西结算，
每一层都同意交易已完成，因为每一层都恰好做了被
要求的事。

你从不提供符号。节点从 mint 解析出一个，并把它
连同记录一起作为 `asset_symbol` 返回，对于它没有名称的 mint 则为
`null`。那种情况下请显示地址；一个没有昵称的地址是
无用而真实的，而一个猜测是有用而虚假的。

### 一个预约固定它所同意的价格

`agreed_price` 被签入请求，节点会核对它是否由广告
自己的条款所推出——否则以 `PRICE_DISAGREEMENT` 拒绝。
那正是阻止一个商家在机器人读到的报价与它锁定的
托管之间重新定价的东西。

这个广告是 `Fixed`，因此所同意的价格就是它所
广告的价格，也没有可记录的 mid。对一个 `Floating` 广告，一个机器人
从 `getAdvertisement` 上的 `quote` 读取两者，并同样传入
`agreed_mid`——那正是让节点从同一次预言机观测、而非从它
自己（可能不同）的观测重新推出相同数字的东西。

`getReservation` 是一次开放、无需认证的读取，因此返回的东西是
[删节视图](../api/trade-privacy.md)：状态、金额和广告
在那里，请求者不在。一个需要其自己的预约的完整内容
——包括当事方字段——的机器人，会改用一个
[钱包证明](../api/wallet-proof-reads.md)来读取它们。

## TypeScript

完整源代码：[`examples/trading_bot.ts`](https://github.com/OpenFiat-org/openfiat-sdks/blob/main/typescript/examples/trading_bot.ts)
（在 `openfiat-sdks/typescript` 中运行 `pnpm tsx examples/trading_bot.ts`）。

```typescript
const merchant = await generateKeypair();
const bot = await generateKeypair();

// 只绑定一次：下面的预约必须与它完全一致。
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

// 一个真实的机器人会改为调用 advertisements.getAdvertisements(client, {…})，
// 附带一个描述其策略的过滤器——预约只需要 ID。
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

## 读取订单簿

`getAdvertisements` 取一个过滤器和一个游标，并以一页作答：
`{ advertisements, next_cursor }`。它曾经以一个包含网络上每个
广告的裸数组作答，来自一个不取参数的调用——一个在无人
能搜索的订单簿上无界增长的响应。

在**请求**中收窄。在一页到达之后再过滤它，不只是
浪费传输：页边界是在你随后丢弃的那些行之上决定的，
因此游标不再是你以为的意思。

```typescript
let cursor: string | null = null;
do {
  const page = await advertisements.getAdvertisements(client, {
    filter: { fiat_currency: "KES", direction: "Sell" },
    page: { after: cursor, limit: 25 },
  });
  for (const ad of page.advertisements) {
    // `quote` 是一个可辨识联合，三个情形是三个不同的
    // 承诺。`Fixed` 只在商家签署一个新的时才变动；
    // `Floating` 在 `mid_expires_at` 之前有效，且可能在那之前变动；
    // `Unpriceable` 意味着广告存在且此刻没有价格。
    // 不加收窄就从它读取 `price`，会把一个不可定价的
    // 广告渲染为免费。
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

**原样**把 `next_cursor` 传回。它碰巧是一个广告 id，
但它仍不是一个可从你收到的最后一行重构出来的东西：
那样做意味着重新实现节点的排序，而一个排序与之不一致的
读取者，会被交给一些行两次、另一些行永不出现，且没有任何
东西说明这一点。当游标为 `null` 时停止，而非当一页为空时——一个
满页并不证明还存在另一页，因此节点可能交回一个背后
空无一物的游标。
