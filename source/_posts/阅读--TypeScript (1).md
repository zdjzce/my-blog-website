---
title: 阅读--TypeScript(1)
date: 2023-05-03 23:01:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---

TypeScript 已被开发人员普遍接受，和 ES6 语法以及前端框架一起，被视为前端开发领域的基础工具。但是，关于 TypeScript 的质疑却一直没有减少，比如：

- 限制了 JavaScript 的灵活性；
- 并不能提高应用程序的性能；
- 开发需要更多额外的类型代码。

### TS 的好处
由于类型的引入，TypeScript 的确限制了 JavaScript 的灵活性，但也增强了项目代码的健壮性，并且对于其他同属于灵活性的代表特性，如 this、原型链、闭包以及函数等，TypeScript 丝毫没有限制。

当项目规模增大到某一阈值后，类型代码会是你开发时最得力的助手。让你有底气大胆地进行各种逻辑操作，不需要先把这些值都打印出来确认一遍。

而在最终编译时，TypeScript 又会将这些类型代码抹除，还给你可以直接放进浏览器里跑的、纯粹的 JavaScript 代码。因此，TypeScript 确实不能提高应用程序的性能，因为最终运行的仍然是 JavaScript。

总的来说，TypeScript 对开发效率的影响和项目的规模息息相关。在小项目中，TypeScript 确实不可避免地降低了项目的开发效率。但如果我们放眼于项目的整个生命周期，得益于严密的类型检查与如臂使指的类型推导，TypeScript 不仅避免了 JavaScript 灵活性可能会带来的隐患，还能让你在面对 Bug 时更快地定位问题，让程序跑得更稳定一些！从这个方面来说，TypeScript 对开发效率的提升是终身制的。

### 如何学习TS
TypeScript 由三个部分组成：类型、语法与工程。

首先是**类型能力**。它是最核心的部分，也是学习成本最高的部分。它为 JavaScript 中的变量、函数等概念提供了类型的标注，同时内置了一批类型工具，基于这些类型工具我们就能实现更复杂的类型描述，将类型关联起来。

接着是**语法部分**。比如支持了新的语法，可选链（?.）、空值合并（??）、装饰器等，这些语法都已经或即将成为 ECMAScript Next 的新成员。在 TypeScript 中使用这些新语法时，只需简单的配置就能实现语法的降级，让编译后的代码可以运行在更低的浏览器或 Node 版本下。

类型能力与新语法确实很棒，但浏览器不认怎么办？TypeScript 会在构建时被抹除类型代码与语法的降级。这一能力就是通过 TypeScript Compiler（tsc）实现的。tsc 以及 tsc 配置（TSConfig）是 TypeScript 工程层面的重要部分。除此以外，TypeScript 工程能力的另一重要体现就是，我们可以通过类型声明的方式，在 TypeScript 中愉快地使用 JavaScript 社区的大量 npm 包。

类型、语法、工程其实也代表了三个不同阶段使用 TypeScript 目的：为 JavaScript 代码添加类型与类型检查来确保健壮性，提前使用新语法或新特性来简化代码，以及最终获得可用的 JavaScript 代码。因此，类型-语法-工程，也是学习 TypeScript 的最佳路径。

### 插件

[TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter): 自动引入文件

[Move TS](https://marketplace.visualstudio.com/items?itemName=stringham.move-ts): 右键修改目录其他文件能够自动替换，也会自动生成文件夹。

typescript Inlay Hints: vscode 内部的设置，类型推断智能提示更友好。
![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b52df396bc824134a1baed397c11d328~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

[Playground](https://www.typescriptlang.org/zh/play): 能写 TypeScript，能检查错误，能快速地调整 tsconfig。

在这里编写 TS 代码，快速查看编译后的 JS 代码与声明文件，还可以通过 Shift + Enter 来执行 TS 文件。

Playground 最强大的能力其实在于，支持非常简单的配置切换，如 TS 版本（左上角 ），以及通过可视化的方式配置 tsconfig （左上角的配置）等，非常适合在这里研究 tsconfig 各项配置的作用。

![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c402069d1bc541398e4c6d24571d453b~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

### TS 文件的快速执行：ts-node 与 ts-node-dev
ts-node 能够执行 ts 文件，就像 `node index.js` 一样，ts-node-dev 则是像 `nodemon` 可以监听文件的变更对 ts 重新执行。

#### ts-node
全局安装 ts-node 和 ts
```bash
$ npm i ts-node typescript -g
```

如果全局安装了 TypeScript，可以这么做:
```bash
tsc --init
```

接着，创建一个 TS 文件：
```ts
console.log('hello ts')
```

再使用 ts-node 执行 (这里用了 alias ts-node)
```bash
tsn index.ts
```

如果一切正常，此时终端能够正确地输出字符。ts-node 可以通过两种方式进行配置，在 tsconfig 中**新增 'ts-node' 字段**，或在执行 ts-node 时**作为命令行的参数**:

`-P,--project`：指定你的 tsconfig 文件位置。默认情况下 ts-node 会查找项目下的 tsconfig.json 文件，如果你的配置文件是 tsconfig.script.json、tsconfig.base.json 这种，就需要使用这一参数来进行配置了。
`-T, --transpileOnly`：禁用掉执行过程中的类型检查过程，这能让你的文件执行速度更快，且不会被类型报错卡住。这一选项的实质是使用了 TypeScript Compiler API 中的 transpileModule 方法，我们会在后面的章节详细讲解。
`--swc`：在 transpileOnly 的基础上，还会使用 swc 来进行文件的编译，进一步提升执行速度。
`--emit`：如果你不仅是想要执行，还想顺便查看下产物，可以使用这一选项来把编译产物输出到 .ts-node 文件夹下（需要同时与 **--compilerHost 选项一同使用** tsn --emit --compilerHost index.ts）。

#### ts-node-dev
ts-node-dev 基于 node-dev（一个类似 nodemon 的库，提供监听文件重新执行的能力） 与 ts-node 实现，并在重启文件进程时共享同一个 TS 编译进程，避免了每次重启时需要重新实例化编译进程等操作。

安装：
```bash
npm i ts-node-dev -g
```

ts-node-dev 在全局提供了 `tsnd` 这一简写，可以运行 tsnd 来检查安装情况。最常见的使用命令是这样的：
```bash
tsnd --respawn --transpile-only xxx.ts
```
respawn 选项启用了监听重启的能力，而 transpileOnly 提供了更快的编译速度。可以查看官方仓库来了解更多选项，但在大部分场景中以上这个命令已经足够了。

可以通过工具类型的形式，如 tsd 这个 npm 包提供的一系列工具类型，能帮助你进行声明式的类型检查：：
```ts
import { expectType } from 'tsd';

expectType<string>("linbudu"); // √
expectType<string>(599); // ×
```