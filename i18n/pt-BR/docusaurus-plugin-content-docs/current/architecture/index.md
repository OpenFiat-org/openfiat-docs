---
title: Arquitetura
---

# Arquitetura

OpenFiat não é uma blockchain — é um protocolo descentralizado entre pares
construído sobre a Solana. A Solana fornece liquidação on-chain segura e
transparente por meio de contratos inteligentes auditados; o OpenFiat fornece a
rede de coordenação entre pares responsável por anúncios, descoberta de
negociações, comunicação criptografada, reputação, governança e notificações.

## Camadas

- **Camada de rede** — descoberta de peers, gossip, sincronização de snapshot/sessão, registro de serviços (veja `openfiat-core/crates/{network,discovery,gossip,snapshot,sessions,registry}`).
- **Camada de conteúdo** — os arquivos para os quais os registros do protocolo apontam, endereçados por CID e servidos entre nós sobre bitswap (`crates/content`).
- **Camada de negociação** — anúncios, reservas, liquidação, disputas.
- **Camada de confiança** — declarações de identidade, reputação, inteligência de risco.
- **Camada de coordenação** — governança, notificações, oráculos.

Cada uma delas roda dentro de um único processo e, no fio, sobre uma única
identidade libp2p — sem um segundo daemon e sem um segundo peer id. Descoberta e
gossip multiplexam sobre uma conexão e são roteados separadamente pelo número de
spec OFS que seus envelopes carregam; o serviço de conteúdo fala o padrão
`/ipfs/bitswap/1.2.0` no mesmo swarm, o que permite a qualquer peer IPFS obter
conteúdo do protocolo diretamente de um nó.

Veja a [implementação de referência](https://github.com/OpenFiat-org/openfiat-core)
para o desdobramento atual em nível de crate, e
[`docs/architecture.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/architecture.md)
lá para o grafo de dependências de crates, o formato de fio e o transporte.
