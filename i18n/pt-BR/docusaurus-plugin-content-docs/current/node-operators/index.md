---
title: Operadores de nós
sidebar_position: 1
---

# Operadores de nós

Os operadores de nós são a espinha dorsal da rede OpenFiat — eles executam o
binário de referência [`openfiat-node`](https://github.com/OpenFiat-org/openfiat-core)
e participam da descoberta de peers, do gossip, do serviço de conteúdo e do
registro de serviços.

## O que um nó faz sem nenhuma configuração

`openfiat-node` é configurado inteiramente por flags de linha de comando — sem
fallback por variável de ambiente e sem arquivo de configuração, deliberadamente,
para que `systemctl cat openfiat-node` mostre exatamente o que foi dado a um nó
em execução em vez de mandá-lo a um exercício de arqueologia por perfis de shell
e arquivos de unidade. `openfiat-node --help` é toda a superfície.

Execute-o sem nada definido e ele já:

- gera ou carrega sua identidade (um `wallet.json` em formato CLI da Solana) e usa
  essa única chave como sua chave de assinatura da Solana e como seu peer id
  libp2p;
- serve JSON-RPC, WebSocket e REST em `0.0.0.0:7080`;
- escuta peers em `/ip4/0.0.0.0/udp/4001/quic-v1`, anuncia os endereços em que é
  alcançável, e aprende peers que nunca lhe foram dados — veja
  [Descoberta de peers](./peer-discovery);
- guarda o conteúdo que os registros do protocolo referenciam e o serve sobre
  bitswap na sua própria identidade libp2p — veja
  [Serviço de conteúdo](./content-serving);
- mantém esse conteúdo por 30 dias móveis (`--retention`), então executar um nó é
  um compromisso de armazenamento limitado, e não um aberto.

Duas coisas que ele *não* faz sem que se peça: falar com a Solana
(`--solana-rpc-url` o move de `GossipOnly` para `RpcConnected`) e produzir
snapshots para outros (`--snapshot-public-url`). Ambas são opcionais porque ambas
fazem uma afirmação ao resto da rede que só o operador pode avalizar.

## O que é opcional, e o que custa

| Para desativar | Faça isto | Do que você abre mão |
| --- | --- | --- |
| Conectividade com a Solana | omita `--solana-rpc-url` | O nó permanece `GossipOnly`: as respostas on-chain chegam de segunda mão por gossip e podem atrasar. Ele ainda serve o mercado e retransmite transações a um peer conectado por RPC, e ganha a parcela reduzida de conectividade. |
| Serviço de conteúdo | `--no-content-serving` | O nó não armazena conteúdo de anexos e não pode responder a um desafio de recuperabilidade, então ganha a parcela reduzida. Ele ainda desafia seus peers. |
| Produzir snapshots | omita `--snapshot-public-url` | Ninguém pode fazer bootstrap a partir deste nó. *Consumir* snapshots não precisa de configuração. |
| Descoberta de peers | não é possível | Não é um flag. Um nó que não anunciasse nenhum endereço e não aprendesse nenhum peer pareceria saudável a cada checagem local enquanto não fala com ninguém. |

## Indo além

- **O passo a passo completo do operador** — [`docs/getting-started.md`](https://github.com/OpenFiat-org/openfiat-core/blob/main/docs/getting-started.md)
  em `openfiat-core`: compilar, cada flag com seu padrão real, o entrypoint do
  devnet público, colocar TLS e nginx na frente do nó, e os ids de programa
  on-chain.
- **Implantação** — [openfiat-infra](https://github.com/OpenFiat-org/openfiat-infra)
  para imagens Docker, o chart Helm do Kubernetes e módulos Terraform;
  `packaging/systemd` e `packaging/windows` em `openfiat-core` para executar o
  binário diretamente como um serviço.
- **Redes de teste locais** — [openfiat-devtools](https://github.com/OpenFiat-org/openfiat-devtools)
  (`testnet/`, `devnet/`).
- **Reputação e QoS ponderado por stake** — OFS-1600 em
  [Especificações do protocolo](../protocol-specs).
