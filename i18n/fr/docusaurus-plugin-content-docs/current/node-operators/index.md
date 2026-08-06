---
title: Opérateurs de nœuds
sidebar_position: 1
---

# Opérateurs de nœuds

Les opérateurs de nœuds sont l’épine dorsale du réseau OpenFiat — ils exécutent
le binaire de référence
[`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core) et participent à
la découverte de pairs, au gossip, au service de contenu et au registre de
services.

## Ce qu’un nœud fait sans aucune configuration

`openfiat-node` se configure entièrement par des flags de ligne de commande — pas
de repli par variable d’environnement ni de fichier de configuration,
délibérément, pour que `systemctl cat openfiat-node` montre exactement ce qui a
été donné à un nœud en marche au lieu de vous envoyer dans un exercice
d’archéologie à travers profils de shell et fichiers d’unité. `openfiat-node
--help` est toute la surface.

Exécutez-le sans rien définir et il déjà :

- génère ou charge son identité (un `wallet.json` au format CLI Solana) et utilise
  cette unique clé à la fois comme clé de signature Solana et comme peer id
  libp2p ;
- sert JSON-RPC, WebSocket et REST sur `0.0.0.0:7080` ;
- écoute les pairs sur `/ip4/0.0.0.0/udp/4001/quic-v1`, annonce les adresses où il
  est atteignable, et apprend des pairs qu’on ne lui a jamais donnés — voir
  [Découverte de pairs](./peer-discovery) ;
- détient le contenu que référencent les enregistrements du protocole et le sert
  via bitswap sur sa propre identité libp2p — voir
  [Service de contenu](./content-serving) ;
- conserve ce contenu pendant 30 jours glissants (`--retention`), donc exécuter un
  nœud est un engagement de stockage borné, et non ouvert.

Deux choses qu’il ne fait *pas* sans qu’on le demande : parler à Solana
(`--solana-rpc-url` le fait passer de `GossipOnly` à `RpcConnected`) et produire
des snapshots pour d’autres (`--snapshot-public-url`). Les deux sont optionnelles
car les deux font au reste du réseau une affirmation que seul l’opérateur peut
garantir.

## Ce qui est optionnel, et ce que cela coûte

| Pour désactiver | Faites ceci | Ce à quoi vous renoncez |
| --- | --- | --- |
| Connectivité Solana | omettez `--solana-rpc-url` | Le nœud reste `GossipOnly` : les réponses on-chain arrivent de seconde main par gossip et peuvent traîner. Il sert encore le marché et relaie les transactions à un pair connecté par RPC, et gagne la part de connectivité réduite. |
| Service de contenu | `--no-content-serving` | Le nœud ne stocke aucun contenu de pièce jointe et ne peut répondre à un défi de récupérabilité, il gagne donc la part réduite. Il défie encore ses pairs. |
| Produire des snapshots | omettez `--snapshot-public-url` | Personne ne peut bootstraper depuis ce nœud. *Consommer* des snapshots ne nécessite aucune configuration. |
| Découverte de pairs | impossible | Ce n’est pas un flag. Un nœud qui n’annoncerait aucune adresse et n’apprendrait aucun pair paraîtrait sain à chaque vérification locale tout en ne parlant à personne. |

## Aller plus loin

- **Le parcours complet de l’opérateur** — [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)
  dans `openfiat-core` : la compilation, chaque flag avec sa vraie valeur par
  défaut, l’entrypoint du devnet public, placer TLS et nginx devant le nœud, et
  les ids de programme on-chain.
- **Déploiement** — [openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  pour les images Docker, le chart Helm Kubernetes et les modules Terraform ;
  `packaging/systemd` et `packaging/windows` dans `openfiat-core` pour exécuter le
  binaire directement comme un service.
- **Réseaux de test locaux** — [openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  (`testnet/`, `devnet/`).
- **Réputation et QoS pondéré par le stake** — OFS-1600 dans
  [Spécifications du protocole](../protocol-specs).
