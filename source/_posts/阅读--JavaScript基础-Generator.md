---
title: 阅读--JavaScript基础-Generator
date: 2023-11-14 14:44:12
tags:
  - 阅读
  - js
  - JavaScript
  - Generator
categories:
  - [阅读]
---

生成器往往是开发者容易忽略的一个 js 特性，虽然平常我们并不会直接使用 Generator，但基于 Promise 与 生成器实现的 `async/await` 却是必不可少。我认为了解生成器的全貌还是很有必要的。


### 迭代器
迭代器通常在各类语言都会实现，并且也作为一种设计模式存在。在 JS 中，迭代器被用于可迭代对象，任何实现迭代器的对象都可以被称为**可迭代对象**，原生的 JS 可迭代对象包括:
1. Array
2. Map
3. Set
4. String
5. TypedArray (特定类型的数组，如 Int8Array, Uint8Array)
6. arguments

而判定它是否是可迭代对象的一个方法是能否使用 `for of`，像普通的 object 对象如果我们想要直接遍历获取值，一种方式是通过 `for in` 根据 key 来获取，而不能像数组一样直接通过 `for of` 获取元素，那么如果需要直接获取对象的值，这个时候就需要请出迭代器了：

```js
const obj = {
  name: 'test',
  age: 18,
  [Symbol.iterator]: () => {
    const keys = Object.keys(obj)
    let index = 0
    return {
      next: () => {
        return {
          value: obj[keys[index++]],
          done: index > keys.length
        }
      }
    }
  }
}

const iterator = obj[Symbol.iterator]()

console.log(iterator.next()) // { value: 'test', done: false }
console.log(iterator.next()) // { value: 18, done: false }
console.log(iterator.next()) // { value: undefined, done: true }

```
迭代器有一个 next 方法, 它返回一个对象：对象的 value 属性是下一个值, done 属性是一个布尔值, 表示迭代是否结束。
而实现迭代器对象则是在对象中添加 `Symbol.iterator` 方法，并且返回刚刚所说的 **next** 方法。

### 生成器
为什么我们要大费周章的说迭代器？虽然迭代器很有用，但需要去维护内部的状态。生成器则提供了更强大的选择，它可以使非连续执行的函数，并且也可以作为迭代算法：

将上面的可迭代器对象里面的迭代器更改为生成器后是这样的：

```js
const obj = {
  name: 'test',
  age: 18,
  [Symbol.iterator]: function* () {
    const keys = Object.keys(this);
    let index = 0;
    while (index < keys.length) {
      yield this[keys[index++]];
    }
  }
}

const iterator = obj[Symbol.iterator]()

console.log(iterator.next()) // { value: 'test', done: false }
console.log(iterator.next()) // { value: 18, done: false }
console.log(iterator.next()) // { value: undefined, done: true }
```
可以看到实现的效果是一样的。我们在 function 后方加上了 `*` 符号，并且在循环内部使用了 `yield` 关键字，在调用生成器函数后与预期结果一致，生成器函数调用后会返回 **next** 方法。我们**并不需要维护**迭代状态以及下个值，所以其实它比迭代器有着更高的自由度。


### 生成器与协程
为什么生成器能够随时暂停，随时恢复？这就不得不提到 **协程(Coroutine)** 的概念。一个进程可能包含多个线程，而一个线程又可能包含多个协程。不过一个线程中同时只能执行一个协程任务。如果当前执行任务的是 A 协程，要启动 B 协程，就需要从 A 上将主线程控制权交给 B，如果从 A 协程启动 B 协程，可以把 A 协程成为 B 的父协程。

一个很重要的概念是：`协程并不是被操作系统所管理的，它完全由程序控制，好处在于性能得到了很大的提升，不会想线程切换那样消耗资源`

```js
function* genDemo() {
  console.log('开始执行第一段')
  yield 'generator 2'

  console.log('开始执行第二段')
  yield 'generator 2'

  console.log('开始执行第三段')
  yield 'generator 2'

  console.log('执行结束')
  return 'generator 2'
}

console.log('main 0')
let gen = genDemo()
console.log(gen.next().value)
console.log('main 1')
console.log(gen.next().value)
console.log('main 2')
console.log(gen.next().value)
console.log('main 3')
console.log(gen.next().value)
console.log('main 4')

// main 0
// 开始执行第一段
// generator 2
// main 1
// 开始执行第二段
// generator 2
// main 2
// 开始执行第三段
// generator 2
// main 3
// 执行结束
// generator 2
// main 4
```

![avatar]('/my-image/xiecheng.webp')
上图表示了这段代码的执行过程:

通过调用生成器函数 genDemo 来创建一个协程 gen, 创建之后, gen 协程并没有立即执行.
要让 gen 协程执行, 需要通过调用 gen.next.
当协程正在执行的时候, 可以通过 yield 关键字来暂停 gen 协程的执行, 并返回主要信息给父协程.
如果协程在执行期间, 遇到了 return 关键字, 那么 JavaScript 引擎会结束当前协程, 并将 return 后面的内容返回给父协程.

### 生成器与调用栈

### 生成器与 Promise
生成器在精细控制异步场景的情况下会特别好用，假设有个一步函数用来获取用户 ID，获取成功后立即调用另一个异步函数，获取成功后返回用户名。
像这样的场景我们很容易想到使用 `Promise`, `async/await`。不过这里使用生成器来完成。

```js
function* getResult() {
  const userIdRes = yield fetch('/id')
  const { id } = yield userIdRes.json()

  const userNameRes = yield fetch('/name', { id })
  const { name } = yield userNameRes.json()

  console.log(name)
}

const gen = getResult()

gen
  .next()
  .value.then((response) => gen.next(response).value)
  .then((response) => gen.next(response).value)
  .then((response) => gen.next(response).value)
  .then((response) => gen.next(response).value)
```


在生成器函数 getResult 中写入各种异步函数, 使用 next 来控制生成器的暂停和恢复执行. 通常, 会把执行生成器的代码封装成一个函数, 这个函数驱动了 getResult 函数继续往下执行, 我们把这个执行生成器代码的函数称为执行器, 比如著名的 co 工具就是干这事的.
```js
co(getResult())
```

### async / await 
基于前文所述的 Promise 与 Generator 写出来的代码像是同步执行，可读性较高。在 ES7 中有了更好的替代方案，也就是 `async/await`。它改进了生成器的缺点, 提供了在**不阻塞主线程**的情况下使用同步代码实现异步访问资源的能力.

 async 是一个通过异步执行并隐式返回 Promise 作为结果的函数. 即如果在 async 函数里面使用了 await, 那么此时 async 函数就会暂停执行, 并等待合适的时机来恢复执行。如果使用 await 等待一个没有 resolve 的 Promise, 那么这也就意味着, async 指向的函数会一直等待下去。

 和生成器函数一样, 使用了 async 声明的函数在执行时, 也是一个单独的协程, 我们可以使用 await 来暂停该协程, 由于 await 等待的是一个 Promise 对象, 我们可以 resolve 来恢复该协程。