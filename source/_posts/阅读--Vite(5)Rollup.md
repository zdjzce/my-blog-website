---
title: 阅读--Vite(5) Rollup
date: 2023-07-27 18:00:00
tags:
  - 阅读
  - Rollup
categories:
  - [阅读]
---
### 快速使用
```zsh
mkdir rollup-demo
cd rollup-demo
npm init -y
pnpm i rollup
```

新建 `rollup.config.js`，并且在 src 下新建 `index.js` 和 `util.js`
```js
// rollup.config.js
// 以下注释是为了能使用 VSCode 的类型提示
/**
 * @type { import('rollup').RollupOptions }
 */
const buildOptions = {
  input: ["src/index.js"],
  output: {
    // 产物输出目录
    dir: "dist/es",
    // 产物格式
    format: "esm",
  },
};

export default buildOptions;
```

```js
// src/index.js
import { add } from "./util";
console.log(add(1, 2));
```

```js
// src/util.js
export const add = (a, b) => a + b;

export const multi = (a, b) => a * b;
```

接着在 package.json 中新增 `build` 命令：
```json
  "build": "rollup -c"
```

运行后查看产物会发现 multi 方法没有打包到产物里，因为 Rollup 有天然的 `Tree Shaking`。也是计算机编译原理中DCE(Dead Code Elimination，即消除无用代码) 技术的一种实现。由于 ES 模块依赖关系是确定的，和运行时状态无关。因此 Rollup 可以在编译阶段分析出依赖关系，对 AST 语法树中没有使用到的节点进行删除，从而实现 Tree Shaking。

### 1. 多产物配置
通常类库需要打包 ESM CommonJS UMD 等格式，保证良好的兼容性，配置如下：
```js
// rollup.config.js
/**
 * @type { import('rollup').RollupOptions }
 */
const buildOptions = {
  input: ["src/index.js"],
  // 将 output 改造成一个数组
  output: [
    {
      dir: "dist/es",
      format: "esm",
    },
    {
      dir: "dist/cjs",
      format: "cjs",
    },
  ],
};

export default buildOptions;

```

### 2. 多入口配置
```js
  input: ["src/index.js", "src/util.js"]
```

如果不同入口对应的打包配置不一样，也可以导出一个默认数组：
```js
const buildOptions = {
  input: ["src/index.js", "src/util.js"],
  output: [
    {
      // 产物输出目录
      dir: "dist/es",
      // 产物格式
      format: "esm",
    },
    {
      dir: "dist/cjs",
      format: "cjs"
    }
  ]

};

// 不同入口对应的打包配置不一样：
const secondOptions = {
  input: ["src/index.js"],
  output: [
    {
      dir: "dist/second/esm",
      format: "esm"
    },
    {
      dir: "dist/second/cjs",
      format: "cjs"
    }
  ]
}

export default [buildOptions, secondOptions];
```
如果比较复杂的打包场景，需要讲代码分成几个部分，用不同的 Rollup 配置分别打包，这种配置就很有用了。


### 3. 自定义 output 配置
```js
output: {
  // 产物输出目录
  dir: path.resolve(__dirname, 'dist'),
  // 以下三个配置项都可以使用这些占位符:
  // 1. [name]: 去除文件后缀后的文件名
  // 2. [hash]: 根据文件名和文件内容生成的 hash 值
  // 3. [format]: 产物模块格式，如 es、cjs
  // 4. [extname]: 产物后缀名(带`.`)
  // 入口模块的输出文件名
  entryFileNames: `[name].js`,
  // 非入口模块(如动态 import)的输出文件名
  chunkFileNames: 'chunk-[hash].js',
  // 静态资源文件输出文件名
  assetFileNames: 'assets/[name]-[hash][extname]',
  // 产物输出格式，包括`amd`、`cjs`、`es`、`iife`、`umd`、`system`
  format: 'cjs',
  // 是否生成 sourcemap 文件
  sourcemap: true,
  // 如果是打包出 iife/umd 格式，需要对外暴露出一个全局变量，通过 name 配置变量名
  name: 'MyBundle',
  // 全局变量声明
  globals: {
    // 项目中可以直接用`$`代替`jquery`
    jquery: '$'
  }
}
```

### 4. 依赖 external
第三方包不想打包，就可以通过 external 进行外部化：
```js
{
  external: ['react', 'react-dom']
}
```
在 SSR 构建或者使用 ESM CDN 的场景中，这个配置将非常有用


### 5. 插件
虽然 Rollup 能够打包输出出 CommonJS 格式的产物，但对于输入给 Rollup 的代码并不支持 CommonJS，仅仅支持 ESM。并且如果需要`注入环境变量`，`配置路径别名`，`压缩产物代码`等等，就需要引入相应的 Rollup 插件。

如果要支持第三方 CJS 的依赖，就需要安装两个核心的插件:
```zsh
pnpm i @rollup/plugin-node-resolve @rollup/plugin-commonjs 
```

- `@rollup/plugin-node-resolve` 是为了能够加载第三方依赖。否则 `import 'xx' from 'xx'` 不会被识别。
- `@rollup/plugin-commonjs` 是将 CJS 格式转换为 ESM 格式。

接着将插件放入 plugins 中：
```js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
{
  ...其他配置
  plugins: [resolve(), commonjs()],
}

```

插件除了可以放在 plugins 中，也可以放在 output 选项下的 plugins 中。不过只有使用 `Output` 阶段的相关钩子才能放在这个配置里。

Rollup 常用插件：
- @rollup/plugin-json： 支持.json的加载，并配合rollup的Tree Shaking机制去掉未使用的部分，进行按需打包。
- @rollup/plugin-babel：在 Rollup 中使用 Babel 进行 JS 代码的语法转译。
- @rollup/plugin-typescript: 支持使用 TypeScript 开发。
- @rollup/plugin-alias：支持别名配置。
- @rollup/plugin-replace：在 Rollup 进行变量字符串的替换。
- rollup-plugin-visualizer: 对 Rollup 打包产物进行分析，自动生成产物体积可视化分析图。
- rollup-plugin-terser: 压缩产物代码


## JavaScript Api 方式调用
上面都是通过 Rollup 的配置文件结合 `rollup -c` 完成打包。但有些场景需要定制一些打包过程，配置文件就不够灵活了。这个时候就需要 `JavaScript API` 来调用 Rollup，主要分为 `rollup.rollup` 和 `rollup.watch` 两个 API。

`rollup.rollup`: 用来一次性进行打包，新建 `build.js` 内容如下：
```js
// build.js
const rollup = require("rollup");

// 常用 inputOptions 配置
const inputOptions = {
  input: "./src/index.js",
  external: [],
  plugins:[]
};

const outputOptionsList = [
  // 常用 outputOptions 配置
  {
    dir: 'dist/es',
    entryFileNames: `[name].[hash].js`,
    chunkFileNames: 'chunk-[hash].js',
    assetFileNames: 'assets/[name]-[hash][extname]',
    format: 'es',
    sourcemap: true,
    globals: {
      lodash: '_'
    }
  }
  // 省略其它的输出配置
];

async function build() {
  let bundle;
  let buildFailed = false;
  try {
    // 1. 调用 rollup.rollup 生成 bundle 对象
    bundle = await rollup.rollup(inputOptions);
    for (const outputOptions of outputOptionsList) {
      // 2. 拿到 bundle 对象，根据每一份输出配置，调用 generate 和 write 方法分别生成和写入产物
      const { output } = await bundle.generate(outputOptions);
      await bundle.write(outputOptions);
    }
  } catch (error) {
    buildFailed = true;
    console.error(error);
  }
  if (bundle) {
    // 最后调用 bundle.close 方法结束打包
    await bundle.close();
  }
  process.exit(buildFailed ? 1 : 0);
}

build();

```

执行步骤如下：
1. 通过 rollup.rollup 方法传入 inputOptions, 生成 bundle 对象
2. 通过 bundle 对象的 generate 和 write 传入 `outputOptions`, 分别完成产物生成和磁盘写入。
3. 调用 bundle 对象的 close 方法结束打包。

`rollup.watch` 源文件变动后自动打包:
```js
// watch.js
const rollup = require("rollup");

const watcher = rollup.watch({
  // 和 rollup 配置文件中的属性基本一致，只不过多了`watch`配置
  input: "./src/index.js",
  output: [
    {
      dir: "dist/es",
      format: "esm",
    },
    {
      dir: "dist/cjs",
      format: "cjs",
    },
  ],
  watch: {
    exclude: ["node_modules/**"],
    include: ["src/**"],
  },
});

// 监听 watch 各种事件
watcher.on("restart", () => {
  console.log("重新构建...");
});

watcher.on("change", (id) => {
  console.log("发生变动的模块id: ", id);
});

watcher.on("event", (e) => {
  if (e.code === "BUNDLE_END") {
    console.log("打包信息:", e);
  }
});

```

## 小结
首先，学习了 Rollup 一般的使用方法，用 Rollup 打包出了第一份产物，然后使用 Rollup 中常用的配置项，包括input、output、external、plugins等核心配置，并以一个实际的打包场景在 Rollup 中接入插件功能。接着，尝试了 Rollup 更高级的使用姿势——通过 JavaScript API 使用两个经典的 API: rollup.rollup和rollup.watch。