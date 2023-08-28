---
title: 阅读--Node.js(1)
date: 2023-08-26 14:42:12
tags:
  - 阅读
  - Node.js
categories:
  - [阅读]
---

Node.js 是一个 JavaScript `运行时环境`，它的语言是 JavaScript，这就跟 PHP、Python、Ruby 不同，它们既代表语言也代表执行它们的运行时环境（或解释器）。

### Node.js 特点

Node.js 主推 `单线程`, `天然异步 API` 下的高性能运行时，单线程意味着业务逻辑不用考虑各种锁的问题，天然异步 API，意味着可以方便处理高并发。它提供了基于 `事件驱动` 和 `非阻塞的接口` ，可用于编写高并发状态下的程序，而且 JS 中的匿名函数，闭包，回调函数等特性就是为事件驱动而设计的。

服务端：Node.js 的一些内置模块如 `http`, `net`, `fs` 等，就是为服务端设计的，并且周边有很多基于 HTTP 或 TCP、UDP 的框架。除了 HTTP 服务， RPC 服务与 HTTP 类似，都是要异步处理并发，只是在长短连接上会有不同，在协议的序列化与反序列化上不同而已。

工具：除了服务端外，Node.js 提供的如 `tty`, `repl`, `readline` 等内置模块，同时又为创造各种工具提供了方便的能力。

桌面端：从 NW.js 到 `Electron.js`，众多注明软件都是基于 Electron 开发，比如微软的 VSCode, 又比如 1Password, 钉钉等。

端游：Lua, Python, Ruby 都能写端游（不是大型游戏），同为脚本语言JS也可以，而且有 V8 的加持至少性能上不会劣化，除了通过 WebGL 在浏览器里面写前端页面上的游戏、通过 Electron 封装成看起来像端游的游戏， JavaScript 自然还能够通过 Node.js 的 `binding` 去使用 OpenGL 甚至 DirectX 去写真实桌面上的游戏，比如 sfml.js。


后来的 `Serverless` 的出现，Node.js 相比于其他的运行时，在`冷启动速度`上有着绝对的优势，所占`资源也小`很多，再加上 Node.js 在冷启动速度上下了比较大的功夫，从 Node.js 自身的 `Snapshot` 再到用户侧 `Snapshot` 一一解决。

**一圈看下来，Node.js 涵盖了泛前端和后端，传统服务和 Serverless， 工具，商业，游戏等等**，就连机器学习也可以，反正最后 binding 一个就好了，直接在 JS 里头调 API，一样的。

### Node.js 与 Web-interoperable Runtime
Web-interoperable Runtime 简称 Winter, `Web 可互操运行时`。所谓可互操就是运行时之间可以互相替代，互相兼容的，各种浏览器就是可互操的，经过标准化之后，API 长得都一样，这就是所谓的互通性。

Winter 就是针对服务端 JavaScript 提出的一种规范，只要大家都遵循了 Winter 规范，那么整个生态都是共享的，经过规范化标准化后，国际上的几家厂商一起新建了一个组织叫做 WinterCG。Winter 目前遵循的路线就是，取 Web API(Service Worker) 的子集，不定义新的 API。

--
相较于轻量级的 Winter 来说，其实 Node.js 还是显得重了。比如，阿里巴巴动辄亚毫秒级进程冷启动速度的 Noslate，以及字节跳动用于 FaaS、边缘等业务的 Hourai.js，都属于更轻量级的 Winter。市面上有名的 Winter 还有 CloudFlare Workers。
--

### 总结
Node.js 经过了十多年发展，其可覆盖的领域已非常完善。从最开始的专注于服务端，到后面泛前端工具链、桌面端、游戏等一应俱全。部署模式也从传统应用到了现在的 Serverless。