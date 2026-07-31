---
title: How a dispute resolves
---

# How a dispute resolves

A dispute has two halves, and only one of them decides anything.

The **off-chain layer** collects. It verifies each arbitrator's signature,
checks a reveal against that arbitrator's earlier commitment, refuses a
reveal from a wallet that never committed, discards duplicates, and
replicates the result so every node sees the same evidence.

The **chain** decides. It tallies the revealed votes under its own rules —
stake-weighted, with a counted-vote floor, re-opening a round on a tie
rather than breaking it — and it moves the escrow.

## The off-chain layer does not tally

It used to. `getDispute` would return a resolution derived from the reveals
a node had seen, and that was wrong in a way worth understanding, because
it is a mistake that looks like helpfulness.

**Two tallies of the same votes are a divergence generator, not a second
opinion.** The chain re-arbitrates under different rules, so it can reach a
different answer about the same dispute — and when it does, the interface
shows one outcome while the money follows the other. The chain is the
authority over the escrow, so the off-chain answer is not a second opinion:
it is a statement the protocol makes and then contradicts with its own
funds.

So `resolution` is set by exactly one thing: an executing transaction this
node has independently observed confirm, whose outcome it then read from
the case account on chain.

## `AwaitingChainExecution` is a real answer

When every required reveal is in, the case sits in
`AwaitingChainExecution`. That state says the off-chain layer has finished
its work and the escrow has not moved yet. It is not "resolved pending
execution" — that phrasing would claim an outcome the node is not entitled
to name.

A node that saw a transaction land but could not read what it decided
**stays** in `AwaitingChainExecution` and records the signature it
observed. Something happened on chain and this node does not yet know what;
saying so is the honest answer, and inventing a verdict to fill the gap is
the exact failure this rule removes.

## Party agreement is not an exception

Both parties can agree a mutual settlement, and the off-chain layer
verifies both signatures directly. It records that agreement as soon as it
has it — that is a real fact about the case, and withholding it would hide
the parties' own decision from them.

But recording an agreement is not recording a resolution. Until the escrow
has actually moved, the case is `AwaitingChainExecution` like any other.

This one is easy to get wrong, because unlike a ruling there is no
computation two nodes could perform differently — the agreement simply *is*
the two signatures. It still has to wait, for two reasons:

- **Signatures do not move money.** A case marked `MutualSettlement` while
  the funds sit locked tells both parties the dispute is over and paid when
  neither is true.
- **The chain executes on its own deadlines.** It remains free to execute an
  arbitrated outcome on a case whose parties agreed privately and never
  relayed it — putting the two layers back into contradiction about a single
  dispute, which is what this whole rule exists to prevent.

## What a client should show

| Node says | Show |
| --- | --- |
| `resolution: null`, status `AwaitingChainExecution` | The case is decided or agreed; the escrow has not moved yet |
| `resolution` set, with an execution signature | The outcome, and the transaction it came from |
| Reveals collected, no status change | Evidence gathering; no outcome exists to display |

Do not derive an outcome from the reveals in a `getDispute` response. They
are there so anyone can audit what the chain was given, not so a client can
reach its own verdict — a client that tallies them has reintroduced exactly
the divergence the node stopped producing.

See OFS-2400 §16.2 and §17 for the normative statement.
