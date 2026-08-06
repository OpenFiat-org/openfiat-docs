---
title: Service de contenu
sidebar_position: 2
---

# Service de contenu

Un enregistrement du protocole ne porte jamais de fichier. Il porte un CID — un
hash auto-descriptif d’un contenu stocké ailleurs — ce qui garde un reçu de 10 Mo
hors d’une charge de gossip que chaque nœud doit stocker et rejouer, tout en
laissant encore un arbitre établir que l’image qu’il regarde est celle que la
partie a signée.

Quelqu’un doit tout de même détenir les octets. Ce quelqu’un est votre nœud, et
**il le fait déjà** : le service de contenu est activé par défaut et ne nécessite
aucune configuration.

## Pourquoi c’est dans le nœud et pas un démon

La première version épinglait (pin) via un démon
[Kubo](https://github.com/ipfs/kubo) séparé, atteint par `--ipfs-api-url`. Cela
fonctionnait, et coûtait plus qu’il n’y paraissait : une seconde identité de pair
sur le réseau, un runtime Go et sa mémoire résidente à côté de celle du nœud, et
une surface de contrôle `/api/v0` non authentifiée sur le port 5001 qui laisse
quiconque l’atteint épingler, désépingler et lire tout ce que le démon détient —
atténuée seulement en la liant à loopback.

Le problème plus profond était la valeur par défaut. Exécuter un démon est du
travail, l’épinglage était donc opt-in, presque personne ne l’aurait activé — et
une garantie de durabilité dans laquelle personne n’opte n’est pas une garantie.
Un nœud parle désormais bitswap en processus, sur la même identité libp2p avec
laquelle il fait déjà du gossip, ce qui permet que le comportement soit activé
par défaut. Cela, à son tour, est ce qui fait que le prime de récompense mesure
quelque chose de réel : tout le monde servant, le multiplicateur sépare les nœuds
qui détiennent réellement et répondent pour le contenu des nœuds hors ligne ou
qui ont élagué, plutôt que de séparer les opérateurs qui ont pris la peine
d’installer Go de ceux qui ne l’ont pas fait.

## Ce que votre nœud détient, et ce qu’il ne détient pas

Il détient le contenu référencé par les enregistrements de pièces jointes qu’il a
**acceptés**, dans sa fenêtre de rétention. Il ne récupère pas chaque CID qu’il
voit — un nœud qui le ferait stockerait ce que quiconque choisirait de pointer
vers lui.

Cette borne n’est pas une promesse, c’est de l’arithmétique : une pièce jointe
doit nommer une liquidation, et une liquidation nécessite une vraie réservation
contre un vrai escrow. Le plafond de ce qu’on demande à votre disque est le
volume d’échanges réel du réseau, pas la patience d’un inconnu.

Tout ce qui est récupéré est vérifié contre son CID avant d’être gardé, qu’il
vienne d’un pair ou d’une passerelle.

Demandez à votre nœud ce qu’il détient :

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHeldContent","params":{"cid":"bafkrei..."}}'
# {"jsonrpc":"2.0","id":1,"result":{"content":"<base64>"}}   ← détenu
# {"jsonrpc":"2.0","id":1,"result":{"content":null}}          ← non détenu
```

## D’où vient la première copie

Bitswap déplace des blocs entre pairs qui les ont déjà ; il ne crée pas le
premier. Le contenu entre dans le réseau via le service de pinning vers lequel
l’interface l’a téléversé, donc le premier nœud à vouloir un CID doit le récupérer
du réseau IPFS plus large, vérifier les octets contre le CID, et le servir à ses
pairs à partir de là.

```bash
--content-gateway https://ipfs.example.com   # par défaut : https://ipfs.filebase.io
```

La passerelle est un **transport non fiable**, pas une autorité. Elle peut servir
les mauvais octets, aucun octet, ou journaliser qui a demandé quoi ; elle ne peut
changer quel contenu un CID nomme, car le CID est un hash de ce contenu. Les
octets qui ne sont pas ce que le CID nomme sont refusés, et une passerelle qui
substitue quoi que ce soit est indiscernable d’une simplement en panne.

La confidentialité est la seule chose que la vérification ne corrige pas :
quiconque exploite la passerelle apprend que votre nœud a demandé ce CID. C’est
pourquoi le flag existe — pointez-le vers la vôtre — et pourquoi c’est un repli et
non un premier choix. Votre nœud préfère ses pairs.

## Si vous exécutez déjà Kubo

`--ipfs-api-url http://127.0.0.1:5001` fonctionne encore et signifie désormais
quelque chose de plus étroit qu’avant : le contenu du protocole est épinglé dans
votre démon **aussi**, plaçant une copie quelque part que la propre fenêtre de
rétention de votre nœud ne gouverne pas. Ce n’est plus la façon dont un nœud sert
du contenu.

## L’éteindre, et ce que cela coûte

```bash
openfiat-node --no-content-serving
```

Ce nœud ne stocke rien et ne peut répondre à un défi de récupérabilité, il gagne
donc la part réduite. C’est le résultat honnête — il fait moins pour le réseau —
et c’est le bon flag si le disque n’est vraiment pas là. Le nœud défie encore ses
pairs de toute façon : mesurer qui sert du contenu est un service qu’un nœud rend
qu’il stocke quelque chose lui-même ou non.

### Comment fonctionne le défi

Un nœud choisit un CID que le réseau connaît, demande à un autre nœud les octets,
et hache ce qui revient. Une adresse de contenu *est* le hash de son contenu,
donc renvoyer les bons octets n’est pas quelque chose qu’un nœud puisse faire sans
les avoir. C’est le seul signal de qualité de nœud qui est vérifié plutôt que cru.

Seuls certains CID peuvent trancher la question. Le digest d’un CID à codec raw
est pris sur le fichier lui-même ; un CID dag-pb adresse la racine d’un DAG
découpé, donc un pair pourrait renvoyer le bon fichier et échouer quand même une
vérification de hash naïve. Les fournisseurs basculent entre les deux à
262 144 octets, donc les défis échantillonnent des fichiers à 256 Kio ou en
dessous — des avatars presque toujours, des pièces jointes parfois. C’est
suffisant pour séparer un nœud qui épingle tout d’un qui n’épingle rien, ce dont
le multiplicateur a besoin ; ce n’est pas une preuve qu’un nœud détient une pièce
jointe volumineuse précise, et rien ne prétend que ce le soit.

### Ce qu’est le multiplicateur

Un nœud qui répond garde sa part complète ; un nœud qui ne peut pas est mis à
l’échelle à **0.7**, donc un nœud qui sert gagne environ 1.43× ce que gagne un
nœud par ailleurs identique qui ne sert pas. Les deux chiffres sont
`[PROPOSED — NEEDS SIGN-OFF]` — voir OFS-4100 §9.2 et
`crates/rewards/src/params.rs`.

Le prime est exprimé comme une pénalité pour une raison qui n’est pas de
présentation. L’émission par époque est fixe, et ces multiplicateurs décident
comment elle est *divisée*. Un bonus au-dessus de 1.0 ne paierait pas un nœud qui
épingle à partir de rien, il frapperait de l’émission que le seau Infrastructure
ne contient pas — ce que les paramètres de récompense rejettent d’emblée. Le nœud
qui épingle garde donc sa part complète et le nœud qui n’épingle pas cède une
partie de la sienne.

0.7 au lieu du 0.4 du gossip-seul parce que le stockage est un moindre service au
réseau qu’une connexion à la chaîne : un nœud qui n’épingle pas relaie, valide et
sert encore tout le reste.

## Combien de temps le contenu est conservé

Tout nœud ne doit pas porter l’histoire entière.

```bash
--retention 30          # par défaut : une fenêtre glissante de 30 jours
--retention 365         # une fenêtre plus longue, toujours glissante
--retention archival    # tout garder, pour toujours — un choix explicite
```

30 jours est aussi le plancher que chaque nœud doit au réseau, donc des valeurs
plus courtes sont **refusées** au lieu d’être relevées en silence — un nœud
configuré pour sept jours qui tournerait en silence pendant trente ferait quelque
chose d’autre que ce que son opérateur a demandé.

Ce plancher est ce qui permet à l’éviction et aux récompenses de coexister. Les
défis ne sont jamais tirés que du contenu qui s’y trouve, donc un nœud glissant
qui a correctement évincé les preuves de l’an dernier n’est jamais interrogé à
leur sujet et ne perd jamais sa part pour avoir fait la bonne chose. De même,
aucun nœud ne peut réduire ce sur quoi on peut l’interroger en déclarant une
fenêtre plus petite.
