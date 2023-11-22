---
title: 阅读--JavaScript基础-Generator
date: 2023-11-22 11:06:12
tags:
  - 阅读
  - js
  - JavaScript
  - event loop
  - 英文博客
categories:
  - [阅读]
  - [英文博客]
---

本文译自 Jake 的博客，[tasks-microtasks-queues-and-schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/?utm_source=html5weekly)

```js
console.log('script start');

setTimeout(function () {
  console.log('setTimeout');
}, 0);

Promise.resolve()
  .then(function () {
    console.log('promise1');
  })
  .then(function () {
    console.log('promise2');
  });

console.log('script end');
```
这段代码执行的结果是：
```js
script start
script end
promise1
promise2
setTimeout
```

### Why this happens
每个线程都有自己的事件循环，因此每个 Web Worker 都有自己的事件循环，因此它可以独立执行，而同一源上的所有窗口共享一个事件循环，因为它们之间可以同步通信。事件循环不断运行，执行任务队列。一个事件循环有多个任务源，这保证了该源内的执行顺序(IndexedDB 等规范定义了自己的任务)，但浏览器可以在循环的每一轮选择从哪个源中获取任务，这允许浏览器优先执行对性能敏感的任务，例如用户输入。

浏览器可以从其内部进入 JavaScript/Dom 领域，并确保这些操作按顺序发生，在任务之间，浏览器可能会更新渲染。从单击鼠标到事件回调需要调度任务，解析 HTML 也是如此。


在上方的示例中，`setTimeout` 等待指定的延迟，然后为其回调安排一个新任务，这就是为什么 `setTimeout` 在 `script end` 记录的原因。因为 `script end` 是第一个任务的一部分，并且 `setTimeout` 记录在单独的任务中。


#### MicroTasks
微任务通常在当前执行的脚本之后立即发生, 例如对一批操作进行反应。
或者在不承担全新任务的情况下使某些事情异步。只要在执行过程中没有其他 JS，微任务队列就会在回调之后处理。并在每个任务结束时处理。在微任务期间排队的任何其他微任务都会添加到队列的末尾并进行处理。微任务包括 mutation observer 回调，如上面的示例中的 promise 回调。


一旦一个 promise 解决，它就会将一个微任务排队然后等待执行回调，这确保了 promise 即使调用了 resolve()，它的回调也是异步的。所以对于已解决的 promise ，会立即将 .then 加入微任务队列。这就是为什么 `promise1` 与 `promise2` 在 `script end` 之后打印的原因。因为当前正在执行的脚本必须在处理微任务之前完成。之所以 `promise1` 与 `promise2` 会在 `setTimeout` 之前打印，是因为微任务总是在下一个任务之前发生。

注：在这里原作者准备了一个很好的交互可以帮助理解。


### Tests
```html
<div class="outer">
  <div class="inner"></div>
</div>
```

```js
// Let's get hold of those elements
var outer = document.querySelector('.outer');
var inner = document.querySelector('.inner');

// Let's listen for attribute changes on the
// outer element
new MutationObserver(function () {
  console.log('mutate');
}).observe(outer, {
  attributes: true,
});

// Here's a click listener…
function onClick() {
  console.log('click');

  setTimeout(function () {
    console.log('timeout');
  }, 0);

  Promise.resolve().then(function () {
    console.log('promise');
  });

  outer.setAttribute('data-random', Math.random());
}

// …which we'll attach to both elements
inner.addEventListener('click', onClick);
outer.addEventListener('click', onClick);

```
当我们点击 inner 会发生什么？
打印结果首先是：'click' -> 'promise' -> 'mutate'
具体步骤为
1. 直接执行 onClick 函数，打印 'click'
2. 遇到 setTimeout 加入宏任务队列  宏任务队列: ['setTimeout']
3. .then 的函数加入微任务队列  微任务队列 ['promise']
4. 同步设置 outer 的属性
5. 触发 observer 的监听，加入微任务队列  微任务队列 ['promise', 'mutate']
6. 开始执行微任务，打印 promise
7. 打印 mutate

到此为止微任务都执行完毕了，是不是还要接着执行宏任务？非也，每个浏览器处理事件的行为不大一样，原文作者进行了叙述。在 chrome 里，会直接冒泡到 outer，再执行一遍上述步骤，也会打印 `'click' -> 'promise' -> 'mutate'` 这些任务都执行完毕后，才会打印最后的 timeout，打印两遍。
所以最后的结果为：`'click' -> 'promise' -> 'mutate' -> 'click' -> 'promise' -> 'mutate' -> timeout -> timeout`

这其实有点头皮发麻，为什么这么说，因为 EventListener 是同步调用的，他们没有优先级，可以在事件循环的任何阶段调用。也就是说执行顺序完全就是看浏览器了。。。


更头皮发麻的还有，如果使用 click() 方法直接触发事件打印结果更是奇怪了：
```js
click
click
promise
mutate
promise
timeout
timeout
```

总之我看到这里已经麻了，将 DOM 操作与事件循环结合起来看，就变得复杂起来。这里的 click() 会导致事件同步调度，与上面的输出结果完全不同了，并且后面也没有再触发一次 observer 的打印。。。