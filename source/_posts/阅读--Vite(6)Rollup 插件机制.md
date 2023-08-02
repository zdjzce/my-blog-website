---
title: 阅读--Vite(5) Rollup
date: 2023-08-02 17:00:00
tags:
  - 阅读
  - 面试题
  - Vite
  - Rollup
categories
  - [阅读]
---

仅仅使用 Rollup 内置的打包能力很难满足复杂的构建需求。有可能还需要考虑到模块打包之外的问题。比如**路径别名（alias），全局变量和代码压缩**等等

如果将这些处理逻辑都和打包逻辑混合在一起，打包器本身会变得臃肿，会有很多与核心流程无关的代码，不易于维护。因此，Rollup 设计出了一套完整的插件机制。将**自身的核心逻辑与插件逻辑分离**。 

Rollup 的打包过程中有一套完整的**构建生命周期**，从开始打包到产物输出，中途会有各自的阶段，并且在不同阶段会自动执行对应的**插件钩子**函数。


### Rollup 整体构建阶段

Rollup 内部主要经历了 `Build` 和 `Output` 两大阶段：
  首先，Build 阶段主要负责`创建模块依赖图`，初始化各个模块的 `AST` 以及`模块之间的依赖关系`。

```ts
// src/index.js
import { a } from './module-a';
console.log(a);

// src/module-a.js
export const a = 1;
```


然后执行构建脚本:
```js
const rollup = require('rollup')
const util = require('util')

async function buildCheck() {
  const bundle = await rollup.rollup({
    input: ['./src/index.js']
  })
  console.log('bundle:', bundle)
}

buildCheck()
```

可以看到这样的 bundle 信息：
```js
bundle: {
  cache: {
    modules: [ [Object], [Object], [Object] ],
    plugins: [Object: null prototype] {}
  },
  // 挂载后续阶段会执行的方法
  close: [AsyncFunction: close],
  closed: false,
  generate: [AsyncFunction: generate],
  watchFiles: [
    '/Users/zdj/practice/rollup-demo/src/index.js',
    '/Users/zdj/practice/rollup-demo/src/util.js',
    '/Users/zdj/practice/rollup-demo/src/module-a.js'
  ],
  write: [AsyncFunction: write]
}
```

从信息可以看出，经过 Build 阶段的 bundle 对象其实没有进行模块打包。这个对象的作用在于**存储各个模块的内容及依赖关系**，同时暴露`generate` `write`方法，以进入到后续的 `Output` 阶段。（write会写入磁盘，generate 不会）。

可以使用 generate 观察在 Output 阶段下的输出：
```js
const rollup = require('rollup')
const util = require('util')
const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const inputOptions = {
  input: ['./src/index.js'],
  plugins: [resolve(), commonjs()]
}
async function buildCheck() {
  // build 阶段
  const bundle = await rollup.rollup(inputOptions)
  // console.log('bundle:', util.inspect(bundle))


  // output 阶段
  const result = await bundle.generate({
    format: 'es'
  })
  console.log('result:', result)
}

buildCheck()

// 输出结果：
result: {
  output: [
    {
      exports: [],
      facadeModuleId: '/Users/zdj/practice/rollup-demo/src/index.js',
      isDynamicEntry: false,
      isEntry: true,
      isImplicitEntry: false,
      moduleIds: [Array],
      name: 'index',
      type: 'chunk',
      dynamicImports: [],
      fileName: 'index.js',
      implicitlyLoadedBefore: [],
      importedBindings: {},
      imports: [],
      modules: [Object: null prototype],
      referencedFiles: [],
      code:'.....'
    }
  ]
}
```

因此，对于一次完整的构建过程如下：
1. Rollup 会先进入到 Build 阶段，初始化 AST 以及分析各个模块间的依赖，然后生成依赖图。
2. 然后进入到 Output 阶段，完成打包及输出的过程。


### 拆解插件工作流
对于不同的阶段， Rollup插件都会有不同的插件工作流程。

#### 插件 Hook 类型。
Rollup 可以根据 Build 和 Output 两个构建阶段分为两类 Hook `Build Hook` 和 `Output Hook`。

- Build Hook 主要负责模块代码的转换、AST 解析、以及模块依赖的解析。这个阶段的 Hook 对于代码的操作细粒度为模块级别，也就是单文件。
- Output Hook 主要进行代码的打包，对于代码而言，操作细粒度一般为 `chunk` 级别(很多文件打包到一起的产物)。

除了根据构建阶段分类，还可以根据执行方式分类： `Async`, `Sync`, `Parallel`, `Sequential`, `First` 五种阶段。


1. **Async Sync** 
  代表异步和同步钩子函数，两者最大的区别就是同步钩子里面不能有异步逻辑，而异步钩子可以有。
2.  **Parallel** 
  并行的钩子函数，如果有多个插件实现了这个钩子的逻辑，一旦有钩子函数是异步逻辑则并发执行，不会等待当前钩子完成(底层使用 `Promise.all`)
  比如 `Build` 阶段的 `buildStart` 钩子，它的执行时机其实是在构建刚开始，插件可以做一些状态初始化。但插件之间的操作并不需要相互依赖。也就是可以并发执行。从而提升构建性能。如果需要依赖其他插件的处理结果就不适合用此钩子，比如 `transform`
3. **Sequential**