---
title: 阅读--Vite(1)的优势
date: 2023-05-07 09:34:00
tags:
  - 阅读
  - Vite
categories:
  - [阅读]
---

现在的前端构建工具层出不穷，其实无论工具层面如何更新，解决的问题还是一样的：

- 前端的**模块化需求**: JS 的模块标准非常多，ESM、CommonJS、AMD 和 CMD 等等。前端需要保证这些模块能够正常加载，兼容不同的模块规范。
- **兼容浏览器，编译高级语法**: 浏览器的实现规范会限制高级语言/语法（TS，JSX等）。想要在浏览器运行就需要转换浏览器可以理解的形式，这需要工具链层面的支持。
- 线上代码的质量: 生产环境中，不仅要考虑代码的**安全性、兼容性**，保证线上代码的正常运行，也要考虑代码运行时的性能问题。浏览器版本很多，兼容性和安全策略各不相同。
- 开发效率: **项目的冷启动/二次启动时间、热更新时间**都会影响开发效率。当项目越来越庞大的时候，提高项目的启动速度和热更新速度也是重要需求。

前端构建工具是这么解决问题的：
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f54b17dcae4c49adb558b760048c3603~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)



### **为什么 Vite 是当前最高效的构建工具？**
如上文提到的，首先是开发效率，传统构建工具普遍缺点就是慢，Vite 能将项目的启动性能提升一个量级，达到毫秒级的瞬间热更新效果。

而 Webpack 启动华哥几分钟都是很常见的事情，热更新也经常需要等待十秒以上：
- 项目冷启动必须递归打包整个项目的依赖。
- JS 语言本身的性能限制，导致构建性能遇到瓶颈，直接影响开发效率。
  
而 Vite 就很好的解决了这个问题：
- Vite 在开发阶段基于浏览器原生 ESM 的支持实现了 `no-bundle` 服务，一个 import 就是一个请求，Vite 的 DevServer 在中间进行了处理将文件解析后交给浏览器渲染。Vite 借助 Esbuild 超快的编译速度来做第三方库构建和 TS/JSX 语法编译，从而能够有效提高开发效率。

除了开发效率，还有三个方面也很强：
- 模块化: Vite 基于浏览器原生 ESM 的支持实现模块加载，无论是开发还是生产，都可以将其他格式的产物(如CJS)转换为 ESM。
- 语法转译: 内置了对 TypeScript, JSX, SASS 等高级语法的支持，也能够加载各种静态资源。
- 产物质量: Vite 基于成熟的打包工具 Rollup 实现生产环境打包，同时可以配合 `Terser, Babel` 等工具链，可以极大程度保证构建产物的质量。
  

### **如何学好 Vite**

即使通过资料学完了 Vite 的相关知识，但因为对 Vite 的生态了解不够，遇到实际问题的时候依然不知道要使用哪些插件或者解决方案。

- 第三方库里面含有 CommonJS 代码导致报错了怎么办?
- 想在开发过程中进行 Eslint 代码规范检查怎么办？
- 生产环境打包项目后，如何产出构建产物分析报告？
- 如果要兼容不支持原生 ESM 的浏览器，怎么办？

而且，如果你对 Vite 底层使用的构建引擎 Esbuild 和 Rollup 不够熟悉，遇到一些需要定制的场景，往往也会捉襟见肘。

- 写一个 Esbuild 插件来处理一下问题依赖
- 对于 Rollup 打包产物进行自定义拆包，解决实际场景中经常出现的循环依赖问题
- 使用 Esbuild 的代码转译和压缩功能会出现哪些兼容性问题？如何解决？

作为构建工具，Vite 的难点不仅在于本身的灵活，也包含了如 Babel、core-js 等诸多前端工具链的集成和应用。

@babel/preset-env 的 useBuiltIns 属性各个取值有哪些区别？
@babel/polyfill 与 @babel/runtime-corejs 有什么区别？
@babel/plugin-transform-runtime 与@babel/preset-env 的 useBuiltIn 相比有什么优化？
core-js 的作用是什么？其产物有哪些版本？core-js 和 core-js-pure 有什么区别？

**基础使用**：从 0 开始实现 Vite 项目初始化，接入各种现代化的 CSS 方案，集成 Eslint、Styelint、Commonlint 等一系列 Lint 工具链，处理各种形式的静态资源，掌握 Vite 预编译的各种使用技巧，独立搭建一个相对完整的脚手架工程。

**双引擎篇**:  Vite 的双引擎架构， Esbuild 和 Rollup 相关的内容，包括它们的基本使用和插件开发，掌握最小必要知识，为后续的高级应用作铺垫。

**高级应用**: 我们将学习 Vite 的各种高级用法和构建性能优化手段，学会如何编写一个完整的 Vite 插件，熟练进行生产环境拆包，使用 Vite 搭建复杂的 SSR 工程，实现基于模块联邦的跨应用模块共享架构。

剖析 Vite 的核心源码，理解诸如JIT、Proxy Module、Module Graph、HMR Boundary和Plugin Container 等源码中重要概念的作用及底层实现

**手写实战**:  Vite 的开发时 no-bundle 服务，也就是开发环境下基于浏览器原生 ESM 的 Dev Server。然后，一步步完成一个生产环境打包工具（Bundler），从 AST 解析的功能开始，完成代码的词法分析（tokenize）和语义分析（parse），实现模块依赖图和作用域链的搭建，并完成 Tree Shaking、循环依赖检测及 Bundle 代码生成，最终实现一个类似 Rollup 的 Bundler。
![avatar](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52599ad0dbb344d59eafb00f360e99c3~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)
