---
title: Leituras com prova de carteira
sidebar_position: 2
---

# Leituras com prova de carteira

Quase toda leitura na [superfície JSON-RPC](./index.md) de um nó é aberta, porque
o que ela retorna já está replicado em cada nó. Um punhado não é, e a linha entre
elas não é «isto é secreto» — nada aqui é secreto — mas «responder isto a um
estranho monta algo que o protocolo deliberadamente deixa espalhado».

## O que está sendo protegido é o grafo de negociações

Um endpoint que responde *com quem esta carteira negocia, e com que frequência*
entrega a qualquer um um mapa de relações comerciais reais: a qual comerciante
uma carteira sempre volta, quem são os habituais de um comerciante movimentado,
e portanto quem vale a pena seguir até em casa. Num mercado fiat entre pares isso
é uma questão de segurança física, não uma preferência.

Esse argumento foi feito uma vez e aplicado em um método (`getCounterparties`),
enquanto o mesmo grafo continuava disponível através de `getSettlements`,
`getReservations` e `getDisputes` — nenhum dos quais recebia um parâmetro, e
todos os quais retornavam cada registro da rede com ambas as partes nomeadas e
com chave. O portão não era fraco; foi contornado. Eram também três métodos em
vez de um: uma reserva nomeia o comprador e seu anúncio nomeia o comerciante,
então a mesma aresta estava disponível um passo antes, inclusive para
negociações que nunca liquidaram.

Por isso as leituras públicas estão agora [redigidas](./trade-privacy.md), e uma
parte lê seus próprios registros por completo provando que possui a carteira.

## O handshake

Não há contas neste protocolo, então «é você mesmo?» só pode ser respondido
pedindo ao chamador que assine algo que ele não poderia ter assinado de antemão.

### 1. Peça um nonce

```json
{ "method": "getWalletChallenge", "params": { "wallet": "<base64 PeerId>" } }
```

```json
{ "result": { "subject": "<base64 PeerId>", "nonce": "<64 hex chars>", "expires_at": 1753800300000 } }
```

A emissão é deliberadamente aberta. Um nonce não vale nada sem a chave privada
que o assina, e exigir uma assinatura para obter aquilo que você assina seria
circular; a resposta não confirma nada sobre a carteira, nem sequer que ela
exista. Os desafios vivem só na memória e expiram após cinco minutos — longo o
bastante para uma pessoa ler e aprovar um prompt de carteira, curto o bastante
para que um nonce não gasto não fique largado por aí.

`getCounterpartiesChallenge` e `getProviderEarningsChallenge` são o mesmo emissor
sob nomes diferentes. Um nonce responde exatamente a uma chamada, em qualquer
superfície em que seja gasto.

### 2. Assine o desafio

Os bytes a assinar são a string UTF-8:

```
<domain>:<subject>:<nonce>
```

`subject` é o peer id canônico em base64 com que o desafio voltou, não qualquer
grafia base64 que você tenha enviado. `domain` é fixo por método:

| Método | Domínio |
| --- | --- |
| `getMySettlements` | `openfiat-my-settlements` |
| `getMyReservations` | `openfiat-my-reservations` |
| `getMyDisputes` | `openfiat-my-disputes` |
| `getCounterparties` | `openfiat-counterparties` |
| `getProviderEarnings` | `openfiat-earnings` |

O separador de domínio é a razão pela qual uma assinatura coletada para uma
superfície com portão não pode ser apresentada em outra, ainda que ambas
identifiquem seu sujeito da mesma forma e saquem nonces do mesmo livro.

### 3. Chame o método

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

`getMyReservations`, `getMyDisputes` e `getCounterparties` recebem exatamente os
mesmos quatro campos. A chave pública é enviada explicitamente em vez de
recuperada de `wallet`, então a afirmação de identidade é algo que o chamador
declara e o nó confere, não algo que o nó infere em nome do chamador — ela deve
derivar exatamente para a carteira sobre a qual se pergunta.

O que volta não está redigido, e apenas para os registros dos quais a carteira é
parte. `getMyDisputes` também responde a um árbitro designado, porque ler o caso
inteiro é o trabalho dele.

## Detalhes que importam se você está implementando isto

**Recusa, não filtragem.** Um chamador que não pode provar a carteira recebe um
erro, nunca uma resposta filtrada. Uma implementação com filtragem parece
idêntica em cada teste que passa, até que uma refatoração remova o filtro; uma
recusa falha em voz alta e imediatamente.

**Ordem das verificações.** A verificação de derivação da chave acontece
primeiro, antes de o nonce ser tocado, para que a tentativa fracassada de um
estranho não gaste o nonce que seu verdadeiro dono está no meio de assinar. O
nonce é então consumido *antes* de a assinatura ser verificada, para que
apresentar uma assinatura capturada queime o nonce em vez de reproduzi-lo.

**«Desconhecido» e «já gasto» são o mesmo erro.** Distingui-los confirmaria que
alguma outra parte está no meio de um handshake para aquele sujeito.

**Nada de novo é armazenado.** Os desafios pendentes estão na memória e as
respostas são dobradas sob demanda a partir de registros que o nó já replica. Um
operador de nó não ganha nenhum registro de quem perguntou o quê — o que importa,
porque o operador é exatamente a parte para a qual isto não deve construir em
silêncio um dossiê.
