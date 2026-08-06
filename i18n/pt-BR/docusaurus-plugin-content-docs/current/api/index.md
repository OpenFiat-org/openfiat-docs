---
title: API
sidebar_position: 1
---

# API

Cada nó OpenFiat expõe um único endpoint JSON-RPC 2.0 modelado diretamente na
própria API JSON-RPC da Solana — nomes de método em camelCase `getX`/`sendX`
sobre um único endpoint POST, em vez de uma hierarquia de recursos REST. É
implementado pelos crates `rpc` e `api` em
[`openfiat-core`](https://github.com/OpenFiat-org/openfiat-core).

## Endpoint

```
POST /rpc
Content-Type: application/json
```

Cada requisição é um envelope JSON-RPC 2.0 padrão:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "getAdvertisement", "params": { "id": "ad-1" } }
```

e cada resposta é ou um `result` ou um `error`, nunca ambos:

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "id": "ad-1", "status": "Active", "..." : "..." } }
```

O nó devnet público está em `https://openfiat.allenhark.com` — o mesmo host
também publica um multiaddr de entrypoint para *nós*, que é um endereço
diferente para um trabalho diferente (veja
[getting started](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)).
Qualquer nó que você execute serve a superfície idêntica em `:7080`.

## Chaves, peer ids e assinaturas são base58

Cada chave pública, identificador de peer, assinatura e identificador de evento
é uma string base58:

```json
{
  "service_id": "node-ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5",
  "provider": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "provider_public_key": "ALLENLMtV1zEAHT3xpVryqcbdPCB8c9JhM1Jdbe5XHg5"
}
```

Até há pouco eram arranjos de inteiros. Se você vê
`"provider_public_key": [192, 74, 15, ...]`, está falando com um nó anterior à
mudança — e nada nessa resposta distingue uma chave pública publicada de uma
privada vazada, porque um segredo Ed25519 também tem trinta e dois bytes. Essa
ambiguidade é o motivo da mudança. A forma base58 é também a única usável:
`12D3KooW…` é o que um `--entrypoint` recebe e o que se pode buscar em um log.

**Isto não é apenas uma mudança de exibição.** Uma carga `sendX` é assinada
sobre o JSON de seu struct interno, então um cliente que escreve uma chave numa
carga como um arranjo produz uma transcrição que o nó não reproduz. A assinatura
então falha na verificação — o que aparece como uma mutação rejeitada, não como
um erro de parsing. Use um [SDK](../sdks) e isso é tratado por você; ao construir
o formato de fio à mão, codifique os identificadores como base58.

Os campos de bytes que **não** são identificadores continuam arranjos. O
`commitment` de um voto de disputa e seu `secret` de revelação são valores
opacos de trinta e dois bytes, não identidades, e são enviados como arranjos. A
distinção é pelo que o campo *é*, não pelo seu comprimento.

## Nomenclatura de métodos

Os métodos de leitura começam com `get` e nunca alteram o estado:

```json
{ "method": "getReservation", "params": { "id": "res-1" } }
{ "method": "getReservations", "params": {} }
```

Um método `getMyX` ainda é uma leitura, mas responde apenas pela carteira que o
chamador prova possuir — veja [leituras com prova de carteira](./wallet-proof-reads.md).

As mutações começam com `send` e recebem um campo — `data`, uma carga de fio
codificada em base64 e **já assinada** que a própria carteira do chamador
produziu localmente. Isto espelha o `sendTransaction` da Solana: o nó nunca
constrói nem assina nada em nome do chamador, apenas decodifica a carga e a
aplica pelo mesmo caminho de verificação de assinatura por onde passa um evento
recebido por gossip.

```json
{ "method": "sendReservationRequest", "params": { "data": "<base64 wire bytes>" } }
```

O `Client` tipado de cada [SDK](../sdks) constrói e assina essa carga por você —
é o ponto de integração recomendado, em vez de construir o formato de fio à mão.

## Categorias de métodos

| Domínio | Métodos de exemplo |
| --- | --- |
| Anúncios | `getAdvertisement`, `getAdvertisements`, `sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`, `sendAdvertisementDisable` |
| Reservas | `getReservation`, `getReservations`, `getMyReservations`, `sendReservationRequest` |
| Liquidação | `getSettlement`, `getSettlements`, `getMySettlements`, `sendSettlementInitiate`, `sendPaymentSubmitted`, `sendSettlementApproved` |
| Negociação (junção só de leitura) | `getTrade`, `getTrades` |
| Disputas | `getDispute`, `getDisputes`, `getMyDisputes`, `sendDisputeOpen`, `sendArbitratorJoin`, `sendVoteCommit`, `sendVoteReveal` |
| Provas de carteira | `getWalletChallenge`, `getCounterpartiesChallenge`, `getCounterparties`, `getProviderEarningsChallenge` |
| Volume | `getSettledVolume` |
| Anexos e conteúdo | `getSettlementAttachments`, `getHeldContent`, `sendAttachmentPublish` |
| Identidade | `getIdentityClaim`, `getIdentityClaimsByWallet`, `sendClaimPublish` |
| Reputação (só leitura) | `getReputation` |
| Governança | `getProposal`, `getProposals`, `sendProposalCreate`, `sendVoteCast` |
| Provedores de serviço | `getProvider`, `getProviders`, `sendProviderRegister`, `sendProviderHealthUpdate`, `getProviderEarnings`, `sendProviderWithdraw` |
| Notificações | `getSubscription`, `getNotificationDispatch`, `sendSubscriptionUpdate`, `sendDeliveryReport` |
| Oráculos | `getOracleRecord`, `getExchangeRate`, `getMedianExchangeRate`, `sendOraclePublish` |
| Inteligência de risco | `getWalletScreening`, `sendRiskPublish` |
| Recompensas | `getRewardObservations` |
| Snapshots | `getLatestSnapshot`, `getSnapshots`, `getCheckpointSlot`, `sendSnapshotAnnounce` |
| Sessões | `getSession`, `sendSessionEstablish`, `sendSessionRenew`, `sendSessionRevoke`, `sendSessionMigrate` |
| Ponte de cadeia (Solana, OFS-4300) | `getChainStatus`, `getLatestBlockhash`, `sendTransaction` |
| Nó | `getVersion`, `getHealth`, `getPeers` |

## Leituras que não nomeiam as partes

`getSettlement(s)`, `getReservation(s)` e `getDispute(s)` retornam registros com
a identidade das partes removida. É uma mudança deliberada, motivada pela
segurança, e não um descuido, e tem uma página própria:
[o que uma leitura pública retorna](./trade-privacy.md). Uma parte lê seus
próprios registros por completo via [leituras com prova de carteira](./wallet-proof-reads.md).

## As disputas são decididas na cadeia, não pelo nó que te responde

Uma resposta de `getDispute` carrega as revelações que um nó coletou, e **não**
carrega um desfecho derivado delas. Uma resolução aparece só depois que este nó
observou a transação de execução confirmar e leu o que ela decidiu — veja
[como uma disputa se resolve](./dispute-resolution.md). Um cliente que conta ele
mesmo as revelações reintroduziu exatamente a divergência que o nó parou de
produzir.

## Dois métodos de taxa de câmbio, e qual usar

`getMedianExchangeRate` retorna um número nu ou `null`, que é a forma correta
quando tudo o que você quer é um preço ou nada.

`getExchangeRate` recebe os mesmos `{ base, quote }` e responde com um status
etiquetado, porque `null` colapsa dois fatos distintos:

```json
{ "status": "current", "rate": 129.5, "expiresAt": 1753800000000 }
{ "status": "stale" }
{ "status": "noData" }
```

A distinção não é acadêmica. **Stale** significa que um provedor de fato publica
este par e cada registro expirou (OFS-7000 §12: dados expirados não são dados
atuais, por mais recente que seja o lapso) — o feed provavelmente voltará, então
esperar é sensato. **NoData** significa que ninguém precifica este corredor e
esperar é inútil. Nenhum é um número, e um chamador não deve mostrar nenhum como
tal.

Use `getExchangeRate` a menos que você tenha um motivo para não fazê-lo.
`getMedianExchangeRate` permanece porque os clientes dependem dele.

## Service ids

Um nó se registra sob `node-<sua chave pública base58>`, e um provedor de
snapshots sob `snapshot-<a mesma chave>` — o prefixo é o que permite a um nó
manter vários registros do registro sem que colidam.

O id é derivado em vez de aleatório para que um nó que reinicia atualize seu
registro existente em vez de deixar uma entrada morta para trás. Derivá-lo da
chave *inteira* importa: um esquema anterior usava os primeiros oito bytes do
peer id como hexadecimal, o que parece dezesseis dígitos de identidade mas são
dois, já que cada peer id Ed25519 abre com o mesmo preâmbulo de seis bytes. Dois
nós colidiram em poucas centenas de registros, e o segundo a registrar deslocou
o primeiro.

## O que um nó sabe sobre a rede

`getPeers` reporta os peers que este nó descobriu, os endereços que ele anuncia
sobre si mesmo e seu próprio `self_peer_id` na forma `12D3Koo…` que vai em um
`--entrypoint`. Veja [descoberta de peers](../node-operators/peer-discovery.md)
para a visão do operador disso.

## Erros

Os códigos de erro JSON-RPC 2.0 padrão (`-32700` erro de parsing, `-32601`
método não encontrado, `-32602` parâmetros inválidos, `-32603` erro interno)
cobrem falhas de nível de transporte. Cada falha de domínio — liquidez
insuficiente, um evento duplicado, um signatário não autorizado — volta como um
único erro de aplicação `-32000`, com o código numérico próprio do protocolo e o
nome simbólico (de [OFS-8000](https://github.com/OpenFiat-org/openfiat-specs)) em
`data`:

```json
{ "error": { "code": -32000, "message": "INSUFFICIENT_AVAILABLE_LIQUIDITY", "data": { "ofsErrorCode": 4004, "ofsErrorName": "INSUFFICIENT_AVAILABLE_LIQUIDITY" } } }
```

## Assinaturas

```
GET /ws
```

transmite cada mutação bem-sucedida à medida que acontece — `{"method": "sendX", "result": ...}` — para que um cliente possa reagir à atividade do mercado sem sondagem. Filtre no lado do cliente pelos métodos que lhe interessam.

## Os snapshots são etiquetados por slot, não por uma altura

`getCheckpointSlot` retorna o slot da Solana em relação ao qual o estado do
último snapshot importado estava atual, ou `null` em um nó que não importou
nenhum.

Era `getCheckpointHeight`, e a renomeação não é cosmética. O valor antigo era *a
própria contagem de eventos de gossip do nó produtor*, que é por produtor: dois
nós com estado idêntico reportam números diferentes, e um nó que entrou na
semana passada reporta um mais baixo que um nó em operação desde a gênese.
Comparar os números de dois produtores não comparava nada.

Um slot é o único relógio que cada participante já compartilha. Ele também torna
uma afirmação **verificável** — um nó pode comparar um slot anunciado com sua
própria visão da cadeia e recusar um de um futuro implausível, o que é impossível
contra um número que só o anunciante pode ver.

**O que um slot afirma é mais estreito do que parece.** Ele diz *quando* o
estado foi capturado, não *o que* ele contém: dois nós que fazem snapshot no
mesmo slot podem ter estados de gossip ligeiramente diferentes, porque a
propagação não é instantânea. Trate-o como uma âncora de recência, não como uma
prova de que um snapshot contém outro — o mesmo que os próprios snapshots da
Solana significam com ele.

Um nó que nunca observou um slot não produz snapshots e diz isso. Isso não é uma
exigência de executar uma conexão RPC: um nó só-gossip aprende slots pela ponte
de cadeia.

## Volume liquidado, e por que é por ativo

`getSettledVolume` responde com uma linha por ativo, nunca um total:

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

Quatro coisas que um cliente não deve fazer com isto:

**Não some entre ativos.** São tokens diferentes em escalas diferentes; uma
cifra combinada soma SOL a USDC e não significa nada.

**Não adivinhe `decimals`.** É `null`, junto com um `asset_symbol` `null`,
quando este nó não tem um nome para aquele mint. Mostre o endereço e as unidades
base brutas. Assumir `6` é exatamente como wSOL — que tem nove — sai mil vezes
grande demais.

**Não esconda `unattributed_settlements`.** São liquidações reais confirmadas
cujo anúncio foi apagado desde então, então seu ativo é irrecuperável. Omiti-las
faz os totais parecerem completos quando estão faltando exatamente essas.

**Não descarte `scope`.** Ele diz que estas são as liquidações que *este nó*
replicou e confirmou — não toda a história da rede. Uma cifra de volume
apresentada sem seu escopo se lê como um total global. `settlements_known` ao
lado das linhas contadas faz o restante ser lido como negociações em curso, e
não como uma discrepância.

## Referência interativa

**[Explore cada método →](pathname:///api/reference.html)**

Um documento [OpenRPC](https://open-rpc.org) 1.2.6 (o equivalente JSON-RPC de uma
spec OpenAPI/Swagger) — [`/api/openrpc.json`](pathname:///api/openrpc.json) —
mais uma página interativa autônoma para explorar cada método. A *lista* de
métodos é gerada diretamente da própria tabela de despacho ao vivo do
`openfiat-rpc` (`cargo run -p openfiat-api --example dump_openrpc`), então não
pode desviar para um método que um nó real não executa; é publicada aqui como um
snapshot estático já que este site de docs não tem um nó próprio para servi-la ao
vivo. Aponte o painel «Try it» da página de referência para um nó que você esteja
executando (padrão `http://localhost:7080`) para chamar um método de verdade.

Os **esquemas** por método nesse documento são uma aproximação deliberadamente
simplificada, baseada em convenções — cada `getX(id)` recebe `{id}`, cada `sendX`
recebe `{data}` — em vez de um JSON Schema derivado dos tipos Rust concretos de
cada método. Onde um método se afasta dessas convenções, este site é a forma
autoritativa: as [leituras com prova de carteira](./wallet-proof-reads.md),
`getExchangeRate` e `getPeers` recebem todos parâmetros que a convenção não
descreve.

Um nó em execução também serve a referência idêntica ao vivo e de mesma origem
que seu próprio `/rpc`: `GET /openrpc.json` e `GET /docs`. `GET /metrics` expõe
contadores de requisição em formato Prometheus para operadores.
