---
title: API
sidebar_position: 1
---

# API

Cada nodo OpenFiat expone un único endpoint JSON-RPC 2.0 modelado directamente sobre
la propia API JSON-RPC de Solana — nombres de métodos en camelCase `getX`/`sendX` sobre un
único endpoint POST, en lugar de una jerarquía de recursos REST. Lo
implementan los crates `rpc` y `api` en
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## Endpoint

```
POST /rpc
Content-Type: application/json
```

Cada petición es un sobre JSON-RPC 2.0 estándar:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

y cada respuesta es o un `result` o un `error`, nunca ambos:

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

El nodo devnet público está en `https://openfiat.allenhark.com` — el mismo host
también publica un multiaddr de entrypoint para *nodos*, que es una dirección
distinta para un trabajo distinto (consulta
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
Cualquier nodo que ejecutes tú mismo sirve la superficie idéntica en `:7080`.

## Las claves, los peer id y las firmas son base58

Cada clave pública, identificador de peer, firma e identificador de evento es una
cadena base58:

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

Hasta hace poco eran arreglos de enteros. Si ves
`"provider_public_key": [192, 74, 15, ...]`, estás hablando con un nodo
anterior al cambio — y nada en esa respuesta distingue una clave pública
publicada de una privada filtrada, porque un secreto Ed25519
también son treinta y dos bytes. Esa ambigüedad es la razón del cambio. La forma
base58 es además la única utilizable: `12D3KooW…` es lo que toma un `--entrypoint`
y lo que se puede buscar en un log.

**Esto no es solo un cambio de visualización.** Una carga `sendX` se firma sobre
el JSON de su struct interno, así que un cliente que escribe una clave en una
carga como un arreglo produce una transcripción que el nodo no reproduce.
La firma entonces no verifica — lo que se manifiesta como una mutación rechazada,
no como un error de análisis. Usa un [SDK](../sdks) y esto se gestiona
por ti; si construyes el formato de cable a mano, codifica los identificadores como base58.

Los campos de bytes que **no** son identificadores siguen siendo arreglos. El
`commitment` de un voto de disputa y su `secret` de revelación son valores opacos de treinta y dos bytes,
no identidades, y se envían como arreglos. La distinción es por lo que el
campo *es*, no por su longitud.

## Nomenclatura de métodos

Los métodos de lectura empiezan por `get` y nunca mutan el estado:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

Un método `getMyX` sigue siendo una lectura, pero responde solo para la cartera que el
llamante demuestra poseer — consulta [Lecturas con prueba de cartera](./wallet-proof-reads.md).

Las mutaciones empiezan por `send` y toman un campo — `data`, una carga de cable
**ya firmada** y codificada en base64 que la propia cartera del llamante produjo localmente.
Esto refleja el `sendTransaction` de Solana: el nodo nunca construye ni firma
nada en nombre del llamante, solo decodifica la carga y la aplica
por la misma ruta de verificación de firma que sigue un evento recibido por gossip.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

El `Client` tipado de cada [SDK](../sdks) construye y firma esa carga por ti —
es el punto de integración recomendado en lugar de construir el formato de cable
a mano.

## Categorías de métodos

| Dominio | Métodos de ejemplo |
| --- | --- |
| Anuncios | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| Reservas | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| Liquidación | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Operación (unión de solo lectura) | `getTrade`, `getTrades` |
| Disputas | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Pruebas de cartera | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| Volumen | `getSettledVolume` |
| Adjuntos y contenido | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| Identidad | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Reputación (solo lectura) | `getReputation` |
| Gobernanza | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Proveedores de servicio | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| Notificaciones | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oráculos | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| Inteligencia de riesgo | `getWalletScreening`, `sendRiskPublish` |
| Recompensas | `getRewardObservations` |
| Snapshots | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| Sesiones | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Puente de cadena (Solana, OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| Nodo | `getVersion`, `getHealth`, `getPeers` |

## Lecturas que no nombran a las partes

`getSettlement(s)`, `getReservation(s)` y `getDispute(s)` devuelven registros
con la identidad de las partes eliminada. Es un cambio deliberado, motivado por la seguridad,
más que un descuido, y tiene su propia página:
[qué devuelve una lectura pública](./trade-privacy.md). Una parte lee sus propios
registros por completo mediante [lecturas con prueba de cartera](./wallet-proof-reads.md).

## Las disputas se deciden en la cadena, no por el nodo que te responde

Una respuesta de `getDispute` lleva las revelaciones que un nodo ha recopilado, y **no**
lleva un desenlace derivado de ellas. Una resolución aparece solo
una vez que este nodo ha observado confirmarse la transacción de ejecución y ha leído lo que
decidió — consulta [cómo se resuelve una disputa](./dispute-resolution.md). Un
cliente que cuenta él mismo las revelaciones ha reintroducido exactamente la
divergencia que el nodo dejó de producir.

## Dos métodos de tipo de cambio, y cuál usar

`getMedianExchangeRate` devuelve un número desnudo o `null`, que es la forma
correcta cuando todo lo que quieres es un precio o nada.

`getExchangeRate` toma los mismos `{ base, quote }` y responde con un estado
etiquetado en su lugar, porque `null` colapsa dos hechos distintos:

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

La distinción no es académica. **Stale** significa que un proveedor sí publica este
par y que cada registro ha expirado (OFS-7000 §12: los datos expirados no son datos
actuales, por reciente que sea el lapso) — es probable que el feed vuelva, así que esperar
es sensato. **NoData** significa que nadie pone precio a este corredor y esperar
es inútil. Ninguno es un número, y un llamante no debe mostrar ninguno como tal.

Usa `getExchangeRate` salvo que tengas una razón para no hacerlo. `getMedianExchangeRate`
permanece porque los clientes dependen de él.

## Service ids

Un nodo se registra bajo `node-<su clave pública base58>`, y un proveedor de
snapshots bajo `snapshot-<la misma clave>` — el prefijo es lo que permite a un
nodo tener varios registros del registro sin que colisionen.

El id se deriva en lugar de ser aleatorio para que un nodo que se reinicia actualice
su registro existente en vez de dejar tras de sí una entrada muerta. Derivarlo
de la clave *entera* importa: un esquema anterior usaba los primeros ocho
bytes del peer id como hexadecimal, lo que parece dieciséis dígitos de identidad
pero son dos, ya que cada peer id Ed25519 abre con el mismo preámbulo de seis bytes.
Dos nodos colisionaron en unos pocos cientos de registros, y el
segundo en registrarse desplazó al primero.

## Qué sabe un nodo sobre la red

`getPeers` informa de los peers que este nodo ha descubierto, las direcciones que
anuncia sobre sí mismo y su propio `self_peer_id` en la forma `12D3Koo…` que
va en un `--entrypoint`. Consulta
[descubrimiento de peers](../node-operators/peer-discovery.md) para la visión del operador
al respecto.

## Errores

Los códigos de error JSON-RPC 2.0 estándar (`-32700` error de análisis, `-32601` método no
encontrado, `-32602` parámetros inválidos, `-32603` error interno) cubren los fallos
a nivel de transporte. Cada fallo de dominio — liquidez insuficiente, un evento
duplicado, un firmante no autorizado — vuelve como un único error de aplicación
`-32000`, con el código numérico propio del protocolo y el nombre simbólico (de
[OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) en `data`:

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## Suscripciones

```
GET /ws
```

transmite cada mutación exitosa a medida que ocurre — `{"method": "sendX", "result": ...}` — para que un cliente pueda reaccionar a la actividad del mercado sin sondeo. Filtra del lado del cliente por los métodos que te interesen.

## Los snapshots se etiquetan por slot, no por una altura

`getCheckpointSlot` devuelve el slot de Solana respecto al cual el estado del
último snapshot importado estaba actualizado, o `null` en un nodo que no ha importado ninguno.

Era `getCheckpointHeight`, y el cambio de nombre no es cosmético. El valor antiguo
era *el propio recuento de eventos de gossip del nodo productor*, que es
por productor: dos nodos con estado idéntico informan de números distintos,
y un nodo que se unió la semana pasada informa de uno más bajo que un nodo en marcha
desde el génesis. Comparar los números de dos productores no comparaba nada.

Un slot es el único reloj que cada participante ya comparte. También hace que una
afirmación sea **verificable** — un nodo puede comparar un slot anunciado contra su propia
visión de la cadena y rechazar uno de un futuro inverosímil, lo cual es
imposible contra un número que solo el anunciante puede ver.

**Lo que un slot afirma es más estrecho de lo que parece.** Dice *cuándo* se
capturó el estado, no *qué* contiene: dos nodos que hacen snapshot en el mismo
slot pueden tener un estado de gossip ligeramente distinto, porque la propagación no
es instantánea. Trátalo como un ancla de recencia, no como una prueba de que un snapshot
contiene otro — lo mismo que significan al respecto los propios snapshots de Solana.

Un nodo que nunca ha observado un slot no produce snapshots y lo dice.
Eso no es un requisito de ejecutar una conexión RPC: un nodo solo-gossip
aprende slots por el puente de cadena.

## Volumen liquidado, y por qué es por activo

`getSettledVolume` responde con una fila por activo, nunca un total:

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

Cuatro cosas que un cliente no debe hacer con esto:

**No sumes entre activos.** Son tokens distintos a escalas distintas;
una cifra combinada suma SOL a USDC y no significa nada.

**No adivines `decimals`.** Es `null`, junto con un `asset_symbol`
`null`, cuando este nodo no tiene nombre para ese mint. Muestra la dirección
y las unidades base en bruto. Asumir `6` es exactamente cómo wSOL — que tiene nueve —
sale mil veces demasiado grande.

**No ocultes `unattributed_settlements`.** Son liquidaciones reales confirmadas
cuyo anuncio se ha borrado desde entonces, así que su activo es
irrecuperable. Omitirlas hace que los totales parezcan completos cuando les
faltan justamente esas.

**No descartes `scope`.** Dice que estas son las liquidaciones que *este nodo*
replicó y confirmó — no toda la historia de la red. Una cifra de volumen
presentada sin su alcance se lee como un total global. `settlements_known`
junto a las filas contadas hace que el resto se lea como operaciones en curso en lugar
de como una discrepancia.

## Referencia interactiva

**[Explora cada método →](pathname:///api/reference.html)**

Un documento [OpenRPC](https://open-rpc.org) 1.2.6 (el equivalente JSON-RPC
de una spec OpenAPI/Swagger) — [`/api/openrpc.json`](pathname:///api/openrpc.json) —
más una página interactiva autónoma para explorar cada método. La *lista* de métodos
se genera directamente de la propia tabla de despacho en vivo de `openfiat-rpc`
(`cargo run -p openfiat-api --example dump_openrpc`), así que no puede desviarse hacia
un método que un nodo real no ejecuta; se publica aquí como un snapshot estático
ya que este sitio de docs no tiene un nodo propio para servirlo en vivo. Apunta el
panel «Try it» de la página de referencia a un nodo que estés ejecutando tú mismo (por defecto
`http://localhost:7080`) para llamar a un método de verdad.

Los **esquemas** por método en ese documento son una aproximación deliberadamente
simplificada y basada en convenciones — cada `getX(id)` toma `{id}`, cada `sendX`
toma `{data}` — en lugar de un JSON Schema derivado de los tipos Rust concretos de cada
método. Donde un método se aparta de esas convenciones, este sitio es la
forma autoritativa: las [lecturas con prueba de cartera](./wallet-proof-reads.md),
`getExchangeRate` y `getPeers` toman todos parámetros que la convención no
describe.

Un nodo en marcha también sirve la referencia idéntica, en vivo y del mismo origen
que su propio `/rpc`: `GET /openrpc.json` y `GET /docs`. `GET /metrics`
expone contadores de peticiones en formato Prometheus para operadores.
