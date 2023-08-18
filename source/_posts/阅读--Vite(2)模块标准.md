---
title: 阅读--Vite(2) 模块标准
date: 2023-05-07 17:34:00
tags:
  - 阅读
  - 面试题
  - Vite
categories:
  - [阅读]
---

### **无模块化标准阶段**
早在模块化标准还没有诞生的时候，前端界已经产生了一些模块化的开发手段，如`文件划分、命名空间和 IIFE 私有作用域`。

#### **1. 文件划分**
顾名思义就是将不同逻辑或功能的实现放在不同的文件里。
```js
// module-a.js
let data = 'data';
```
```js
// module-b.js
function method() {
  console.log("execute method");
}
```

```html
// index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script src="./module-a.js"></script>
    <script src="./module-b.js"></script>
    <script>
      console.log(data);
      method();
    </script>
  </body>
</html>
```
这么看似乎也分散不同模块的逻辑，但也存在风险：
1. 模块变量相当于全局声明，会有命名冲突的风险。
2. 变量都在全局定义，不知道在哪个模块，难以调试。
3. 无法清晰管理模块间的依赖关系和加载顺序。

#### **2. 命名空间**
`命名空间`是模块化的另一种实现手段，可以解决前文全局变量带来的问题。
```js
// module-a.js
window.moduleA = {
  data: "moduleA",
  method: function () {
    console.log("execute A's method");
  },
};

// module-b.js
window.moduleB = {
  data: "moduleB",
  method: function () {
    console.log("execute B's method");
  },
};
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script src="./module-a.js"></script>
    <script src="./module-b.js"></script>
    <script>
      // 此时 window 上已经绑定了 moduleA 和 moduleB
      console.log(moduleA.data);
      moduleB.method();
    </script>
  </body>
</html>
```

#### **3. IIFE**
相比于命名空间的模块化手段， IIFE 实现的模块化安全性更高，对作用域的区分更彻底：
```js
// module-a.js
(function () {
  let data = "moduleA";

  function method() {
    console.log(data + "execute");
  }

  window.moduleA = {
    method: method,
  };
})();

// module-b.js
(function () {
  let data = "moduleB";

  function method() {
    console.log(data + "execute");
  }

  window.moduleB = {
    method: method,
  };
})();
```

```html
  <body>
    <script src="./module-a.js"></script>
    <script src="./module-b.js"></script>
    <script>
      // 此时 window 上已经绑定了 moduleA 和 moduleB
      console.log(moduleA.data);
      moduleB.method();
    </script>
  </body>
```

每个 IIFE 都会创建一个私有的作用域，内部的变量外部无法访问到，只有模块内能访问，这就是模块私有成员功能，避免模块私有成员被其他模块非法篡改。相比于命名空间更安全。
IIFE 和命名空间都是为了解决全局变量带来的命名冲突及作用域不明确的问题，却没有解决————模块加载。如果模块间存在依赖关系，那么 script 标签加载顺序就得正确，不对就会产生 Bug。


#### CommonJS 规范
Common 是业界最早正式提出的 JS 模块规范，主要用于服务端。这个规范也被业界广泛应用。对于模块规范一般包含2方面：
- 统一的模块化代码规范
- 实现自动加载模块的加载器（loader）
  
```js
// module-a.js
var data = "hello world";
function getData() {
  return data;
}
module.exports = {
  getData,
};

// index.js
const { getData } = require("./module-a.js");
console.log(getData());
```

代码中使用 `require` 来导入一个模块，用 `module.exports` 导出一个模块。实际上 Node.js 内部会有响应的 loader 转译模块代码，最后模块代码会被处理成：
```js
(function (exports, require, module, __filename, __dirname) {
  // 执行模块代码
  // 返回 exports 对象
});
```
require 为 node 实现的方法，所以在浏览器中并不能使用，除非使用第三方库支持。并且 require 为同步调用，在服务器中引用资源并不是问题，因为服务器在启动时调用api，不异步加载也没有问题。

#### 