---
title: 阅读--Vite(4) Esbuild
date: 2023-07-24 14:43:00
tags:
  - 阅读
  - 面试题
  - Vite
categories
  - [阅读]
---

Vite 的 devServer 就是使用了 Esbuild ，作为 Vite 的双引擎之一，在很多阶段都有关键的作用(依赖预编译，TS 语法转译，代码压缩)，它是 Vite 取得高性能的关键。


### 为什么 Esbuild 的性能极高
Esbuild 能够比其他构建工具速度快上 `10 - 100` 倍是有原因的，主要为以下四点：
1. 使用 Golang 开发，Golang编译后直接转换为机器码，而 JS 需要先解析为字节码再转换成机器码，节省了程序的运行时间。利用 Golang 当中多线程共享内存的优势。内部打包算法充分利用 CPU 的多核优势
3. 从零到一，Esbuild 技术没有使用任何第三方库，所有功能都是从零到一编写大到 AST 的解析，小到字符串的操作，保证极致的代码性能。
4. 高效的内存利用，从头到尾尽可能复用一份 AST 节点，而不像其他的 JS 构建工具会频繁解析核传递 AST 数据（如 string -> TS -> JS -> string），造成大量的内存浪费。


### 命令行调用、代码调用
#### 1. 命令行调用
直接在项目中安装 Esbuild 然后添加 script 的 build 命令例如：`"build": "npx esbuild src/index.jsx --bundle --outfile=dist/out.js"`，执行构建以后会发现多出了 dist 文件夹和文件夹下的 out.js。但只能传入简单的命令行参数，不够灵活，只能满足简单的demo调试，面对大型项目就力不从心了。 


#### 2. 代码调用
Esbuild 对外暴露了一系列 API，主要包含两类：`Build API` 和 `Transform API`。可以在 Node.js 中调用这些 API 来使用 Esbuild 的功能。
##### 项目打包--Build API
Build API 主要包括 `build` `buildSync` `serve` 三个方法
使用 build 方法，在根目录创建 build.js：
```js
const { build, buildSync, serve } = require("esbuild");

async function runBuild() {
  // 异步方法，返回一个 Promise
  const result = await build({
    // ----  如下是一些常见的配置  --- 
    // 当前项目根目录
    absWorkingDir: process.cwd(),
    // 入口文件列表，为一个数组
    entryPoints: ["./src/index.jsx"],
    // 打包产物目录
    outdir: "dist",
    // 是否需要打包，一般设为 true
    bundle: true,
    // 模块格式，包括`esm`、`commonjs`和`iife`
    format: "esm",
    // 需要排除打包的依赖列表
    external: [],
    // 是否开启自动拆包
    splitting: true,
    // 是否生成 SourceMap 文件
    sourcemap: true,
    // 是否生成打包的元信息文件
    metafile: true,
    // 是否进行代码压缩
    minify: false,
    // 是否开启 watch 模式，在 watch 模式下代码变动则会触发重新打包
    watch: false,
    // 是否将产物写入磁盘
    write: true,
    // Esbuild 内置了一系列的 loader，包括 base64、binary、css、dataurl、file、js(x)、ts(x)、text、json
    // 针对一些特殊的文件，调用不同的 loader 进行加载
    loader: {
      '.png': 'base64',
    }
  });
  console.log(result);
}

runBuild();

```
将 build 方法换成 buildSync 方法也是可以打包的，但 buildSync 这种同步的 API，它会导致两方面不良后果。一方面容易使 Esbuild 在当前线程阻塞，丧失并发任务处理的优势。另一方面，Esbuild 所有插件中都不能使用任何异步操作，这给插件开发增加了限制。
