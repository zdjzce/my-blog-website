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
  串行钩子，插件间处理结果相互依赖的情况。前一个插件 Hook 的返回值作为后续插件的入参，需要等前一个插件执行完才能进行下一个插件 Hook 的调用，比如 `transform`。
4. **First**
   如果有多个插件实现了这个 Hook，会依次运行，直到返回非 null 或非 undefined 的值为止。比如 resolveId，一旦有插件的 resolveId 返回了一个路径，将停止后续插件的 resolveId 逻辑。

#### Build 阶段工作流
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58ce9fa2b0f14dd1bc50a9c849157e43~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)
1. options 钩子进行配置转换，得到处理后的配置对象。
2. 调用 `buildStart` 钩子，开始构建流程
3. 进入到 `resolveId` 钩子解析文件路径。（从 input 入口文件开始）
4. `load` 钩子加载模块
5. 执行 `transform` 钩子对模块内容进行转换，比如 babel
6. 拿到最后的模块内容，进行 AST 分析，得到所有 import 内容。调用 moduleParsed 钩子。
   - 如果是普通 import, 执行 resolveId 钩子，继续回到步骤3
   - 如果是动态 import, 执行 `resolveDynamicImport` 钩子解析路径，如果解析成功，则回到步骤 4 加载模块，否则回到步骤3。
7. 所有 import 都解析完，执行 `buildEnd` 钩子，Build 阶段结束。

若在解析路径时已经在 external 中添加相关依赖，就不会参与打包过程。

`watchChange` 和 `closeWatcher` 这两个 Hook，使用 `rollup --watch` 或者配置了 `watch: true`，Rollup 会在内部初始化一个 watcher 对象，内容发生变化，watcher 对象会自动触发 `watchChange` 钩子执行并对项目进行重新构建。在当前打包过程结束，Rollup 会自动清除 watcher 对象调用 `closeWatcher` 钩子

#### Output 工作流
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd1da89135034f3baa25c7349a79bd91~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5dc4935d712d451fb6978fad46dd7b74~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)
1. 执行 `outputOptions` 钩子函数，对 `output` 配置进行转换
2. 并发执行 `renderStart` 钩子，开始打包
3. 并发执行所有插件的 `banner`,`footer`,`intro`,`outro` 钩子（底层用 Promise.all ）
4. 从入口开始扫描，针对动态 import 执行 `renderDynamicImport` 钩子，来自定义动态 import 的内容。
5. 对即将生成的 `chunk` 执行 `augmentChunkHash` 钩子，来决定是否更改 chunk 的哈希值，在 `watch` 模式下即多次打包场景下，这个钩子比较有用
6. 如果没有遇到 `import.meta`，则进入下一步否则：
   - 对于 `import.meta.url` 语句调用 `resolveFileUrl` 来自定义 url 解析逻辑。
   - 对于其他 import.meta 使用 `resolveImportMeta` 进行自定义解析。
7. 生成所有 chunk 内容，针对每个 `chunk` 会依次调用插件的 `renderChunk` 方法进行自定义操作。在这一步能够直接操作打包产物。
8. 调用 `generateBundle` 钩子，钩子入参包含所有打包产物信息，包括 `chunk`、`assets`。
9. `rollup.rollup` 方法会返回一个 `bundle` 对象，对象包含 `generate` 和 `write` 方法。方法的区别在于后者会将代码写入到磁盘。同时触发`writeBundle` 钩子。传入所有的打包产物信息，包括 chunk 和 asset, 和 `generateBundle` 钩子非常相似。不过 `generateBundle`的时候产物并没有输出。
10. bundle 的 close 方法被调用时，会触发 `closeBundle` 钩子，output阶段结束。



#### 总结
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a353a4349c124b108a223f29bf8fc9e8~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.avis)
Rollup 的插件开发整体上是非常简洁和灵活的，总结为以下几个方面:
- 插件逻辑集中管理。各个阶段的 Hook 都可以放在一个插件中编写，比如上述两个 Webpack 的 Loader 和 Plugin 功能在 Rollup 只需要用一个插件，分别通过 transform 和 renderChunk 两个 Hook 来实现。
- 插件 API 简洁，符合直觉。Rollup 插件基本上只需要返回一个包含 name 和各种钩子函数的对象即可，也就是声明一个 name 属性，然后写几个钩子函数即可。
- 插件间的互相调用。比如刚刚介绍的alias插件，可以通过插件上下文对象的resolve方法，继续调用其它插件的 resolveId钩子，类似的还有load方法，这就大大增加了插件的灵活性。
