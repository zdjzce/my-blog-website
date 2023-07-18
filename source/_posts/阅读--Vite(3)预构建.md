---
title: 阅读--Vite(3) 预构建
date: 2023-07-18 15:04:00
tags:
  - 阅读
  - 面试题
  - Vite
categories
  - [阅读]
---

Vite 是 `no-bundle` 的构建工具，相比于传统的 Webpack, 能做到开发时的按需编译，而不用先打包完再加载。

但其实所谓的 no-bundle 也只是针对业务层面上的代码进行按需加载，但第三方依赖的代码，即 `node_modules` ，Vite 还是选择 bundle(打包)，并且使用速度极快的 Esbuild 来完成，达到秒级的编译速度。

### 为什么需要预构建
首先 Vite 的 DevServer 完全是基于浏览器支持的 ESM 模块完成的。也就意味着如果第三方库不是 ESM 规范，Vite 会进行转换。否则 Vite 没法直接运行。此外，还有一个比较重要的问题就是：
假如引用了某个库的某个方法，而这个方法又有很多其他的依赖就会导致请求很多，这也意味着每个导入的依赖都是一个 import 请求，引用的越多依赖层级越深，就会触发很多网络请求，导致页面加载十分缓慢。如果进行了**依赖预构建**，这个库的代码会被打包成一个文件。请求数量就减少了, 页面加载就变快了。

总之，Vite 的依赖预构建做了两件事情
1. 将其他格式 如 UMD CJS 转换为 ESM 格式，使其在浏览器通过 `<script type="module"></script>`的方式正常加载。
2. 打包第三方库的代码，把各个第三方库分散的文件合并到一起，减少 HTTP 请求的数量，避免页面加载性能劣化。

而这都是基于性能优异的 `Esbuild` 完成的而不是传统的 Webpack/Rollup，所以也不会有明显的打包性能问题，反而是 Vite 项目启动飞快的一个核心原因。
注：Vite 1.x 是使用 Rollup 来进行依赖预构建


### 开启预构建
#### 自动开启
在启动项目的时候，可以看到根目录下的 node_modules 中多了 .vite 目录，这就是预构建产物存放的目录。而这些编译后的预构建产物，Vite 的 Dev Server 会设置强缓存。
![avatar](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dec47fc8960041d296965d9fca660645~tplv-k3u1fbpfcp-zoom-in-crop-mark:3326:0:0:0.awebp?)
如果以下三个地方没有改动， Vite 就会一直使用缓存文件。
1. package.json 的 dependencies 字段
2. 各种包管理器的 lock 文件
3. optimizeDeps 配置内容

#### 手动开启
少数场景下不希望用本地的缓存文件，比如需要调试某个包的预构建结果，可以使用下方的方法清除缓存：
1. 删除 node_modules/.vite 目录
2. 在 Vite 配置文件中，将 `server.force` 设为 true。在 Vite3.0 为optimizeDeps.force 设为true。
3. 命令行执行 `npx vite --force` 或者 `npx vite optimize`


Vite 项目的启动可以分为两步，第一步是依赖预构建，第二步才是 DevServer 的启动，npx vite optimize 相比于其他方案 仅仅完成第一步的功能。


### 自定义配置
#### 入口文件 entries
