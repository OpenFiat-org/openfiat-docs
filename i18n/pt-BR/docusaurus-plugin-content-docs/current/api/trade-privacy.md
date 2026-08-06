---
title: O que uma leitura pública retorna
sidebar_position: 3
---

# O que uma leitura pública retorna

`getSettlement`, `getSettlements`, `getReservation`, `getReservations`,
`getDispute` e `getDisputes` são leituras abertas, não autenticadas, e já não
retornam a identidade das partes. Uma parte lê seus próprios registros por
completo através dos [métodos com prova de carteira](./wallet-proof-reads.md).

## Por que redação em vez de autenticação

Um explorador que mostra volume, estados e tempos de liquidação é uma visão
pública legítima de uma rede pública. Colocar uma assinatura na frente disso o
quebraria, ao mesmo tempo que empurraria qualquer determinado de volta ao gossip
bruto, o que não alcança nada. O que o explorador nunca precisou é *quem* —
então a leitura pública mantém tudo exceto a identidade.

O que a identidade monta é o grafo de negociações, e o argumento contra
entregá-lo é feito por completo na página de
[leituras com prova de carteira](./wallet-proof-reads.md): num mercado fiat entre
pares, saber a qual comerciante uma carteira sempre volta e quem são os habituais
de um comerciante movimentado é uma questão de segurança física, não uma
preferência. Uma chamada não autenticada costumava reconstruí-lo.

## Quanto isto vale honestamente

Estes registros são difundidos por gossip a cada nó. Qualquer um que execute um
os lê todos, e a redação não muda isso. O que é protegido é a *facilidade* da
consulta — a diferença entre dar `curl` no nó de acesso público de outra pessoa e
levantar um nó para indexar a rede. Essa diferença é a maior parte do que a
coleta casual é feita.

Enunciar isso com clareza importa mais do que pode parecer: um integrador que
acredita que estes registros são confidenciais construirá algo que se apoia numa
garantia que o protocolo não faz.

## As formas

### Settlement

| Mantido | Removido |
| --- | --- |
| `id`, `reservation_id`, `amount`, `state` | `buyer`, `buyer_public_key` |
| `escrow_release_signature` | `seller`, `seller_public_key` |
| `payment_submitted_at`, `merchant_responded_at` | `payment_reference` |
| `payment_discrepancy`, `created_at`, `updated_at` | |

`escrow_release_signature` permanece porque nomeia uma transação on-chain que
qualquer um já pode ler na Solana, e é o que torna uma liquidação verificável de
forma independente.

`payment_reference` é indiscutivelmente a pior das duas remoções: é texto livre
onde um comprador coloca sua própria referência bancária, então rotineiramente
carrega um nome real ou um número de conta.

### Reservation

| Mantido | Removido |
| --- | --- |
| `id`, `advertisement_id`, `amount`, `state` | `requester` |
| `requested_at`, `updated_at`, `expires_at` | `requester_public_key` |

`advertisement_id` é mantido deliberadamente. Um anúncio é uma oferta pública e
já carrega o peer id de seu comerciante em cada linha do livro de ordens, então
revela uma ponta de uma aresta que nunca foi privada. O que ele não revela é a
outra ponta — que é o que a torna uma aresta.

### Dispute

| Mantido | Removido |
| --- | --- |
| `id`, `settlement_id`, `status`, `resolution` | `buyer`, `seller`, `opener` e suas chaves |
| `required_arbitrators`, `arbitrators_seated` | `reason` |
| `commitments`, `reveals` (contagens) | `arbitrators`, `arbitrator_keys` |
| `onchain_execution_signature` | os compromissos e revelações individuais |
| `opened_at`, `updated_at` | os indicadores de acordo mútuo |

Note que aqui `commitments` e `reveals` são **contagens**, não listas — o
suficiente para um explorador mostrar um caso avançando, sem o voto de ninguém
ligado ao seu nome.

Três razões distintas para o que é descartado. As partes, porque uma disputa é o
caso em que saber quem se desentendeu com quem é o mais obviamente digno de mau
uso. `reason`, porque é texto livre sobre um desacordo real por dinheiro real e
nomeia pessoas, bancos e referências por padrão. As listas de árbitros, porque um
árbitro é um provedor registrado cuja identidade não é em si um segredo — mas
*qual árbitro pegou qual caso, e como votou* é exatamente o emparelhamento que
torna pressionar um deles algo que vale a pena. Os indicadores de acordo mútuo
vão com eles: «o vendedor concordou e o comprador não» é uma posição de
negociação, e publicá-la a espectadores muda uma negociação entre duas pessoas.

## Se você está adicionando um campo

Um campo pertence a uma visão pública apenas se diz algo sobre a *negociação* e
não sobre as *pessoas*. Na dúvida, fica de fora: adicionar um depois é uma nota de
versão, e remover um é uma divulgação que já aconteceu.
