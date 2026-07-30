---
title: Wallet-proof reads
sidebar_position: 2
---

# Wallet-proof reads

Nearly every read on a node's [JSON-RPC surface](./index.md) is open, because
what it returns is already replicated to every node. A handful are not, and
the line between them is not "is this secret" — nothing here is secret — but
"does answering this to a stranger assemble something the protocol
deliberately leaves scattered".

## The thing being protected is the trade graph

An endpoint that answers *who does this wallet trade with, and how often*
hands anyone a map of real trading relationships: which merchant a wallet
always returns to, who a busy merchant's regulars are, and therefore who is
worth following home. In a peer-to-peer fiat market that is a physical-safety
question rather than a preference.

That argument was made once and enforced in one method
(`getCounterparties`), while the same graph stayed available through
`getSettlements`, `getReservations` and `getDisputes` — none of which took a
parameter, and all of which returned every record on the network with both
parties named and keyed. The gate was not weak; it was walked around. It was
also three methods rather than one: a reservation names the buyer and its
advertisement names the merchant, so the same edge was available a step
earlier, including for trades that never settled.

So the public reads are now [redacted](./trade-privacy.md), and a party reads
its own records in full by proving it holds the wallet.

## The handshake

There are no accounts in this protocol, so "is this really you?" can only be
answered by asking the caller to sign something they could not have signed in
advance.

### 1. Ask for a nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

Issuing is deliberately open. A nonce is worthless without the private key
that signs it, and demanding a signature to obtain the thing you sign would be
circular; the response confirms nothing about the wallet, not even that it
exists. Challenges live in memory only and expire after five minutes — long
enough for a human to read and approve a wallet prompt, short enough that an
unspent nonce is not left lying around.

`getCounterpartiesChallenge` and `getProviderEarningsChallenge` are the same
issuer under different names. One nonce answers exactly one call, whichever
surface it is spent on.

### 2. Sign the challenge

The bytes to sign are the UTF-8 string:

```
<domain>:<subject>:<nonce>
```

`subject` is the canonical base64 peer id the challenge came back with, not
whichever base64 spelling you happened to send. `domain` is fixed per method:

| Method | Domain |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

The domain separator is why a signature collected for one gated surface cannot
be presented on another, even though both identify their subject the same way
and draw nonces from the same ledger.

### 3. Call the method

```json
{
  "method": "getMySettlements",
  "params": {
    "wallet": "<base64 PeerId>",
    "public_key": "<base64 raw 32-byte Ed25519 public key>",
    "nonce": "<the nonce from step 1>",
    "signature": "<base64 64-byte Ed25519 signature>"
  }
}
```

`getMyReservations`, `getMyDisputes` and `getCounterparties` take exactly the
same four fields. The public key is sent explicitly rather than recovered from
`wallet`, so the identity claim is something the caller states and the node
checks, not something the node infers on the caller's behalf — it must derive
to exactly the wallet being asked about.

What comes back is unredacted, and only for records the wallet is party to.
`getMyDisputes` also answers a seated arbitrator, because reading the whole
case is their job.

## Details that matter if you are implementing this

**Refusal, not narrowing.** A caller who cannot prove the wallet gets an
error, never a filtered answer. A filtering implementation looks identical in
every passing test right up until a refactor drops the filter; a refusal fails
loudly and immediately.

**Order of checks.** The key-derivation check happens first, before the nonce
is touched, so a stranger's failed attempt cannot spend the nonce its real
owner is part-way through signing. The nonce is then consumed *before* the
signature is verified, so presenting a captured signature burns the nonce
rather than replaying it.

**"Unknown" and "already spent" are the same error.** Distinguishing them
would confirm that some other party is mid-handshake for that subject.

**Nothing new is stored.** Outstanding challenges are in memory and answers
are folded on demand from records the node already replicates. A node operator
gains no record of who asked what — which matters, because the operator is
exactly the party this must not quietly build a dossier for.
