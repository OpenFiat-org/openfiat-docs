---
title: Comment se résout un litige
---

# Comment se résout un litige

Un litige a deux moitiés, et une seule d’elles décide de quoi que ce soit.

La **couche off-chain** collecte. Elle vérifie la signature de chaque arbitre,
confronte une révélation à l’engagement antérieur de cet arbitre, refuse une
révélation d’un portefeuille qui ne s’est jamais engagé, écarte les doublons, et
réplique le résultat pour que chaque nœud voie la même preuve.

La **chaîne** décide. Elle décompte les votes révélés selon ses propres règles —
pondérés par le stake, avec un plancher de votes comptés, rouvrant une manche en
cas d’égalité au lieu de la départager — et elle déplace la garde.

## La couche off-chain ne fait pas le décompte

Elle le faisait. `getDispute` renvoyait une résolution dérivée des révélations
qu’un nœud avait vues, et c’était faux d’une manière qui vaut la peine d’être
comprise, car c’est une erreur qui a l’air d’une aide.

**Deux décomptes des mêmes votes sont un générateur de divergence, pas un second
avis.** La chaîne réarbitre selon des règles différentes, elle peut donc
atteindre une réponse différente sur le même litige — et quand elle le fait,
l’interface montre une issue tandis que l’argent suit l’autre. La chaîne est
l’autorité sur la garde, donc la réponse off-chain n’est pas un second avis :
c’est une affirmation que le protocole fait puis contredit avec ses propres
fonds.

Ainsi `resolution` est fixé par exactement une chose : une transaction
d’exécution que ce nœud a observée se confirmer de façon indépendante, dont il a
ensuite lu l’issue depuis le compte du dossier sur la chaîne.

## `AwaitingChainExecution` est une vraie réponse

Quand chaque révélation requise est arrivée, le dossier reste en
`AwaitingChainExecution`. Cet état dit que la couche off-chain a fini son travail
et que la garde ne s’est pas encore déplacée. Ce n’est pas « résolu en attente
d’exécution » — cette formulation revendiquerait une issue que le nœud n’a pas le
droit de nommer.

Un nœud qui a vu une transaction atterrir mais n’a pu lire ce qu’elle a décidé
**reste** en `AwaitingChainExecution` et enregistre la signature qu’il a
observée. Quelque chose s’est passé sur la chaîne et ce nœud ne sait pas encore
quoi ; le dire est la réponse honnête, et inventer un verdict pour combler la
lacune est exactement l’échec que cette règle supprime.

## L’accord des parties n’est pas une exception

Les deux parties peuvent convenir d’un règlement mutuel, et la couche off-chain
vérifie les deux signatures directement. Elle enregistre cet accord dès qu’elle
l’a — c’est un fait réel sur le dossier, et le retenir cacherait aux parties leur
propre décision.

Mais enregistrer un accord n’est pas enregistrer une résolution. Tant que la
garde ne s’est pas réellement déplacée, le dossier est en
`AwaitingChainExecution` comme n’importe quel autre.

Celle-ci est facile à rater, car contrairement à une décision il n’y a pas de
calcul que deux nœuds pourraient faire différemment — l’accord est simplement
*les* deux signatures. Il doit tout de même attendre, pour deux raisons :

- **Les signatures ne déplacent pas d’argent.** Un dossier marqué
  `MutualSettlement` alors que les fonds restent verrouillés dit aux deux parties
  que le litige est terminé et payé, alors que ni l’un ni l’autre n’est vrai.
- **La chaîne exécute selon ses propres échéances.** Elle reste libre d’exécuter
  une issue arbitrée sur un dossier dont les parties ont convenu en privé sans
  jamais le relayer — remettant les deux couches en contradiction sur un seul
  litige, ce que toute cette règle existe pour empêcher.

## Ce qu’un client doit afficher

| Le nœud dit | Afficher |
| --- | --- |
| `resolution: null`, statut `AwaitingChainExecution` | Le dossier est décidé ou convenu ; la garde ne s’est pas encore déplacée |
| `resolution` défini, avec une signature d’exécution | L’issue, et la transaction d’où elle vient |
| Révélations collectées, aucun changement de statut | Collecte de preuves ; aucune issue à afficher |

Ne dérivez pas une issue des révélations dans une réponse de `getDispute`. Elles
sont là pour que n’importe qui puisse auditer ce qui a été donné à la chaîne, pas
pour qu’un client atteigne son propre verdict — un client qui les décompte a
réintroduit exactement la divergence que le nœud a cessé de produire.

Voir OFS-2400 §16.2 et §17 pour l’énoncé normatif.
