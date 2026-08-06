---
title: Descoberta de peers
sidebar_position: 3
---

# Descoberta de peers

Um nó entra discando um entrypoint e encontra o resto da rede por si mesmo. A
descoberta de peers (OFS-1100) troca peers conhecidos sobre a mesma conexão que o
gossip já usa, então um nó aprende peers que nunca lhe foram dados e anuncia os
endereços em que é alcançável.

Vale enunciar isso com clareza porque nem sempre foi verdade, e a falha era
invisível: o serviço de descoberta estava plenamente implementado e convergiu
cinco nós em seu próprio teste, e nenhum nó em execução jamais construiu um. Os
nós não anunciavam nenhum endereço e não aprendiam nenhum peer que não lhes
tivesse sido dado estaticamente, enquanto pareciam inteiramente saudáveis a cada
checagem local. Um nó tem um swarm libp2p, só uma coisa pode dirigir o loop de
eventos desse swarm, e o gossip a tinha — então o serviço que não era dono do
swarm não recebia nada, para sempre. Ambos agora compartilham uma conexão, e as
mensagens são roteadas para um ou outro pelo próprio número de spec OFS do
envelope.

A descoberta não é um flag e não pode ser desligada.

## A primeira conexão

Nada pode encontrar uma rede a partir do nada, então `--entrypoint` ainda é como
um nó começa:

```bash
openfiat-node --entrypoint /dns4/openfiat.allenhark.com/udp/4001/quic-v1/p2p/12D3KooW...
```

Repita-o para vários. Um hostname funciona e é preferido — o nó o resolve na
partida por meio do próprio resolvedor do sistema operacional, então o cluster
sobrevive à mudança do IP do entrypoint. **Mantenha o sufixo `/p2p/<peer id>`**:
o DNS não é autenticado, e o peer id é o que faz um registro sequestrado falhar o
handshake em vez de silenciosamente se tornar o seu único peer.

Um entrypoint que não vá resolver interrompe o nó na partida em vez de ser
pulado. Um nó que descartasse um em silêncio subiria sem peers algum e pareceria
perfeitamente saudável enquanto não fala com ninguém — que é exatamente a falha
com que esta seção abriu.

Comece sem nenhum entrypoint e o nó diz isso, em `WARN`. Isso é correto para o
primeiro nó de um cluster novo e errado para todos os demais.

## O que o seu nó anuncia sobre si mesmo

Cada endereço em que o nó sabe que está escutando, menos o curinga de bind.
`0.0.0.0` e `::` são instruções de escuta que significam «cada interface local»,
não destinos — e como `--gossip-bind-address` por padrão é exatamente isso,
anunciá-lo sem filtro é precisamente o bug que deixa os peers sem nada para
discar.

Os intervalos de loopback e privados deliberadamente *não* são filtrados. Os
processos em um host se alcançam por loopback, um cluster docker-compose ou uma
LAN alcança seus peers só por endereço privado, e um cluster de host único é uma
implantação real, e não um artefato de teste.

### Atrás de NAT, em um container, ou em um host de nuvem com um IP mapeado

O endereço que o seu nó faz bind não é o endereço em que os peers podem
alcançá-lo, e o nó não pode deduzir o público. Isso não é uma omissão — por
construção, só algo do outro lado do NAT pode observar o endereço público. Então
o operador o declara:

```bash
--external-addr /ip4/203.0.113.7/udp/4001/quic-v1
```

Repetível. Os endereços declarados são anunciados **antes** dos vinculados, então
um peer que os tenta em ordem conecta na primeira tentativa em vez de esgotar o
tempo em `172.17.0.2`. Os endereços vinculados ainda são anunciados também —
descartá-los corrigiria o caso remoto quebrando o local.

Omita o flag se o seu nó está genuinamente em uma interface pública. Seu endereço
vinculado já é o seu público.

## Perguntando a um nó o que ele sabe

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getPeers","params":{}}' | jq
```

```json
{
  "self_peer_id": "12D3KooWK9hQ7TwbfvFiaAxUbRFCkdhS7iEpAJDnewNL1anyREQ1",
  "announced_addresses": ["/ip4/203.0.113.7/udp/4001/quic-v1"],
  "peers": [
    {
      "peer_id": "12D3KooW...",
      "addresses": ["/ip4/198.51.100.4/udp/4001/quic-v1"],
      "node_version": "openfiat/0.1.0",
      "supported_ofs": [1000, 1100, 1200, 1300, 1400, 1500, 2000, 2100, 2200, 2300, 2400, 3000, 4000, 4300, 6000, 7000, 8200],
      "roles": ["MerchantGateway", "OracleProvider", "NotificationGateway", "RiskIntelligenceProvider"],
      "last_seen": 1753800000000,
      "latency_ms": 42,
      "successes": 17,
      "failures": 0
    }
  ]
}
```

Três coisas valem a pena saber sobre essa resposta.

`self_peer_id` é a forma `12D3Koo…` que vai no entrypoint que você publica a
outros operadores. Um nó que não pode declarar seu próprio peer id não pode ser
unido, e montá-lo a partir de uma linha de log é como ele é digitado errado.

`announced_addresses` é o que você está dizendo aos peers para discar, na ordem
em que os tentarão. «Meu nó não anuncia nada» foi invisível de fora enquanto foi
verdade, e um operador que confere se o seu `--external-addr` surtiu efeito não
tem nenhum outro lugar para olhar.

`successes` e `failures` são a contagem **do próprio nó** de trocas com aquele
peer. Deliberadamente não há porcentagem de tempo ativo nem pontuação de saúde:
dobrar as duas contagens em um número apresentaria a experiência local de um
único nó como um veredito de toda a rede, e dois nós honestos podem discordar
sobre ambas.
