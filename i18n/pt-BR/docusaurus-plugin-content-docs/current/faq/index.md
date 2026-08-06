---
title: Perguntas frequentes
---

# Perguntas frequentes

**OpenFiat é uma blockchain?**
Não. OpenFiat é um protocolo de coordenação entre pares construído sobre a
Solana, que cuida da liquidação.

**Meu nó precisa de um daemon IPFS separado?**
Não. Um nó serve o conteúdo do protocolo por si mesmo, sobre sua própria
identidade libp2p, e está ligado por padrão — `--ipfs-api-url` e um daemon Kubo
já não são como isso funciona. Veja [serviço de conteúdo](../node-operators/content-serving).

**Tenho que listar cada peer com que meu nó deve falar?**
Não. `--entrypoint` faz a primeira conexão; depois disso um nó aprende peers que
nunca lhe foram dados e anuncia os endereços em que é alcançável. Veja
[descoberta de peers](../node-operators/peer-discovery).

**Quem opera o OpenFiat?**
A AllenHark lidera o desenvolvimento inicial e financia o crescimento inicial,
com o objetivo explícito de longo prazo de descentralização progressiva — veja o
[Prefácio](../whitepaper) e o Capítulo 24 (Governança e Evolução do Protocolo).

**Sob qual licença está o código?**
Apache License 2.0, em cada repositório de
[OpenFiat-org](https://github.com/OpenFiat-org).

**Onde reporto um problema de segurança?**
Veja `SECURITY.md` no repositório correspondente — não abra um issue público.
