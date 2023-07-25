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

##### server
在开发环境时可以使用 server 来启动静态资源服务，它有三个特点：
1. 开启 server 模式后，在指定端口和目录搭建静态文件服务，这个服务器用原生 Go 实现，性能比 Node.js 高
2. 类似 webpack-dev-server, 所有产物不会写到磁盘而是放到内存中，通过请求服务来访问
3. 每次请求到来时，重新构建(rebuild)，永远返回新的产物
```js
const esbuild = require('esbuild')


async function runBuild () {

  const ctx = await esbuild.context({
    absWorkingDir: process.cwd(),
  })

  await ctx.serve(
    {
      port: 8000,
      // 静态资源目录
      servedir: './'
    },
  ).then((server) => {
    console.log("HTTP Server starts at port", server.port);
  });
}

runBuild();
```
每次在浏览器请求都会触发 Esbuild 重新构建，而每次重新构建都是一个增量构建的过程，耗时也会比首次构建少很多(一般能减少 70% 左右)。


##### 单文件转译
Esbuild 提供了单文件编译的能力，与 `Build API 相似`：
```js
const { transform } = require('esbuild')

async function runTransform() {
  const content = await transform(
    'const isNull = (str: string): boolean => str.length > 0;',
    {
      sourcemap: true,
      loader: 'tsx'
    }
  )

  console.log(content);
}


runTransform()
```

### Esbuild 插件开发
通过 Esbuild 插件我们可以`扩展` Esbuild 原有的路径解析、模块加载等方面的能力，并在 Esbuild 的构建过程中执行一系列`自定义`的逻辑。

Esbuild 插件结构被设计为一个对象，里面有 `name` 和 `setup` 两个属性，name是插件的名称，setup是一个函数，其中入参是一个 `build 对象`，这个对象上挂载了一些钩子可供我们自定义一些钩子函数逻辑。
```js
let envPlugin = {
  name: 'env',
  setup (build) {
    console.log('build====:', build)
    build.onResolve({ filter: /^env$/ }, args => {
      console.log('args:', args)
      return {
        path: args.path,
        namespace: 'env-ns',
      }
    })

    // 构建时将会把 env 替换成 process.env 对象
    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
      contents: JSON.stringify(process.env),
      loader: 'json',
    }))
  },
}

require('esbuild').build({
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'out.js',
  // 应用插件
  plugins: [envPlugin],
}).catch(() => process.exit(1))

```

应用了插件后，构建时 path 将会被替换成 process.env 对象

#### onResolve 钩子和 onLoad 钩子
这两个钩子分别控制 `路径解析` 和 `模块内容加载的过程`，两个钩子中都需要传入两个参数 `Options` 和 `Callback`

Options：一个对象，对于 onResolve 和 onload 一样，包含 `filter` 和 `namespace` 两个属性，定义如下：
```js
interface Options {
  filter: RegExp;
  namespace?: string;
}
```
filter 为必传参数，是一个正则表达式，它决定了要过滤出的特征文件。
`插件中的 filter 正则是使用 Go 原生正则实现的，为了不使性能过于劣化，规则应该尽可能严格。同时它本身和 JS 的正则也有所区别，不支持前瞻(?<=)、后顾(?=)和反向引用(\1)这三种规则。`


`namespace 为选填`，一般在 `onResolve` 钩子中的回调参数返回 namespace 属性作为标识，接着可以在 `onLoad` 钩子中通过 `namespace` 将模块过滤出来。如上述插件示例就在onLoad钩子通过env-ns这个 namespace 标识过滤出了要处理的env模块。


相比于 Options，Callback 函数入参和返回值的结构复杂得多，涉及很多属性：

onResolve 钩子函数参数和返回值：
```js
build.onResolve({ filter: /^env$/ }, (args: onResolveArgs): onResolveResult => {
  // 模块路径
  console.log(args.path)
  // 父模块路径
  console.log(args.importer)
  // namespace 标识
  console.log(args.namespace)
  // 基准路径
  console.log(args.resolveDir)
  // 导入方式，如 import、require
  console.log(args.kind)
  // 额外绑定的插件数据
  console.log(args.pluginData)
  
  return {
      // 错误信息
      errors: [],
      // 是否需要 external
      external: false;
      // namespace 标识
      namespace: 'env-ns';
      // 模块路径
      path: args.path,
      // 额外绑定的插件数据
      pluginData: null,
      // 插件名称
      pluginName: 'xxx',
      // 设置为 false，如果模块没有被用到，模块代码将会在产物中会删除。否则不会这么做
      sideEffects: false,
      // 添加一些路径后缀，如`?xxx`
      suffix: '?xxx',
      // 警告信息
      warnings: [],
      // 仅仅在 Esbuild 开启 watch 模式下生效
      // 告诉 Esbuild 需要额外监听哪些文件/目录的变化
      watchDirs: [],
      watchFiles: []
  }
}

```

在 onLoad 钩子中函数参数和返回值:
```js
build.onLoad({ filter: /.*/, namespace: 'env-ns' }, (args: OnLoadArgs): OnLoadResult => {
  // 模块路径
  console.log(args.path);
  // namespace 标识
  console.log(args.namespace);
  // 后缀信息
  console.log(args.suffix);
  // 额外的插件数据
  console.log(args.pluginData);
  
  return {
      // 模块具体内容
      contents: '省略内容',
      // 错误信息
      errors: [],
      // 指定 loader，如`js`、`ts`、`jsx`、`tsx`、`json`等等
      loader: 'json',
      // 额外的插件数据
      pluginData: null,
      // 插件名称
      pluginName: 'xxx',
      // 基准路径
      resolveDir: './dir',
      // 警告信息
      warnings: [],
      // 同上
      watchDirs: [],
      watchFiles: []
  }
});

```

#### onStart onEnd 钩子
这两个钩子用于在构建开启和结束时执行一些自定义的逻辑
```js
let examplePlugin = {
  name: 'example',
  setup(build) {
    build.onStart(() => {
      console.log('build started')
    });
    build.onEnd((buildResult) => {
      if (buildResult.errors.length) {
        return;
      }
      // 构建元信息
      // 获取元信息后做一些自定义的事情，比如生成 HTML
      console.log(buildResult.metafile)
    })
  },
}
```
1. onStart 的执行时机是在每次 build 的时候，包括触发 watch 或者 serve模式下的重新构建。
2. onEnd 钩子中如果要拿到 metafile，必须将 Esbuild 的构建配置中metafile属性设为 true。