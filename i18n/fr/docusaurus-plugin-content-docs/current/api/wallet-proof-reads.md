---
title: Lectures avec preuve de portefeuille
sidebar_position: 2
---

# Lectures avec preuve de portefeuille

Presque toute lecture sur la [surface JSON-RPC](./index.md) d’un nœud est
ouverte, car ce qu’elle renvoie est déjà répliqué sur chaque nœud. Une poignée ne
l’est pas, et la ligne entre elles n’est pas « est-ce secret » — rien ici n’est
secret — mais « répondre ceci à un inconnu assemble-t-il quelque chose que le
protocole laisse délibérément éparpillé ».

## La chose protégée est le graphe des échanges

Un endpoint qui répond *avec qui ce portefeuille échange, et à quelle fréquence*
remet à quiconque une carte de relations d’échange réelles : à quel commerçant un
portefeuille revient toujours, qui sont les habitués d’un commerçant actif, et
donc qui vaut la peine d’être suivi jusque chez lui. Sur un marché fiat
pair-à-pair, c’est une question de sécurité physique, pas une préférence.

Cet argument a été fait une fois et appliqué dans une méthode
(`getCounterparties`), tandis que le même graphe restait disponible via
`getSettlements`, `getReservations` et `getDisputes` — dont aucune ne prenait de
paramètre, et qui renvoyaient toutes chaque enregistrement du réseau avec les
deux parties nommées et à clé. La porte n’était pas faible ; on l’a contournée.
C’étaient aussi trois méthodes au lieu d’une : une réservation nomme l’acheteur
et son annonce nomme le commerçant, donc la même arête était disponible un pas
plus tôt, y compris pour des échanges qui n’ont jamais été réglés.

Les lectures publiques sont donc désormais [rédigées](./trade-privacy.md), et une
partie lit ses propres enregistrements en entier en prouvant qu’elle détient le
portefeuille.

## La poignée de main

Il n’y a pas de comptes dans ce protocole, donc « est-ce vraiment vous ? » ne peut
recevoir de réponse qu’en demandant à l’appelant de signer quelque chose qu’il
n’aurait pu signer à l’avance.

### 1. Demandez un nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

L’émission est délibérément ouverte. Un nonce ne vaut rien sans la clé privée qui
le signe, et exiger une signature pour obtenir ce que vous signez serait
circulaire ; la réponse ne confirme rien sur le portefeuille, pas même qu’il
existe. Les défis vivent uniquement en mémoire et expirent après cinq minutes —
assez long pour qu’une personne lise et approuve une invite de portefeuille,
assez court pour qu’un nonce non dépensé ne traîne pas.

`getCounterpartiesChallenge` et `getProviderEarningsChallenge` sont le même
émetteur sous des noms différents. Un nonce répond exactement à un appel, quelle
que soit la surface où il est dépensé.

### 2. Signez le défi

Les octets à signer sont la chaîne UTF-8 :

```
<domain>:<subject>:<nonce>
```

`subject` est le peer id canonique en base64 avec lequel le défi est revenu, pas
la graphie base64 que vous avez envoyée. `domain` est fixe par méthode :

| Méthode | Domaine |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

Le séparateur de domaine est la raison pour laquelle une signature collectée pour
une surface avec porte ne peut être présentée sur une autre, même si toutes deux
identifient leur sujet de la même façon et tirent leurs nonces du même registre.

### 3. Appelez la méthode

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

`getMyReservations`, `getMyDisputes` et `getCounterparties` prennent exactement
les mêmes quatre champs. La clé publique est envoyée explicitement plutôt que
récupérée depuis `wallet`, de sorte que l’affirmation d’identité est quelque
chose que l’appelant déclare et que le nœud vérifie, pas quelque chose que le
nœud infère pour l’appelant — elle doit dériver exactement vers le portefeuille
concerné.

Ce qui revient n’est pas rédigé, et seulement pour les enregistrements dont le
portefeuille est partie. `getMyDisputes` répond aussi à un arbitre siégeant, car
lire tout le dossier est son travail.

## Détails qui comptent si vous implémentez ceci

**Refus, pas restriction.** Un appelant qui ne peut prouver le portefeuille reçoit
une erreur, jamais une réponse filtrée. Une implémentation par filtrage a l’air
identique dans chaque test réussi jusqu’à ce qu’une refonte retire le filtre ; un
refus échoue bruyamment et immédiatement.

**Ordre des vérifications.** La vérification de dérivation de clé a lieu en
premier, avant que le nonce ne soit touché, pour que la tentative ratée d’un
inconnu ne puisse dépenser le nonce que son vrai propriétaire est en train de
signer. Le nonce est ensuite consommé *avant* que la signature soit vérifiée,
pour que présenter une signature capturée brûle le nonce au lieu de le rejouer.

**« Inconnu » et « déjà dépensé » sont la même erreur.** Les distinguer
confirmerait qu’une autre partie est en pleine poignée de main pour ce sujet.

**Rien de nouveau n’est stocké.** Les défis en cours sont en mémoire et les
réponses sont repliées à la demande à partir d’enregistrements que le nœud
réplique déjà. Un opérateur de nœud ne gagne aucun registre de qui a demandé
quoi — ce qui importe, car l’opérateur est exactement la partie pour laquelle
ceci ne doit pas bâtir en silence un dossier.
