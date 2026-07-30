---
title: What a public read returns
sidebar_position: 3
---

# What a public read returns

`getSettlement`, `getSettlements`, `getReservation`, `getReservations`,
`getDispute` and `getDisputes` are open, unauthenticated reads and they no
longer return party identity. A party reads its own records in full through
the [wallet-proof methods](./wallet-proof-reads.md).

## Why redaction rather than authentication

An explorer showing settlement volume, states and timing is a legitimate
public view of a public network. Putting a signature in front of it would
break that while pushing anyone determined back to raw gossip, which achieves
nothing. What the explorer never needed is *who* — so the public read keeps
everything except identity.

The thing identity assembles is the trade graph, and the case against handing
it out is made in full on the [wallet-proof reads](./wallet-proof-reads.md)
page: in a peer-to-peer fiat market, knowing which merchant a wallet always
returns to and who a busy merchant's regulars are is a physical-safety
question rather than a preference. One unauthenticated call used to
reconstruct it.

## What this is honestly worth

These records are gossiped to every node. Anyone running one reads them all,
and redaction does not change that. What is protected is the *ease* of the
query — the difference between `curl`-ing somebody else's public access node
and standing up a node to index the network. That difference is most of what
casual harvesting is made of.

Stating that plainly matters more than it might seem: an integrator who
believes these records are confidential will build something that leans on a
guarantee the protocol does not make.

## The shapes

### Settlement

| Kept | Removed |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` stays because it names an on-chain transaction
anyone can already read on Solana, and it is what makes a settlement
independently checkable.

`payment_reference` is arguably the worse of the two removals: it is free text
a buyer puts their own bank reference in, so it routinely carries a real name
or an account number.

### Reservation

| Kept | Removed |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` is kept deliberately. An advertisement is a public offer
and already carries its merchant's peer id on every order-book row, so it
discloses one end of an edge that was never private. What it does not disclose
is the other end — which is what makes it an edge.

### Dispute

| Kept | Removed |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`, `seller`, `opener` and their keys |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`, `reveals` (counts) | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | the individual commitments and reveals |
| `opened_at`, `updated_at` | the mutual-settlement agreement flags |

Note that `commitments` and `reveals` are **counts** here, not lists — enough
for an explorer to show a case progressing, with nobody's vote attached to
their name.

Three separate reasons for what is dropped. The parties, because a dispute is
the case where knowing who fell out with whom is most obviously worth
misusing. `reason`, because it is free text about a real disagreement over
real money and names people, banks and references as a matter of course. The
arbitrator lists, because an arbitrator is a registered provider whose
identity is not itself a secret — but *which arbitrator drew which case, and
how they voted* is exactly the pairing that makes pressuring one worthwhile.
The mutual-settlement flags go with them: "the seller has agreed and the buyer
has not" is a negotiating position, and publishing it to onlookers changes a
negotiation between two people.

## If you are adding a field

A field belongs in a public view only if it says something about the *trade*
rather than about the *people*. When in doubt it stays out: adding one later
is a release note, and removing one is a disclosure that already happened.
