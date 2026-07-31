---
title: API
sidebar_position: 1
---

# API

Every OpenFiat node exposes one JSON-RPC 2.0 endpoint modeled directly on
Solana's own JSON-RPC API — `getX`/`sendX` camelCase method names over a
single POST endpoint, rather than a REST resource hierarchy. It's
implemented by the `rpc` and `api` crates in
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## Endpoint

```
POST /rpc
Content-Type: application/json
```

Every request is a standard JSON-RPC 2.0 envelope:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

and every response is either a `result` or an `error`, never both:

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

The public devnet node is at `https://openfiat.allenhark.com` — the same host
also publishes an entrypoint multiaddr for *nodes*, which is a different
address for a different job (see
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
Any node you run yourself serves the identical surface on `:7080`.

## Method naming

Read methods start with `get` and never mutate state:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

A `getMyX` method is still a read, but it answers only for the wallet the
caller proves they hold — see [Wallet-proof reads](./wallet-proof-reads.md).

Mutations start with `send` and take one field — `data`, a base64-encoded,
**already-signed** wire payload the caller's own wallet produced locally.
This mirrors Solana's `sendTransaction`: the node never constructs or signs
anything on the caller's behalf, it only decodes the payload and applies it
through the same signature-verification path a gossip-received event goes
through.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

Each [SDK](../sdks)'s typed `Client` builds and signs that payload for you —
it's the recommended integration point rather than constructing the wire
format by hand.

## Method categories

| Domain | Example methods |
| --- | --- |
| Advertisements | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| Reservations | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| Settlement | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Trade (read-only join) | `getTrade`, `getTrades` |
| Disputes | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Wallet proofs | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| Volume | `getSettledVolume` |
| Attachments and content | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| Identity | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Reputation (read-only) | `getReputation` |
| Governance | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Service providers | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| Notifications | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oracles | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| Risk intelligence | `getWalletScreening`, `sendRiskPublish` |
| Rewards | `getRewardObservations` |
| Snapshots | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| Sessions | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Chain bridge (Solana, OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| Node | `getVersion`, `getHealth`, `getPeers` |

## Reads that do not name the parties

`getSettlement(s)`, `getReservation(s)` and `getDispute(s)` return records
with party identity removed. That is a deliberate, security-motivated change
rather than an oversight, and it has a page of its own:
[what a public read returns](./trade-privacy.md). A party reads its own
records in full via [wallet-proof reads](./wallet-proof-reads.md).

## Disputes are decided on chain, not by the node answering you

A `getDispute` response carries the reveals a node has collected, and it
does **not** carry an outcome derived from them. A resolution appears only
once this node has observed the executing transaction confirm and read what
it decided — see [how a dispute resolves](./dispute-resolution.md). A
client that tallies the reveals itself has reintroduced exactly the
divergence the node stopped producing.

## Two exchange-rate methods, and which to reach for

`getMedianExchangeRate` returns a bare number or `null`, which is the right
shape when all you want is a price or nothing.

`getExchangeRate` takes the same `{ base, quote }` and answers with a tagged
status instead, because `null` collapses two different facts:

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

The distinction is not academic. **Stale** means a provider does publish this
pair and every record has expired (OFS-7000 §12: expired data is not current
data, however recently it lapsed) — the feed will likely come back, so waiting
is sensible. **NoData** means nobody prices this corridor at all and waiting
is pointless. Neither is a number, and a caller must show neither as one.

Reach for `getExchangeRate` unless you have a reason not to. `getMedianExchangeRate`
stays because clients depend on it.

## What a node knows about the network

`getPeers` reports the peers this node has discovered, the addresses it
announces about itself, and its own `self_peer_id` in the `12D3Koo…` form that
goes in an `--entrypoint`. See
[peer discovery](../node-operators/peer-discovery.md) for the operator's view
of it.

## Errors

Standard JSON-RPC 2.0 error codes (`-32700` parse error, `-32601` method not
found, `-32602` invalid params, `-32603` internal error) cover transport-
level failures. Every domain failure — insufficient liquidity, a duplicate
event, an unauthorized signer — comes back as a single `-32000` application
error, with the protocol's own numeric code and symbolic name (from
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) in `data`:

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## Subscriptions

```
GET /ws
```

streams every successful mutation as it happens — `{"method": "sendX", "result": ...}` — so a client can react to marketplace activity without polling. Filter client-side for the methods you care about.

## Snapshots are tagged by slot, not by a height

`getCheckpointSlot` returns the Solana slot the last imported snapshot's
state was current as of, or `null` on a node that has imported none.

It was `getCheckpointHeight`, and the rename is not cosmetic. The old value
was the *producing node's own count of gossip events*, which is
per-producer: two nodes holding identical state report different numbers,
and a node that joined last week reports a lower one than a node running
since genesis. Comparing two producers' numbers compared nothing.

A slot is the one clock every participant already shares. It also makes a
claim **checkable** — a node can compare an announced slot against its own
view of the chain and refuse one from an implausible future, which is
impossible against a number only the announcer can see.

**What a slot asserts is narrower than it looks.** It says *when* the state
was captured, not *what* it contains: two nodes snapshotting at the same
slot may hold slightly different gossip state, because propagation is not
instant. Treat it as a recency anchor, not a proof that one snapshot
contains another — the same thing Solana's own snapshots mean by it.

A node that has never observed a slot produces no snapshots and says so.
That is not a requirement to run an RPC connection: a gossip-only node
learns slots over the chain bridge.

## Settled volume, and why it is per asset

`getSettledVolume` answers with one row per asset, never a total:

```json
{
  "assets": [
    { "asset_mint": "2bHPi…RRU", "asset_symbol": "USDC", "decimals": 6,
      "base_units": 4500000, "settlements": 12 },
    { "asset_mint": "So111…112", "asset_symbol": "wSOL", "decimals": 9,
      "base_units": 2000000000, "settlements": 3 }
  ],
  "unattributed_settlements": 1,
  "settlements_known": 16,
  "scope": "settlements this node has replicated and observed confirmed"
}
```

Four things a client must not do with this:

**Do not sum across assets.** They are different tokens at different
scales; a combined figure adds SOL to USDC and means nothing.

**Do not guess `decimals`.** It is `null`, alongside a `null`
`asset_symbol`, when this node has no name for that mint. Show the address
and the raw base units. Assuming `6` is exactly how wSOL — which has nine —
comes out a thousand times too large.

**Do not hide `unattributed_settlements`.** Those are real confirmed
settlements whose advertisement has since been deleted, so their asset is
unrecoverable. Omitting them makes the totals look complete when they are
short by that many.

**Do not drop `scope`.** It says these are the settlements *this node*
replicated and confirmed — not the network's whole history. A volume figure
presented without its scope reads as a global total. `settlements_known`
beside the counted rows makes the remainder read as trades in flight rather
than as a discrepancy.

## Interactive reference

**[Browse every method →](pathname:///api/reference.html)**

An [OpenRPC](https://open-rpc.org) 1.2.6 document (the JSON-RPC equivalent
of an OpenAPI/Swagger spec) — [`/api/openrpc.json`](pathname:///api/openrpc.json) —
plus a self-contained interactive page for browsing every method. The method
*list* is generated directly from `openfiat-rpc`'s own live dispatch table
(`cargo run -p openfiat-api --example dump_openrpc`), so it cannot drift onto
a method a real node does not run; it is published here as a static snapshot
since this docs site has no node of its own to serve it live. Point the
reference page's "Try it" panel at a node you're running yourself (defaults to
`http://localhost:7080`) to call a method for real.

Per-method **schemas** in that document are a deliberately simplified,
convention-based approximation — every `getX(id)` takes `{id}`, every `sendX`
takes `{data}` — rather than JSON Schema derived from each method's concrete
Rust types. Where a method departs from those conventions, this site is the
authoritative shape: the [wallet-proof reads](./wallet-proof-reads.md),
`getExchangeRate`, and `getPeers` all take parameters the convention does not
describe.

A running node also serves the identical reference live and same-origin
with its own `/rpc`: `GET /openrpc.json` and `GET /docs`. `GET /metrics`
exposes Prometheus-format request counters for operators.
