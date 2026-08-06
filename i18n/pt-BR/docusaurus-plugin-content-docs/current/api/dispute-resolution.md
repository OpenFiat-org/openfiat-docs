---
title: Como uma disputa se resolve
---

# Como uma disputa se resolve

Uma disputa tem duas metades, e apenas uma delas decide algo.

A **camada off-chain** coleta. Ela verifica a assinatura de cada árbitro,
confere uma revelação contra o compromisso anterior desse árbitro, recusa uma
revelação de uma carteira que nunca se comprometeu, descarta duplicatas e
replica o resultado para que cada nó veja a mesma evidência.

A **cadeia** decide. Ela conta os votos revelados sob suas próprias regras —
ponderados por stake, com um piso de votos contados, reabrindo uma rodada em um
empate em vez de desempatá-la — e move a custódia.

## A camada off-chain não faz a contagem

Ela fazia. `getDispute` retornava uma resolução derivada das revelações que um
nó havia visto, e isso era errado de um modo que vale entender, porque é um
erro que se parece com ajuda.

**Duas contagens dos mesmos votos são um gerador de divergência, não uma
segunda opinião.** A cadeia rearbitra sob regras diferentes, então pode chegar
a uma resposta diferente sobre a mesma disputa — e quando chega, a interface
mostra um desfecho enquanto o dinheiro segue o outro. A cadeia é a autoridade
sobre a custódia, então a resposta off-chain não é uma segunda opinião: é uma
afirmação que o protocolo faz e depois contradiz com seus próprios fundos.

Por isso `resolution` é definido por exatamente uma coisa: uma transação de
execução que este nó observou confirmar de forma independente, cujo desfecho ele
então leu da conta do caso na cadeia.

## `AwaitingChainExecution` é uma resposta real

Quando chega cada revelação exigida, o caso fica em `AwaitingChainExecution`.
Esse estado diz que a camada off-chain terminou seu trabalho e que a custódia
ainda não se moveu. Não é «resolvido pendente de execução» — essa formulação
reivindicaria um desfecho que o nó não tem o direito de nomear.

Um nó que viu uma transação aterrissar mas não conseguiu ler o que ela decidiu
**permanece** em `AwaitingChainExecution` e registra a assinatura que observou.
Algo aconteceu na cadeia e este nó ainda não sabe o quê; dizer isso é a resposta
honesta, e inventar um veredito para preencher a lacuna é exatamente a falha que
esta regra elimina.

## O acordo entre as partes não é uma exceção

Ambas as partes podem acordar um acerto mútuo, e a camada off-chain verifica as
duas assinaturas diretamente. Ela registra esse acordo assim que o tem — isso é
um fato real sobre o caso, e retê-lo esconderia das partes a decisão delas
mesmas.

Mas registrar um acordo não é registrar uma resolução. Até que a custódia tenha
de fato se movido, o caso está em `AwaitingChainExecution` como qualquer outro.

Este é fácil de errar, porque, ao contrário de uma decisão, aqui não há cálculo
que dois nós pudessem realizar de modo diferente — o acordo simplesmente *é* as
duas assinaturas. Ainda assim precisa esperar, por duas razões:

- **Assinaturas não movem dinheiro.** Um caso marcado como `MutualSettlement`
  enquanto os fundos seguem bloqueados diz a ambas as partes que a disputa
  acabou e foi paga, quando nenhuma das duas coisas é verdade.
- **A cadeia executa nos seus próprios prazos.** Ela continua livre para
  executar um desfecho arbitrado em um caso cujas partes concordaram em privado
  e nunca o transmitiram — pondo as duas camadas de volta em contradição sobre
  uma única disputa, que é o que toda esta regra existe para evitar.

## O que um cliente deve mostrar

| O nó diz | Mostrar |
| --- | --- |
| `resolution: null`, estado `AwaitingChainExecution` | O caso está decidido ou acordado; a custódia ainda não se moveu |
| `resolution` definido, com uma assinatura de execução | O desfecho, e a transação da qual ele veio |
| Revelações coletadas, sem mudança de estado | Coleta de evidências; não existe desfecho a exibir |

Não derive um desfecho das revelações em uma resposta de `getDispute`. Elas
estão ali para que qualquer um possa auditar o que foi dado à cadeia, não para
que um cliente chegue ao próprio veredito — um cliente que as conta reintroduziu
exatamente a divergência que o nó parou de produzir.

Veja OFS-2400 §16.2 e §17 para o enunciado normativo.
