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


## 迭代器
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

## 生成器
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


## 生成器与协程
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

![avatar]('../my-image/xiecheng.webp')
上图表示了这段代码的执行过程:

通过调用生成器函数 genDemo 来创建一个协程 gen, 创建之后, gen 协程并没有立即执行.
要让 gen 协程执行, 需要通过调用 gen.next.
当协程正在执行的时候, 可以通过 yield 关键字来暂停 gen 协程的执行, 并返回主要信息给父协程.
如果协程在执行期间, 遇到了 return 关键字, 那么 JavaScript 引擎会结束当前协程, 并将 return 后面的内容返回给父协程.

## 生成器与调用栈


## 可迭代对象

## 集合的迭代器

## 迭代器高级功能


## 生成器与 Promise

## async / await 