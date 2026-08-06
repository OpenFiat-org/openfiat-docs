---
title: API
sidebar_position: 1
---

# API

Chaque nœud OpenFiat expose un unique endpoint JSON-RPC 2.0 modelé directement
sur la propre API JSON-RPC de Solana — des noms de méthode en camelCase
`getX`/`sendX` sur un unique endpoint POST, plutôt qu’une hiérarchie de
ressources REST. Il est implémenté par les crates `rpc` et `api` dans
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## Endpoint

```
POST /rpc
Content-Type: application/json
```

Chaque requête est une enveloppe JSON-RPC 2.0 standard :

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

et chaque réponse est soit un `result` soit un `error`, jamais les deux :

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

Le nœud devnet public est à `https://openfiat.allenhark.com` — le même hôte
publie aussi un multiaddr d’entrypoint pour les *nœuds*, qui est une adresse
différente pour un travail différent (voir
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
Tout nœud que vous exécutez vous-même sert la surface identique sur `:7080`.

## Les clés, les peer ids et les signatures sont en base58

Chaque clé publique, identifiant de pair, signature et identifiant d’événement
est une chaîne base58 :

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

C’étaient jusqu’à récemment des tableaux d’entiers. Si vous voyez
`"provider_public_key": [192, 74, 15, ...]`, vous parlez à un nœud antérieur au
changement — et rien dans cette réponse ne distingue une clé publique publiée
d’une clé privée fuitée, car un secret Ed25519 fait aussi trente-deux octets.
Cette ambiguïté est la raison du changement. La forme base58 est aussi la seule
utilisable : `12D3KooW…` est ce qu’un `--entrypoint` prend et ce qu’on peut
chercher dans un journal.

**Ce n’est pas qu’un changement d’affichage.** Une charge `sendX` est signée sur
le JSON de son struct interne, donc un client qui écrit une clé dans une charge
sous forme de tableau produit une transcription que le nœud ne reproduit pas. La
signature échoue alors à la vérification — ce qui apparaît comme une mutation
rejetée, pas comme une erreur d’analyse. Utilisez un [SDK](../sdks) et c’est géré
pour vous ; si vous construisez le format de fil à la main, encodez les
identifiants en base58.

Les champs d’octets qui **ne sont pas** des identifiants restent des tableaux. Le
`commitment` d’un vote de litige et son `secret` de révélation sont des valeurs
opaques de trente-deux octets, pas des identités, et sont envoyés comme tableaux.
La distinction tient à ce que le champ *est*, pas à sa longueur.

## Nommage des méthodes

Les méthodes de lecture commencent par `get` et ne modifient jamais l’état :

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

Une méthode `getMyX` reste une lecture, mais elle ne répond que pour le
portefeuille que l’appelant prouve détenir — voir
[lectures avec preuve de portefeuille](./wallet-proof-reads.md).

Les mutations commencent par `send` et prennent un champ — `data`, une charge de
fil encodée en base64 et **déjà signée** que le propre portefeuille de l’appelant
a produite localement. Cela reflète le `sendTransaction` de Solana : le nœud ne
construit ni ne signe jamais rien au nom de l’appelant, il décode seulement la
charge et l’applique par le même chemin de vérification de signature que suit un
événement reçu par gossip.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

Le `Client` typé de chaque [SDK](../sdks) construit et signe cette charge pour
vous — c’est le point d’intégration recommandé, plutôt que de construire le
format de fil à la main.

## Catégories de méthodes

| Domaine | Méthodes en exemple |
| --- | --- |
| Annonces | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| Réservations | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| Règlement | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Échange (jointure en lecture seule) | `getTrade`, `getTrades` |
| Litiges | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Preuves de portefeuille | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| Volume | `getSettledVolume` |
| Pièces jointes et contenu | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| Identité | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Réputation (lecture seule) | `getReputation` |
| Gouvernance | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Fournisseurs de service | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| Notifications | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oracles | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| Intelligence des risques | `getWalletScreening`, `sendRiskPublish` |
| Récompenses | `getRewardObservations` |
| Snapshots | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| Sessions | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Pont de chaîne (Solana, OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| Nœud | `getVersion`, `getHealth`, `getPeers` |

## Lectures qui ne nomment pas les parties

`getSettlement(s)`, `getReservation(s)` et `getDispute(s)` renvoient des
enregistrements dont l’identité des parties est retirée. C’est un changement
délibéré, motivé par la sécurité, et non un oubli, et il a une page à lui :
[ce que renvoie une lecture publique](./trade-privacy.md). Une partie lit ses
propres enregistrements en entier via les
[lectures avec preuve de portefeuille](./wallet-proof-reads.md).

## Les litiges sont décidés sur la chaîne, pas par le nœud qui vous répond

Une réponse de `getDispute` porte les révélations qu’un nœud a collectées, et
**ne** porte **pas** d’issue dérivée d’elles. Une résolution n’apparaît qu’une
fois que ce nœud a observé la transaction d’exécution se confirmer et lu ce
qu’elle a décidé — voir [comment un litige se résout](./dispute-resolution.md).
Un client qui décompte lui-même les révélations a réintroduit exactement la
divergence que le nœud a cessé de produire.

## Deux méthodes de taux de change, et laquelle choisir

`getMedianExchangeRate` renvoie un nombre nu ou `null`, ce qui est la bonne forme
quand tout ce que vous voulez est un prix ou rien.

`getExchangeRate` prend les mêmes `{ base, quote }` et répond plutôt par un
statut étiqueté, car `null` confond deux faits distincts :

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

La distinction n’est pas académique. **Stale** signifie qu’un fournisseur publie
bien cette paire et que chaque enregistrement a expiré (OFS-7000 §12 : des
données expirées ne sont pas des données courantes, si récent que soit le
lapse) — le flux reviendra probablement, donc attendre est sensé. **NoData**
signifie que personne ne price ce corridor et qu’attendre est inutile. Ni l’un
ni l’autre n’est un nombre, et un appelant ne doit afficher ni l’un ni l’autre
comme tel.

Choisissez `getExchangeRate` sauf raison contraire. `getMedianExchangeRate`
demeure parce que les clients en dépendent.

## Service ids

Un nœud s’enregistre sous `node-<sa clé publique base58>`, et un fournisseur de
snapshots sous `snapshot-<la même clé>` — le préfixe est ce qui permet à un nœud
de tenir plusieurs enregistrements du registre sans qu’ils entrent en collision.

L’id est dérivé plutôt qu’aléatoire pour qu’un nœud qui redémarre mette à jour
son enregistrement existant au lieu de laisser une entrée morte derrière lui. Le
dériver de la clé *entière* importe : un schéma antérieur utilisait les huit
premiers octets du peer id en hexadécimal, ce qui ressemble à seize chiffres
d’identité mais en fait deux, car chaque peer id Ed25519 s’ouvre sur le même
préambule de six octets. Deux nœuds sont entrés en collision en quelques
centaines d’enregistrements, et le second à s’enregistrer a délogé le premier.

## Ce qu’un nœud sait du réseau

`getPeers` rapporte les pairs que ce nœud a découverts, les adresses qu’il
annonce sur lui-même, et son propre `self_peer_id` sous la forme `12D3Koo…` qui
va dans un `--entrypoint`. Voir
[découverte de pairs](../node-operators/peer-discovery.md) pour la vue de
l’opérateur là-dessus.

## Erreurs

Les codes d’erreur JSON-RPC 2.0 standard (`-32700` erreur d’analyse, `-32601`
méthode introuvable, `-32602` paramètres invalides, `-32603` erreur interne)
couvrent les échecs de niveau transport. Chaque échec de domaine — liquidité
insuffisante, un événement doublon, un signataire non autorisé — revient comme
une unique erreur d’application `-32000`, avec le code numérique propre du
protocole et le nom symbolique (de
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) dans `data` :

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## Abonnements

```
GET /ws
```

diffuse chaque mutation réussie au moment où elle se produit — `{"method": "sendX", "result": ...}` — pour qu’un client puisse réagir à l’activité du marché sans interrogation. Filtrez côté client selon les méthodes qui vous intéressent.

## Les snapshots sont étiquetés par slot, pas par une hauteur

`getCheckpointSlot` renvoie le slot Solana par rapport auquel l’état du dernier
snapshot importé était courant, ou `null` sur un nœud qui n’en a importé aucun.

C’était `getCheckpointHeight`, et le renommage n’est pas cosmétique. L’ancienne
valeur était *le propre décompte d’événements de gossip du nœud producteur*, qui
est par producteur : deux nœuds au même état rapportent des nombres différents,
et un nœud entré la semaine dernière en rapporte un plus bas qu’un nœud en marche
depuis la genèse. Comparer les nombres de deux producteurs ne comparait rien.

Un slot est la seule horloge que chaque participant partage déjà. Il rend aussi
une affirmation **vérifiable** — un nœud peut comparer un slot annoncé à sa
propre vue de la chaîne et en refuser un d’un futur invraisemblable, ce qui est
impossible contre un nombre que seul l’annonceur peut voir.

**Ce qu’un slot affirme est plus étroit qu’il n’y paraît.** Il dit *quand* l’état
a été capturé, pas *ce qu*’il contient : deux nœuds prenant un snapshot au même
slot peuvent tenir un état de gossip légèrement différent, car la propagation
n’est pas instantanée. Traitez-le comme une ancre de récence, pas comme une
preuve qu’un snapshot en contient un autre — la même chose que signifient à son
sujet les propres snapshots de Solana.

Un nœud qui n’a jamais observé de slot ne produit pas de snapshots et le dit. Ce
n’est pas une exigence d’exécuter une connexion RPC : un nœud gossip-seul apprend
les slots par le pont de chaîne.

## Volume réglé, et pourquoi il est par actif

`getSettledVolume` répond par une ligne par actif, jamais un total :

```json
{
  "assets": [
    { "asset_mint": "2bHPi…RRU", "asset_symbol": "USDC", "decimals": 6,
      "base_units": 4500000, "settlements": 12 },
    { "asset_mint": "So111…112", "asset_symbol": "wSOL", "decimals": 9,
      "base_units": 2000000000, "settlements": 3 }
  ],
  "unattributed_settlements": 1,
  "settlements_known": 16,
  "scope": "settlements this node has replicated and observed confirmed"
}
```

Quatre choses qu’un client ne doit pas faire avec ceci :

**Ne sommez pas entre actifs.** Ce sont des tokens différents à des échelles
différentes ; un chiffre combiné ajoute du SOL à de l’USDC et ne signifie rien.

**Ne devinez pas `decimals`.** Il vaut `null`, aux côtés d’un `asset_symbol`
`null`, quand ce nœud n’a pas de nom pour ce mint. Affichez l’adresse et les
unités de base brutes. Supposer `6` est exactement comment wSOL — qui en a neuf —
ressort mille fois trop grand.

**Ne cachez pas `unattributed_settlements`.** Ce sont de vraies liquidations
confirmées dont l’annonce a depuis été supprimée, donc leur actif est
irrécupérable. Les omettre fait paraître les totaux complets alors qu’il en
manque d’autant.

**Ne supprimez pas `scope`.** Il dit que ce sont les liquidations que *ce nœud* a
répliquées et confirmées — pas toute l’histoire du réseau. Un chiffre de volume
présenté sans son périmètre se lit comme un total global. `settlements_known` à
côté des lignes comptées fait lire le reste comme des échanges en cours, et non
comme un écart.

## Référence interactive

**[Parcourez chaque méthode →](pathname:///api/reference.html)**

Un document [OpenRPC](https://open-rpc.org) 1.2.6 (l’équivalent JSON-RPC d’une
spec OpenAPI/Swagger) — [`/api/openrpc.json`](pathname:///api/openrpc.json) —
plus une page interactive autonome pour parcourir chaque méthode. La *liste* des
méthodes est générée directement depuis la propre table de dispatch en direct de
`openfiat-rpc` (`cargo run -p openfiat-api --example dump_openrpc`), elle ne peut
donc dériver vers une méthode qu’un vrai nœud n’exécute pas ; elle est publiée ici
comme un snapshot statique puisque ce site de docs n’a pas de nœud à lui pour la
servir en direct. Pointez le panneau « Try it » de la page de référence vers un
nœud que vous exécutez vous-même (par défaut `http://localhost:7080`) pour
appeler une méthode pour de vrai.

Les **schémas** par méthode dans ce document sont une approximation délibérément
simplifiée et fondée sur des conventions — chaque `getX(id)` prend `{id}`, chaque
`sendX` prend `{data}` — plutôt qu’un JSON Schema dérivé des types Rust concrets
de chaque méthode. Là où une méthode s’écarte de ces conventions, ce site est la
forme faisant autorité : les [lectures avec preuve de portefeuille](./wallet-proof-reads.md),
`getExchangeRate` et `getPeers` prennent toutes des paramètres que la convention
ne décrit pas.

Un nœud en marche sert aussi la référence identique en direct et de même origine
que son propre `/rpc` : `GET /openrpc.json` et `GET /docs`. `GET /metrics` expose
des compteurs de requêtes au format Prometheus pour les opérateurs.
