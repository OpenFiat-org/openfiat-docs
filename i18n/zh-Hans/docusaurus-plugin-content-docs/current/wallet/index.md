---
title: 钱包
---

# 钱包

OpenFiat 网页应用
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app)（`/wallet`）中有一个
钱包视图，它仍在渲染演示数据——该应用正在逐条路由地迁移到
实时数据，而这不是已迁移的路由之一。

一个独立的跨平台钱包（Android、iOS、Linux、macOS、Windows、Web）
仍被推迟。它在 `openfiat-apps` 中的占位从未被
搭建起来，而那个仓库不再处于活跃开发。

在此之前，一个节点从不为你持有或签署任何东西：每一次变更都是一份
由你自己的 keypair 在本地签署并提交的载荷——参见
[方法命名](../api)以及任一[SDK](../sdks)中的签名原语。
