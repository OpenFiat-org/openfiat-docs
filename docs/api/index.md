---
title: API
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
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "merchant": "...", "status": "Active", "..." : "..." } }
```

## Method naming

Read methods start with `get` and never mutate state:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

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
| Advertisements | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate` |
| Reservations | `getReservation`, `getReservations`, `sendReservationRequest` |
| Settlement | `getSettlement`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Trade (read-only join) | `getTrade`, `getTrades` |
| Disputes | `getDispute`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Identity | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Reputation (read-only) | `getReputation` |
| Governance | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Service providers | `getProvider`, `getProviders`, `sendProviderRegister` |
| Notifications | `getSubscription`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oracles | `getOracleRecord`, `getMedianExchangeRate`, `sendOraclePublish` |
| Risk intelligence | `getWalletScreening`, `sendRiskPublish` |
| Snapshots | `getLatestSnapshot`, `getCheckpointHeight`, `sendSnapshotAnnounce` |
| Sessions | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Node | `getVersion`, `getHealth` |

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

## Live reference

Every running node also serves this same reference live:

- `GET /openrpc.json` — an [OpenRPC](https://open-rpc.org) 1.2.6 document (the JSON-RPC equivalent of an OpenAPI/Swagger spec), generated directly from the node's own dispatch table so it can never drift from what the node actually runs.
- `GET /docs` — a self-contained interactive reference page: browse every method's shape and run it live against that node.

`GET /metrics` exposes Prometheus-format request counters for operators.
