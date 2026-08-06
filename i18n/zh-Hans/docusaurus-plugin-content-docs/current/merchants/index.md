---
title: 商家
---

# 商家

商家通过 OpenFiat 网页应用
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) 发布广告、
管理预约与结算，并监控分析——商家资料、发布广告向导
和交易室都在那里。

那个应用正在逐条路由地从模拟演示数据切换到实时数据，
而商家流程属于仍在渲染演示数据的路由之一。
把你在那里看到的东西当作预期的形态，而非你自己的账簿。
其下的节点侧接口——`sendAdvertisementCreate`、
`sendAdvertisementPriceUpdate`、`sendAdvertisementDisable`，以及
预约和结算方法——今天是真实的，并已在
[API 参考](../api)中记录。

较旧的 `openfiat-apps/merchant` 脚手架不再处于活跃
开发；新的前端工作集中在 `openfiat-app`。

本节将随着这些流程迁移到实时数据，涵盖入驻、广告
最佳实践、争议处理和结算对账。
