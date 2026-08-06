---
title: Carteira
---

# Carteira

Há uma visão de carteira no aplicativo web do OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) (`/wallet`), e ela
ainda renderiza dados de demonstração — o app está sendo movido para dados ao
vivo uma rota de cada vez, e esta não é uma das rotas que migraram.

Uma carteira independente multiplataforma (Android, iOS, Linux, macOS, Windows,
Web) permanece adiada. O marcador de posição para ela em `openfiat-apps` nunca
foi armado, e esse repositório não está mais em desenvolvimento ativo.

Até então, um nó nunca guarda nem assina nada por você: cada mutação é uma carga
que o seu próprio par de chaves assina localmente e submete — veja
[nomenclatura de métodos](../api) e qualquer [SDK](../sdks) para a primitiva de
assinatura.
