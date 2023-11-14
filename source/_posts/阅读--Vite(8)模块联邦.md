---
title: 阅读--Vite(17) 模块联邦
date: 2023-09-22 20:23:00
tags:
  - 阅读
  - Vite
categories:
  - [阅读]
---

2020 年，Webpack 提出了 `Module Federation（模块联邦）`，这个特性很好地解决了 `多应用模块复用` 的问题，不仅在 Webpack，在 Vite 中同样可以实现这个特性。


## 模块共享常见解决方案的优缺点
在大型项目中，往往会有很多细分的应用，而每个应用又彼此独立，公司内部常常会有很多通用的模块，比如公共组件、工具函数、第三方依赖等。对于这些代码，常见的解决方案有以下几种：

### 1. 发布 NPM 包
发布 npm 包是常见的复用模块的做法，将模块单独发一个包，在其他的项目中进行引用，不过问题很显而易见: `当一个包发布时，引用了这个包的所有项目都得重新安装，并且调试`。这就导致**流程变得复杂**，引入公共库后，**导致最后构建的产物体积偏大，构建速度较慢**。

### 2. Git Submodule
通过 `git submodule` 的方式，可以将代码封装成公共 Git 仓库，复用到不同仓库中，但也需要经历：
1. 公共库改动，提交到远端仓库。
2. 所有的应用通过 Git Submodule 命令更新子仓库代码，重新构建。

可以看到，与第一种方式其实并没有本质上的区别。

### 3. 依赖外部化(external) + CDN 引入
通过前面两种方式可以发现，最麻烦的步骤其实是：`一旦发布，引用其的项目就都要重新构建`。那么 CDN 就可以解决这个问题，在内部利用构建工具将公共依赖 external 掉，然后在 html 中引入相应的 script 标签，最后会自己挂载在 window 上。这样可以实现模块在所有应用间进行共享。不过它也存在众多缺点：
1. 兼容性，并不是所有依赖都有 UMD 格式产物，这种方案不能覆盖所有第三方 npm 包。
2. 依赖顺序，比如 antd ，他依赖了 react 和 moment 库，那么这两者就需要 external，如果 moment 放在了 antd 的后面，代码就可能无法运行。一旦第三方包数量庞大就需要逐个处理依赖，很麻烦。
3. 产物体积，由于依赖被 external，应用在引用其 CDN 时，会全量引用其代码，这种情况下就没办法通过 Tree Shaking 来去除无用代码了，会导致应用的性能有所下降。


### 4. Monorepo
Monorepo 可以很好地解决模块复用的问题，在 Monorepo 架构下，多个项目可以放在同一个 Git 仓库中，各个互相依赖的子项目通过软链的方式进行引用。代码复用非常方便。
不过它也存在问题：
1. **所有应用代码都必须放在一个仓库**，如果是旧项目，并且每个项目都是一个 Git 仓库，那么使用 Monorepo 之后项目架构调整会很大，改造成本高。
2. 当项目数量多起来之后，整体构建时间会变长，安装依赖会变慢。项目构建是个大问题，跟发 npm 包方案一样，所有的公共代码都需要进入项目的构建流程中，产物体积还是会偏大。


### 5. MF 模块联邦
模块联邦主要有两种模块：`本地模块` 和 `远程模块`。本地模块是本地构建流程的一部分，而远程模块不属于当前构建流程，在本地模块的运行时进行导入。同时本地模块和远程模块可以共享某些公共依赖。并且本地模块也可以作为远程模块被引用。

**模块联邦的优势**
1. **实现任意粒度的模块共享**，模块粒度可大可小，包括 npm 依赖、业务组件、工具函数、甚至是整个前端应用。而整个前端应用能够共享产物，代表着各个应用独立开发、测试、部署。这也是一种微前端的实现。
2. **优化产物体积与构建时长**，远程模块可以从本地模块运行时被拉取，而**不用参与本地模块的构建**，可以加速构建过程，也能减少构建产物。
3. **运行时按需加载**，远程模块导入的粒度可以很小，如果你只想使用 app1 模块的add函数，只需要在 app1 的构建配置中导出这个函数，然后在本地模块中按照诸如import('app1/add')的方式导入即可，这样就很好地实现了模块按需加载。
4. **第三方依赖共享**，通过模块联邦的共享依赖，可以方便实现模块间公共依赖代码，避免 `external + CDN` 的问题。

#### MF 实践
vite 中包含了比较成熟的模块联邦解决方案 `vite-plugin-federation`，这个方案基于 Vite 或者 Rollup 实现了完整的能力。

首先初始化 Vite + Vue 项目并且安装模块联邦插件
`pnpm install @originjs/vite-plugin-federation -D`


接着分别写入远程模块与本地模块的导入导出配置：
```ts
// 远程模块 b 配置
// remote/vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 模块联邦配置
    federation({
      name: "remoteB",
      filename: "remoteB.js",
      // 导出模块声明
      exposes: {
        "./moduleB": "./src/components/moduleB.vue",
        "./AppModuleB": "./src/App.vue",
        "./utils": "./src/utils.js",
      },
      // 共享依赖声明
      shared: ["vue"],
    }),
  ],
  // 打包配置
  build: {
    target: "esnext",
  },
});


// 本地模块/远程模块 a 配置
// vite-module-a/vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: "remoteA",
      filename: "remoteA",
      // 远程模块声明
      remotes: {
        remoteB: "http://localhost:3001/assets/remoteB.js",
      },
      // 导出模块声明
      exposes: {
        "./AppModuleA": "./src/App.vue",
        "./utils": "./src/utils.js",
      },
      // 共享依赖声明
      shared: ["vue"],
    }),
  ],
  build: {
    target: "esnext",
  },
});

// 本地模块 C 配置
// vite-module-a/vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: "moduleC",
      // 远程模块声明
      remotes: {
        removeA: "http://localhost:3001/assets/removeA.js",
        removeB: "http://localhost:3002/assets/removeB.js",
      },
      // 共享依赖声明
      shared: ["vue"],
    }),
  ],
  build: {
    target: "esnext",
  },
});
```
可以看到，首先在远程模块 b 中定义了导出模块，并配置了导出文件。随后在模块 a 中的 remotes 对 remoteB 进行引用。
我们在模块 b 中进行构建并且指定端口 3001 起服务 `pnpm build && npx vite preview --port=3001`
这样 b 作为远程模块就能够在 a 本地模块中进行使用了：
```vue
// a 本地模块
<script setup>
import { defineAsyncComponent, onMounted } from 'vue'

// 1. 引入远程模块 B 的组件 moduleB
import ModuleB from "remoteB/moduleB"

// 2. 异步引入远程模块 B 的 app 
const AppB = defineAsyncComponent(() => import("remoteB/AppModuleB"))

// 3. 引入远程模块 B 的 utils
import moduleB from "remoteB/utils"
// console.log('moduleB:', moduleB)

onMounted(() => {
  moduleB()
})

</script>

<template>
  <div class="testA">
    I am module A
    <AppB>
      <ModuleB msg="我是 module A 传入的消息" />
    </AppB>
  </div>
</template>

<style scoped>
.testA {
  padding: 15px;
  border: 1px solid red;
}
</style>


```
可以发现，在本地模块 a 中引用 b 模块导出来的组件与方法，都能够正常使用了：
![avatar]('/my-image/module_federation.jpg')

让我们来梳理一下整体的使用流程:

1. 远程模块通过 exposes 注册导出的模块，本地模块通过 remotes 注册远程模块地址。
2. 远程模块进行构建，并部署到云端。
3. 本地通过import '远程模块名称/xxx'的方式来引入远程模块，实现运行时加载。


### MF 实现原理
实现模块联邦有三大要素：
1. Host 模块; 即本地模块，用来使用远程模块
2. Remote 模块; 即远程模块，生产模块以便 Host 模块能够运行时加载。
3. Shared 依赖; 即共享依赖，用来在本地模块和远程模块中实现第三方依赖的共享。


而如果看 Vite 编译后的结果：
```js
// 为了方便阅读，以下部分方法的函数名进行了简化
// 远程模块表
const remotesMap = {
  'remote_app':{url:'http://localhost:3001/assets/remoteEntry.js',format:'esm',from:'vite'},
  'shared':{url:'vue',format:'esm',from:'vite'}
};

async function ensure() {
  const remote = remoteMap[remoteId];
  // 做一些初始化逻辑，暂时忽略
  // 返回的是运行时容器
}

async function getRemote(remoteName, componentName) {
  return ensure(remoteName)
    // 从运行时容器里面获取远程模块
    .then(remote => remote.get(componentName))
    .then(factory => factory());
}

// import 语句被编译成了这样
// tip: es2020 产物语法已经支持顶层 await
const __remote_appApp = await getRemote("remote_app" , "./App");

```

本地模块使用远端模块编译后的代码中，可以发现定义了远程模块表，使用时会去远端的运行时容器(就是远端模块编译后的文件)拉取对应的模块。

而运行时产物编译后的文件导出的对象是长这样的：
```ts
// remoteB.js
const moduleMap = {
  "./App": () => {
    dynamicLoadingCss('./__federation_expose_App.css');
    return import('./__federation_expose_App.js').then(module => () => module);
  },
  './utils': () => {
    return import('./__federation_expose_Utils.js').then(module => () => module);
  }
};

// 加载 css
const dynamicLoadingCss = (cssFilePath) => {
  const metaUrl = import.meta.url;
  if (typeof metaUrl == 'undefined') {
    console.warn('The remote style takes effect only when the build.target option in the vite.config.ts file is higher than that of "es2020".');
    return
  }
  const curUrl = metaUrl.substring(0, metaUrl.lastIndexOf('remoteB.js'));
  const element = document.head.appendChild(document.createElement('link'));
  element.href = curUrl + cssFilePath;
  element.rel = 'stylesheet';
};

// 关键方法，暴露模块
const get =(module) => {
  return moduleMap[module]();
};

const init = () => {
  // 初始化逻辑，用于共享模块，暂时省略
}

export { dynamicLoadingCss, get, init }

```

看到关键方法后，已经显而易见了：本地模块在导入运行时容器并访问指定模块时，会走上文代码中的 `get` 方法，然后拿到对应的模块。

这就是完整的远程模块运行时容器与本地模块交互的流程：
![avatar]('/my-image/module_federation2.jpg')



最后就是 shared 依赖。当本地设置了 `shared:["vue"]` 后，一旦遇到引入 vue 的情况，会优先使用**本地的vue**，而不是远端模块的 vue。

同样的，本地模块的产物也定义了共享依赖的表：
```js
const shareScope = {
  'vue':{'3.2.31':{get:()=>get('./__federation_shared_vue.js'), loaded:1}}
};
async function ensure(remoteId) {
  const remote = remotesMap[remoteId];
  if (remote.inited) {
    return new Promise(resolve => {
        if (!remote.inited) {
          remote.lib = window[remoteId];
          remote.lib.init(shareScope);
          remote.inited = true;
        }
        resolve(remote.lib);
    });
  }
}
```
随后它会将共享依赖传递给远端模块，远端模块识别到共享依赖后会将 `共享依赖` 挂载在 window 上：
```js
const init =(shareScope) => {
  globalThis.__federation_shared__= globalThis.__federation_shared__|| {};
  // 将本地模块的`共享模块表`绑定到远程模块的全局 window 对象上
  Object.entries(shareScope).forEach(([key, value]) => {
    const versionKey = Object.keys(value)[0];
    const versionValue = Object.values(value)[0];
    const scope = versionValue.scope || 'default';
    globalThis.__federation_shared__[scope] = globalThis.__federation_shared__[scope] || {};
    const shared= globalThis.__federation_shared__[scope];
    (shared[key] = shared[key]||{})[versionKey] = versionValue;
  });
};
```

在使用共享模块时，所有的操作逻辑都会统一在一个函数里：
```js
// __federation_fn_import.js
const moduleMap= {
  'vue': {
     get:()=>()=>__federation_import('./__federation_shared_vue.js'),
     import:true
   }
};
// 第三方模块缓存
const moduleCache = Object.create(null);
async function importShared(name,shareScope = 'default') {
  return moduleCache[name] ? 
    new Promise((r) => r(moduleCache[name])) : 
    getProviderSharedModule(name, shareScope);
}

async function getProviderSharedModule(name, shareScope) {
  // 从 window 对象中寻找第三方包的包名，如果发现有挂载，则获取本地模块的依赖
  if (xxx) {
    return await getHostDep();
  } else {
    return getConsumerSharedModule(name); 
  }
}

async function getConsumerSharedModule(name , shareScope) {
  if (moduleMap[name]?.import) {
    const module = (await moduleMap[name].get())();
    moduleCache[name] = module;
    return module;
  } else {
    console.error(`consumer config import=false,so cant use callback shared module`);
  }
}
```

由于远程模块运行时容器初始化时已经挂载了共享依赖的信息，远程模块内部可以很方便的感知到当前的依赖是不是共享依赖，如果是共享依赖则使用本地模块的依赖代码，否则使用远程模块自身的依赖产物代码。