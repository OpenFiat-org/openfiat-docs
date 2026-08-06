---
title: Comerciantes
---

# Comerciantes

Os comerciantes publicam anúncios, gerenciam reservas e liquidações e monitoram
análises através do aplicativo web do OpenFiat,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) — os perfis de
comerciante, o assistente de pós-anúncio e a sala de negociação vivem ali.

Esse app está sendo migrado de dados de demonstração simulados para dados ao vivo
uma rota de cada vez, e os fluxos de comerciante estão entre as rotas que ainda
renderizam dados de demo. Trate o que você vê ali como a forma pretendida, e não
como sua própria contabilidade. A superfície do lado do nó por baixo —
`sendAdvertisementCreate`, `sendAdvertisementPriceUpdate`,
`sendAdvertisementDisable`, e os métodos de reserva e liquidação — é real hoje e
está documentada na [referência da API](../api).

O andaime mais antigo `openfiat-apps/merchant` não está mais em desenvolvimento
ativo; o novo trabalho de frontend está concentrado em `openfiat-app`.

Esta seção cobrirá a incorporação, as boas práticas de anúncio, o tratamento de
disputas e a conciliação de liquidações à medida que esses fluxos passarem para
dados ao vivo.
