---
title: 阅读--Vite(5) Rollup
date: 2023-07-27 18:00:00
tags:
  - 阅读
  - 面试题
  - Vite
  - Rollup
categories
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
虽然 Rollup 能够打包输出出 CommonJS 格式的产物，但对于输入给 Rollup 的代码并不支持 CommonJS，仅仅支持 ESM。