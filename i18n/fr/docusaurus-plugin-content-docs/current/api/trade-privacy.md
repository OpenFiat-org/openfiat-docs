---
title: Ce que renvoie une lecture publique
sidebar_position: 3
---

# Ce que renvoie une lecture publique

`getSettlement`, `getSettlements`, `getReservation`, `getReservations`,
`getDispute` et `getDisputes` sont des lectures ouvertes, non authentifiées, et
elles ne renvoient plus l’identité des parties. Une partie lit ses propres
enregistrements en entier via les
[méthodes avec preuve de portefeuille](./wallet-proof-reads.md).

## Pourquoi la rédaction plutôt que l’authentification

Un explorateur montrant le volume, les états et le calendrier des liquidations
est une vue publique légitime d’un réseau public. Placer une signature devant le
casserait tout en repoussant tout obstiné vers le gossip brut, ce qui n’aboutit
à rien. Ce dont l’explorateur n’a jamais eu besoin, c’est *qui* — la lecture
publique conserve donc tout sauf l’identité.

Ce que l’identité assemble, c’est le graphe des échanges, et l’argument contre sa
divulgation est développé en entier sur la page
[lectures avec preuve de portefeuille](./wallet-proof-reads.md) : sur un marché
fiat pair-à-pair, savoir à quel commerçant un portefeuille revient toujours et
qui sont les habitués d’un commerçant actif est une question de sécurité
physique, pas une préférence. Un seul appel non authentifié servait à le
reconstruire.

## Ce que cela vaut honnêtement

Ces enregistrements sont diffusés par gossip à chaque nœud. Quiconque en exécute
un les lit tous, et la rédaction n’y change rien. Ce qui est protégé, c’est la
*facilité* de la requête — la différence entre faire un `curl` sur le nœud
d’accès public de quelqu’un d’autre et monter un nœud pour indexer le réseau.
Cette différence est l’essentiel de ce dont la moisson occasionnelle est faite.

Le dire clairement importe plus qu’il n’y paraît : un intégrateur qui croit ces
enregistrements confidentiels construira quelque chose qui s’appuie sur une
garantie que le protocole ne donne pas.

## Les formes

### Settlement

| Conservé | Retiré |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` demeure car elle nomme une transaction on-chain que
n’importe qui peut déjà lire sur Solana, et c’est ce qui rend une liquidation
vérifiable de façon indépendante.

`payment_reference` est sans doute la pire des deux suppressions : c’est du texte
libre où un acheteur met sa propre référence bancaire, il porte donc
couramment un vrai nom ou un numéro de compte.

### Reservation

| Conservé | Retiré |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` est conservé délibérément. Une annonce est une offre publique
et porte déjà le peer id de son commerçant sur chaque ligne du carnet d’ordres,
elle divulgue donc un bout d’une arête qui n’a jamais été privée. Ce qu’elle ne
divulgue pas, c’est l’autre bout — ce qui en fait une arête.

### Dispute

| Conservé | Retiré |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`, `seller`, `opener` et leurs clés |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`, `reveals` (décomptes) | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | les engagements et révélations individuels |
| `opened_at`, `updated_at` | les indicateurs d’accord mutuel |

Notez qu’ici `commitments` et `reveals` sont des **décomptes**, pas des listes —
assez pour qu’un explorateur montre un dossier qui progresse, sans le vote de
personne lié à son nom.

Trois raisons distinctes pour ce qui est écarté. Les parties, car un litige est
le cas où savoir qui s’est brouillé avec qui est le plus manifestement digne
d’être détourné. `reason`, car c’est du texte libre sur un désaccord réel autour
d’argent réel et nomme des personnes, des banques et des références par défaut.
Les listes d’arbitres, car un arbitre est un fournisseur enregistré dont
l’identité n’est pas en soi un secret — mais *quel arbitre a tiré quel dossier,
et comment il a voté* est exactement l’appariement qui rend le fait d’en presser
un digne d’effort. Les indicateurs d’accord mutuel les accompagnent : « le
vendeur a accepté et l’acheteur non » est une position de négociation, et la
publier à des spectateurs change une négociation entre deux personnes.

## Si vous ajoutez un champ

Un champ n’a sa place dans une vue publique que s’il dit quelque chose sur
l’*échange* plutôt que sur les *personnes*. En cas de doute il reste dehors : en
ajouter un plus tard est une note de version, et en retirer un est une
divulgation qui a déjà eu lieu.
