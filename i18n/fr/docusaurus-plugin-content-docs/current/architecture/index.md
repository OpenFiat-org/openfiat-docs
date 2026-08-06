---
title: Architecture
---

# Architecture

OpenFiat n’est pas une blockchain — c’est un protocole pair-à-pair décentralisé
bâti sur Solana. Solana fournit un règlement on-chain sûr et transparent via des
contrats intelligents audités ; OpenFiat fournit le réseau de coordination
pair-à-pair responsable des annonces, de la découverte d’échanges, de la
communication chiffrée, de la réputation, de la gouvernance et des notifications.

## Couches

- **Couche réseau** — découverte de pairs, gossip, synchronisation snapshot/session, registre de services (voir `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`).
- **Couche contenu** — les fichiers vers lesquels pointent les enregistrements du protocole, adressés par CID et servis entre nœuds via bitswap (`crates/content`).
- **Couche échange** — annonces, réservations, règlement, litiges.
- **Couche confiance** — déclarations d’identité, réputation, intelligence des risques.
- **Couche coordination** — gouvernance, notifications, oracles.

Chacune d’elles tourne dans un unique processus et, sur le fil, sur une unique
identité libp2p — pas de second démon ni de second peer id. Découverte et gossip
se multiplexent sur une connexion et sont routés séparément selon le numéro de
spec OFS que portent leurs enveloppes ; le service de contenu parle le standard
`/ipfs/bitswap/1.2.0` sur le même swarm, ce qui permet à tout pair IPFS de
récupérer du contenu du protocole directement depuis un nœud.

Voir l’[implémentation de référence](https://github.com/OpenFiat-org/openfiat-core)
pour le découpage actuel au niveau des crates, et
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
là-bas pour le graphe de dépendances des crates, le format de fil et le
transport.
