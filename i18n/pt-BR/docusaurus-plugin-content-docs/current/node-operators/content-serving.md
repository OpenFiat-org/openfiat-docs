---
title: Serviço de conteúdo
sidebar_position: 2
---

# Serviço de conteúdo

Um registro do protocolo nunca carrega um arquivo. Ele carrega um CID — um hash
autodescritivo de conteúdo armazenado em outro lugar — o que mantém um recibo de
10 MB fora de uma carga de gossip que cada nó deve armazenar e reproduzir, ao
mesmo tempo que ainda permite a um árbitro estabelecer que a imagem que ele olha
é a que a parte assinou.

Alguém ainda tem de guardar os bytes. Esse alguém é o seu nó, e **ele já está
fazendo isso**: o serviço de conteúdo está ligado por padrão e não precisa de
configuração.

## Por que está no nó e não em um daemon

A primeira versão disto fixava (pin) por meio de um daemon
[Kubo](https://github.com/ipfs/kubo) separado, alcançado por `--ipfs-api-url`.
Aquilo funcionava, e custava mais do que parecia: uma segunda identidade de peer
na rede, um runtime Go e sua memória residente ao lado da do nó, e uma superfície
de controle `/api/v0` não autenticada na porta 5001 que permite a qualquer um que
a alcance fixar, desfixar e ler tudo o que o daemon guarda — mitigada apenas por
vinculá-la a loopback.

O problema mais profundo era o padrão. Executar um daemon é trabalho, então
fixar era opcional, então quase ninguém o teria ligado — e uma garantia de
durabilidade em que ninguém opta não é uma garantia. Um nó agora fala bitswap em
processo, sobre a mesma identidade libp2p com que já faz gossip, o que permite
que o comportamento esteja ligado por padrão. Isso, por sua vez, é o que faz o
prêmio de recompensa medir algo real: com todos servindo, o multiplicador separa
os nós que genuinamente guardam e respondem pelo conteúdo dos nós que estão
offline ou podaram, em vez de separar os operadores que se deram ao trabalho de
instalar Go dos que não.

## O que o seu nó guarda, e o que não

Ele guarda o conteúdo referenciado pelos registros de anexos que **aceitou**,
dentro de sua janela de retenção. Ele não busca cada CID que vê — um nó que
buscasse estaria armazenando o que quer que qualquer um decidisse apontar para
ele.

Esse limite não é uma promessa, é aritmética: um anexo deve nomear uma
liquidação, e uma liquidação precisa de uma reserva real contra escrow real. O
teto do que se pede ao seu disco é o volume de negociações real da rede, não a
paciência de um estranho.

Tudo que é recuperado é conferido contra seu CID antes de ser guardado, quer
tenha vindo de um peer ou de um gateway.

Pergunte ao seu nó o que ele está guardando:

```bash
curl -s -X POST http://localhost:7080/rpc -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHeldContent","params":{"cid":"bafkrei..."}}'
# {"jsonrpc":"2.0","id":1,"result":{"content":"<base64>"}}   ← guardado
# {"jsonrpc":"2.0","id":1,"result":{"content":null}}          ← não guardado
```

## De onde vem a primeira cópia

Bitswap move blocos entre peers que já os têm; ele não cria o primeiro. O
conteúdo entra na rede por meio de qualquer serviço de pinning para o qual a
interface o subiu, então o primeiro nó a querer um CID tem de obtê-lo da rede
IPFS mais ampla, conferir os bytes contra o CID, e servi-lo aos seus peers a
partir de então.

```bash
--content-gateway https://ipfs.example.com   # padrão: https://ipfs.filebase.io
```

O gateway é **transporte não confiável**, não uma autoridade. Ele pode servir os
bytes errados, nenhum byte, ou registrar quem pediu o quê; ele não pode mudar
qual conteúdo um CID nomeia, porque o CID é um hash desse conteúdo. Os bytes que
não são o que o CID nomeia são recusados, e um gateway que substitui qualquer
coisa é indistinguível de um que simplesmente está fora do ar.

A privacidade é a única coisa que a verificação não corrige: quem opera o gateway
descobre que o seu nó pediu este CID. É por isso que o flag existe — aponte-o
para o seu próprio — e por isso é um fallback e não uma primeira escolha. O seu
nó prefere seus peers.

## Se você já executa Kubo

`--ipfs-api-url http://127.0.0.1:5001` ainda funciona e agora significa algo mais
estreito do que antes: o conteúdo do protocolo é fixado no seu daemon **também**,
pondo uma cópia em algum lugar que a própria janela de retenção do seu nó não
governa. Já não é como um nó serve conteúdo.

## Desligá-lo, e o que isso custa

```bash
openfiat-node --no-content-serving
```

Esse nó não armazena nada e não pode responder a um desafio de recuperabilidade,
então ganha a parcela reduzida. Esse é o resultado honesto — ele está fazendo
menos pela rede — e é o flag certo se o disco genuinamente não está lá. O nó
ainda desafia seus peers de qualquer modo: medir quem serve conteúdo é um serviço
que um nó realiza quer armazene algo ele mesmo ou não.

### Como o desafio funciona

Um nó escolhe um CID que a rede conhece, pede a outro nó os bytes, e faz o hash do
que volta. Um endereço de conteúdo *é* o hash de seu conteúdo, então devolver os
bytes certos não é algo que um nó possa fazer sem tê-los. Este é o único sinal de
qualidade de nó que é conferido em vez de acreditado.

Só alguns CIDs podem decidir a questão. O digest de um CID de codec raw é tomado
sobre o próprio arquivo; um CID dag-pb endereça a raiz de um DAG fatiado, então um
peer poderia devolver o arquivo correto e ainda assim falhar uma conferência de
hash ingênua. Os provedores alternam entre os dois em 262.144 bytes, então os
desafios amostram arquivos em ou abaixo de 256 KiB — avatares quase sempre,
anexos às vezes. Isso é suficiente para separar um nó que fixa tudo de um que não
fixa nada, que é o que o multiplicador precisa; não é uma prova de que um nó
guarda um anexo grande específico, e nada afirma que seja.

### O que é o multiplicador

Um nó que responde mantém sua parcela completa; um nó que não pode é escalado a
**0.7**, então um nó que serve ganha cerca de 1.43× o que ganha um nó de resto
idêntico que não serve. Ambas as cifras são `[PROPOSED — NEEDS SIGN-OFF]` — veja
OFS-4100 §9.2 e `crates/rewards/src/params.rs`.

O prêmio é expresso como uma penalidade por uma razão que não é de apresentação.
A emissão por época é fixa, e esses multiplicadores decidem como ela é
*dividida*. Um bônus acima de 1.0 não pagaria a um nó que fixa a partir do nada,
ele cunharia emissão que o balde de Infraestrutura não contém — o que os
parâmetros de recompensa rejeitam de imediato. Então o nó que fixa mantém sua
parcela completa e o nó que não fixa cede parte da sua.

0.7 em vez do 0.4 do só-gossip porque armazenamento é um favor menor à rede do
que uma conexão à cadeia: um nó que não fixa ainda retransmite, valida e serve
tudo o mais.

## Por quanto tempo o conteúdo é mantido

Nem todo nó deve carregar a história inteira.

```bash
--retention 30          # o padrão: uma janela móvel de 30 dias
--retention 365         # uma janela mais longa, ainda móvel
--retention archival    # guardar tudo, para sempre — uma escolha explícita
```

30 dias é também o piso que cada nó deve à rede, então valores menores são
**recusados** em vez de elevados em silêncio — um nó configurado para sete dias
que rodasse em silêncio por trinta estaria fazendo algo diferente do que seu
operador pediu.

Esse piso é o que permite à expulsão e às recompensas coexistir. Os desafios só
são sempre extraídos de conteúdo dentro dele, então um nó móvel que expulsou
corretamente a evidência do ano passado nunca é interrogado sobre ela e nunca
perde sua parcela por ter feito a coisa certa. Igualmente, nenhum nó pode reduzir
o que pode lhe ser perguntado declarando uma janela menor.
