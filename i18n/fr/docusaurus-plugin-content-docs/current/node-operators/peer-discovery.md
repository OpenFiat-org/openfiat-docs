---
title: Découverte de pairs
sidebar_position: 3
---

# Découverte de pairs

Un nœud rejoint en composant un entrypoint et trouve le reste du réseau lui-même.
La découverte de pairs (OFS-1100) échange les pairs connus sur la même connexion
que le gossip utilise déjà, donc un nœud apprend des pairs qu’on ne lui a jamais
donnés et annonce les adresses où il est atteignable.

Cela vaut la peine d’être énoncé clairement car ce n’a pas toujours été vrai, et
l’échec était invisible : le service de découverte était pleinement implémenté et
a fait converger cinq nœuds dans son propre test, et aucun nœud en marche n’en a
jamais construit un. Les nœuds n’annonçaient aucune adresse et n’apprenaient aucun
pair qu’on ne leur avait donné statiquement, tout en paraissant entièrement sains
à chaque vérification locale. Un nœud a un swarm libp2p, une seule chose peut
piloter la boucle d’événements de ce swarm, et le gossip la tenait — donc le
service qui n’était pas propriétaire du swarm ne recevait rien, à jamais. Les deux
partagent désormais une connexion, et les messages sont routés vers l’un ou
l’autre par le propre numéro de spec OFS de l’enveloppe.

La découverte n’est pas un flag et ne peut être désactivée.

## La première connexion

Rien ne peut trouver un réseau à partir de rien, donc `--entrypoint` est encore la
façon dont un nœud démarre :

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

Répétez-le pour plusieurs. Un nom d’hôte fonctionne et est préféré — le nœud le
résout au démarrage via le propre résolveur du système d’exploitation, donc le
cluster survit au changement d’IP de l’entrypoint. **Gardez le suffixe
`/p2p/<peer id>`** : le DNS n’est pas authentifié, et le peer id est ce qui fait
qu’un enregistrement détourné échoue la poignée de main au lieu de devenir en
silence votre unique pair.

Un entrypoint qui ne se résoudra pas arrête le nœud au démarrage au lieu d’être
sauté. Un nœud qui en écarterait un en silence démarrerait sans aucun pair et
paraîtrait parfaitement sain tout en ne parlant à personne — ce qui est
exactement l’échec par lequel cette section a ouvert.

Démarrez sans aucun entrypoint et le nœud le dit, en `WARN`. C’est correct pour le
premier nœud d’un nouveau cluster et faux pour tous les autres.

## Ce que votre nœud annonce sur lui-même

Chaque adresse sur laquelle le nœud sait qu’il écoute, moins le joker de bind.
`0.0.0.0` et `::` sont des instructions d’écoute signifiant « chaque interface
locale », pas des destinations — et comme `--gossip-bind-address` vaut par défaut
exactement cela, l’annoncer sans filtre est précisément le bug qui laisse les
pairs sans rien à composer.

Les plages loopback et privées ne sont délibérément *pas* filtrées. Des processus
sur un hôte s’atteignent par loopback, un cluster docker-compose ou un LAN
n’atteint ses pairs que par adresse privée, et un cluster mono-hôte est un
déploiement réel, et non un artefact de test.

### Derrière un NAT, dans un conteneur, ou sur un hôte cloud avec une IP mappée

L’adresse que votre nœud lie n’est pas l’adresse où les pairs peuvent l’atteindre,
et le nœud ne peut déduire la publique. Ce n’est pas un oubli — par construction,
seul quelque chose de l’autre côté du NAT peut observer l’adresse publique.
L’opérateur la déclare donc :

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

Répétable. Les adresses déclarées sont annoncées **avant** les liées, donc un pair
qui les essaie dans l’ordre se connecte à la première tentative au lieu d’expirer
sur `172.17.0.2`. Les adresses liées sont encore annoncées aussi — les écarter
corrigerait le cas distant en cassant le local.

Omettez le flag si votre nœud est vraiment sur une interface publique. Son adresse
liée est déjà sa publique.

## Demander à un nœud ce qu’il sait

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getPeers","params":{}}' | jq
```

```json
{
  "self_peer_id": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "announced_addresses": ["/ip4/203.0.113.7/udp/4001/quic-v1"],
  "peers": [
    {
      "peer_id": "12D3KooW...",
      "addresses": ["/ip4/198.51.100.4/udp/4001/quic-v1"],
      "node_version": "openfiat/0.1.0",
      "supported_ofs": [1000, 1100, 1200, 1300, 1400, 1500, 2000, 2100, 2200, 2300, 2400, 3000, 4000, 4300, 6000, 7000, 8200],
      "roles": ["MerchantGateway", "OracleProvider", "NotificationGateway", "RiskIntelligenceProvider"],
      "last_seen": 1753800000000,
      "latency_ms": 42,
      "successes": 17,
      "failures": 0
    }
  ]
}
```

Trois choses valent la peine d’être sues sur cette réponse.

`self_peer_id` est la forme `12D3Koo…` qui va dans l’entrypoint que vous publiez à
d’autres opérateurs. Un nœud qui ne peut énoncer son propre peer id ne peut être
rejoint, et l’assembler depuis une ligne de journal est la façon dont il est mal
tapé.

`announced_addresses` est ce que vous dites aux pairs de composer, dans l’ordre où
ils les essaieront. « Mon nœud n’annonce rien » était invisible de l’extérieur
tant que c’était vrai, et un opérateur qui vérifie si son `--external-addr` a pris
effet n’a nulle part ailleurs où regarder.

`successes` et `failures` sont le décompte **propre à ce nœud** des échanges avec
ce pair. Il n’y a délibérément pas de pourcentage de disponibilité ni de score de
santé : replier les deux décomptes en un nombre présenterait l’expérience locale
d’un seul nœud comme un verdict à l’échelle du réseau, et deux nœuds honnêtes
peuvent être en désaccord sur les deux.
