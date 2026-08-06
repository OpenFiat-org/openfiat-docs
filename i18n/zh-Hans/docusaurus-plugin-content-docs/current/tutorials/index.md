---
title: 教程
---

# 教程

下面的每个指南都是一个真实、可运行的 [SDK](../sdks) 示例——在 CI 中
针对一个实时节点测试过，而不只是文字。请先启动一个本地节点：

```bash
git clone git@github.com:OpenFiat-org/openfiat-core.git
cd openfiat-core
cargo run -p openfiat-cli -- --rpc-bind-address 127.0.0.1:7080
```

- **[构建一个交易机器人](trading-bot)**——发布一个广告，
  对它开一个预约。
- **[注册一个通知提供者](notification-provider)**——
  在服务注册中注册，报告一次投递。
- **[注册一个预言机提供者](oracle-provider)**——在
  服务注册中注册，发布一个已签名的汇率。
