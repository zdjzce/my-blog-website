---
title: 阅读--Vite(7) Vite 插件
date: 2023-08-06 17:50:00
tags:
  - 阅读
  - 面试题
  - Vite
categories
  - [阅读]
---

### 1. Vite 的开发环境调用
Vite 的插件和 Rollup 类似，为一个 name 和各种插件 Hook 的对象：
```js
{
  // 插件名称
  name: 'vite-plugin-xxx',
  load(code) {
    // 钩子逻辑
  },
}
```

更多的到时候插件返回一个对象，里面包含了工厂函数：
```js
// myPlugin.js
export function myVitePlugin(options) {
  console.log(options)
  return {
    name: 'vite-plugin-xxx',
    load(id) {
      // 在钩子逻辑中可以通过闭包访问外部的 options 传参
    }
  }
}

// 使用方式
// vite.config.ts
import { myVitePlugin } from './myVitePlugin';
export default {
  plugins: [myVitePlugin({ /* 给插件传参 */ })]
}

Vite 在开发阶段会模拟 Rollup 的行为，Vite会调用一系列与 Rollup 兼容的钩子，钩子主要分为三个阶段：
1. 服务器启动阶段： options 和 buildStart 钩子会在服务启动时被调用
2. 请求响应阶段：浏览器发起请求时，Vite 内部依次调用 `resolveId`, `load`, 'transform' 钩子。
3. 服务器关闭：Vite 依次执行 `buildEnd` 和 `closeBundle` 钩子。

其他 Rollup 插件钩子(moduleParsed, renderChunk) 不会在 Vite 的开发阶段调用，而生产环境下，由于 Vite 直接使用 Rollup，所有 Rollup相关的插件钩子都会生效。
```

### 2. Vite 的独有 Hook
Vite 有自己的内部 Hook，在 Rollup 里会直接忽略。
#### **2.1 config**
Vite 在读取完配置文件(vite.config.ts)后，会拿到用户导出的配置对象，然后执行 config 钩子，在这个钩子中可以对配置文件导出的对象自定义操作。
```js
const editConfigPlugin = () => ({
  name: 'vite-plugin-modify-config',
  config: () => ({
    alias: {
      react: require.resolve('react')
    }
  })
})
```

官方推荐写法：钩子返回一个配置对象，这个配置对象会和 Vite 已有的配置进行深度合并。并且能够在参数中拿到 config 对象。
```js
config(config, { command }) {
  ...
}
```

#### **2.2 configResolved**
在解析完config 后，会调用 configResolved 钩子，记录最终的配置信息。
```js
const exmaplePlugin = () => {
  let config

  return {
    name: 'read-config',

    configResolved(resolvedConfig) {
      // 记录最终配置
      config = resolvedConfig
    },

    // 在其他钩子中可以访问到配置
    transform(code, id) {
      console.log(config)
    }
  }
}
```

#### 2.3 获取 Dev Server 实例：configureServer
这个钩子仅在开发阶段会调用，一般用于自定义 server 中间件。
```js
const myPlugin = () => ({
  name: 'configure-server',
  configureServer(server) {
    // 姿势 1: 在 Vite 内置中间件之前执行
    server.middlewares.use((req, res, next) => {
      // 自定义请求处理逻辑
    })
    // 姿势 2: 在 Vite 内置中间件之后执行 
    return () => {
      server.middlewares.use((req, res, next) => {
        // 自定义请求处理逻辑
      })
    }
  }
})
```

#### 2.4 转换 HTML 内容: transformIndexHtml
拿到原始的 html 内容进行任意的转换。
```js
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      return html.replace(
        /<title>(.*?)</title>/,
        `<title>换了个标题</title>`
      )
    }
  }
}
// 也可以返回如下的对象结构，一般用于添加某些标签
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      return {
        html,
        // 注入标签
        tags: [
          {
            // 放到 body 末尾，可取值还有`head`|`head-prepend`|`body-prepend`，顾名思义
            injectTo: 'body',
            // 标签属性定义
            attrs: { type: 'module', src: './index.ts' },
            // 标签名
            tag: 'script',
          },
        ],
      }
    }
  }
}

```

#### 2.5 热更新处理： handleHotUpdate
这个钩子会在服务器热更新时被调用，在这个钩子中可以拿到热更新相关的上下文信息，进行热更模块的过滤。
```js
const handleHmrPlugin = () => {
  return {
    async handleHotUpdate(ctx) {
      // 需要热更的文件
      console.log(ctx.file)
      // 需要热更的模块，如一个 Vue 单文件会涉及多个模块
      console.log(ctx.modules)
      // 时间戳
      console.log(ctx.timestamp)
      // Vite Dev Server 实例
      console.log(ctx.server)
      // 读取最新的文件内容
      console.log(await read())
      // 自行处理 HMR 事件
      ctx.server.ws.send({
        type: 'custom',
        event: 'special-update',
        data: { a: 1 }
      })
      return []
    }
  }
}

// 前端代码中加入
if (import.meta.hot) {
  import.meta.hot.on('special-update', (data) => {
    // 执行自定义更新
    // { a: 1 }
    console.log(data)
    window.location.reload();
  })
}

```


- config: 用来进一步修改配置。
- configResolved: 用来记录最终的配置信息。
- configureServer: 用来获取 Vite Dev Server 实例，添加中间件。
- transformIndexHtml: 用来转换 HTML 的内容。
- handleHotUpdate: 用来进行热更新模块的过滤，或者进行自定义的热更新处理。


### 3. 执行顺序
关于执行顺序，可以自己新建一个钩子查看：
```js
// test-hooks-plugin.ts
// 注: 请求响应阶段的钩子
// 如 resolveId, load, transform, transformIndexHtml在下文介绍
// 以下为服务启动和关闭的钩子
export default function testHookPlugin () {
  return {
    name: 'test-hooks-plugin', 
    // Vite 独有钩子
    config(config) {
      console.log('config');
    },
    // Vite 独有钩子
    configResolved(resolvedCofnig) {
      console.log('configResolved');
    },
    // 通用钩子
    options(opts) {
      console.log('options');
      return opts;
    },
    // Vite 独有钩子
    configureServer(server) {
      console.log('configureServer');
      setTimeout(() => {
        // 手动退出进程
        process.kill(process.pid, 'SIGTERM');
      }, 3000)
    },
    // 通用钩子
    buildStart() {
      console.log('buildStart');
    },
    // 通用钩子
    buildEnd() {
      console.log('buildEnd');
    },
    // 通用钩子
    closeBundle() {
      console.log('closeBundle');
    }
}

```

![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/339255d0cdba48a2832f720a895892c9~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.avis)

![avatar](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/83c255efbdec4c66971a30ff270c70a9~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.avis)

- 服务启动阶段: config、configResolved、options、configureServer、buildStart
- 请求响应阶段: 如果是 html 文件，仅执行transformIndexHtml钩子；对于非 HTML 文件，- 则依次执行resolveId、load和transform钩子。相信大家学过 Rollup 的插件机制，已经对- 这三个钩子比较熟悉了。
- 热更新阶段: 执行handleHotUpdate钩子。
- 服务关闭阶段: 依次执行buildEnd和closeBundle钩子。


### 4. 应用位置
### 5. 虚拟模块加载插件
### 6. svg 加载插件