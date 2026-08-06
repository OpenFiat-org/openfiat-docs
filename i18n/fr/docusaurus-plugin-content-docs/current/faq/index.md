---
title: FAQ
---

# FAQ

**OpenFiat est-il une blockchain ?**
Non. OpenFiat est un protocole de coordination pair-à-pair bâti sur Solana, qui
gère le règlement.

**Mon nœud a-t-il besoin d’un démon IPFS séparé ?**
Non. Un nœud sert le contenu du protocole lui-même, sur sa propre identité
libp2p, et c’est activé par défaut — `--ipfs-api-url` et un démon Kubo ne sont
plus la façon dont cela fonctionne. Voir
[service de contenu](../node-operators/content-serving).

**Dois-je lister chaque pair avec lequel mon nœud devrait parler ?**
Non. `--entrypoint` établit la première connexion ; ensuite un nœud apprend des
pairs qu’on ne lui a jamais donnés et annonce les adresses où il est atteignable.
Voir [découverte de pairs](../node-operators/peer-discovery).

**Qui exploite OpenFiat ?**
AllenHark mène le développement initial et finance la croissance précoce, avec
l’objectif explicite à long terme d’une décentralisation progressive — voir la
[Préface](../whitepaper) et le Chapitre 24 (Gouvernance et évolution du
protocole).

**Sous quelle licence est le code ?**
Apache License 2.0, dans chaque dépôt de
[OpenFiat-org](https://github.com/OpenFiat-org).

**Où signaler un problème de sécurité ?**
Voir `SECURITY.md` dans le dépôt concerné — n’ouvrez pas d’issue publique.
