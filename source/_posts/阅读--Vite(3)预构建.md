---
title: 阅读--Vite(3) 预构建
date: 2023-07-18 15:04:00
tags:
  - 阅读
  - Vite
categories:
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
第一个参数是 `optimizeDeps.entries`，通过这个参数可以自定义入口文件。
实际上，第一次启动 Vite 会默认抓取项目中所有的 HTML 文件，将 HTML 文件作为应用入口，然后根据入口文件扫描出项目中用到的第三方依赖，最后对这些依赖逐个编译。
除了 HTML 文件，也可以使用文件格式为 vue 的作为入口文件。
```ts
// vite.config.ts
{
  optimizeDeps: {
    // 为一个字符串数组
    entries: ["./src/main.vue"];
  }
}
```

```ts
// 将所有的 .vue 文件作为扫描入口
entries: ["**/*.vue"];
```

不光是 .vue 文件，Vite 同时还支持各种格式的入口，包括 html、svelte、astro、js、jsx、ts和tsx。只要可能存在 import 语句的地方，Vite 都可以解析。


#### 添加依赖 include
除了 `entries`, `include` 也是一个很常用的配置，它决定了可以强制预构建的依赖项。
```ts
// vite.config.ts
optimizeDeps: {
  // 配置为一个字符串数组，将 `lodash-es` 和 `vue`两个包强制进行预构建
  include: ["lodash-es", "vue"];
}
```
在使用上并不麻烦，关键的地方在于如何找到使用场景，Vite 会根据应用入口自动搜集依赖然后进行构建，但其实 Vite 并不能够百分之百搜集到所有依赖。这就需要使用 include 来达到完美的预构建效果。


##### 场景1 动态 import
由于 Vite 按需加载源代码的特性，所以动态 import 的场景下，Vite 只会在要加载这个文件的时候才会加载，如果这个动态引入的文件里面引用了其他的包，而这个包的体积恰好很大，那么当文件更改服务就会进行二次构建，页面会进行刷新，体验不是很好，这个时候就可以在 include 中添加相关的依赖，避免不必要的预构建。
```ts
// src/locales/zh_CN.js
import objectAssign from "object-assign";
console.log(objectAssign);

// main.tsx
const importModule = (m) => import(`./locales/${m}.ts`);
importModule("zh_CN");
```

```ts
// vite.config.ts
{
  optimizeDeps: {
    include: [
      // 按需加载的依赖都可以声明到这个数组里
      "object-assign",
    ];
  }
}
```


#### Esbuild
Vite 提供了 esbuildOptions 参数来自定义 Esbuild 本身的配置：
```ts
// vite.config.ts
{
  optimizeDeps: {
    esbuildOptions: {
       plugins: [
        // 加入 Esbuild 插件
      ];
    }
  }
}
```

##### 特殊情况
当第三方包出现问题，例如某个包在预构建的时候可能会直接抛出错误，ESM 格式产物可能会有问题，这时候通常会去排查问题，追溯到出错的代码。而解决方式有两种：
1. 修改源码 但这种改动需要同步到所有成员，麻烦。可以使用 patch-package 这个库来解决问题，一方面它能记录第三方库代码的改动，另一方面也能将改动同步到团队每个成员。
2. 加入 Esbuild 插件
   第二种方式是通过 Esbuild 插件修改指定模块的内容。
   ```ts
      // vite.config.ts
    const esbuildPatchPlugin = {
      name: "react-virtualized-patch",
      setup(build) {
        build.onLoad(
          {
            filter:
              /react-virtualized\/dist\/es\/WindowScroller\/utils\/onScroll.js$/,
          },
          async (args) => {
            const text = await fs.promises.readFile(args.path, "utf8");

            return {
              contents: text.replace(
                'import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";',
                ""
              ),
            };
          }
        );
      },
    };

    // 插件加入 Vite 预构建配置
    {
      optimizeDeps: {
        esbuildOptions: {
          plugins: [esbuildPatchPlugin];
        }
      }
    }
   ```

#### 总结
Vite 中的依赖预构建主要解决了两个问题，首先是模块格式兼容 Vite 会把依赖项非 ESM 格式转换为 ESM 格式。其次是项目依赖项可能会有深层依赖，导致不必要的请求，Vite 将依赖项的所有文件合并到一个文件中。
接着，Vite 的相关配置 entries入口，include 预构建包含包，exclude 预构建排除包，esbuildOptions esbuild配置项。