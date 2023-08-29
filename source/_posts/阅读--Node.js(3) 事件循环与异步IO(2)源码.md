---
title: 阅读--Node.js(3) 事件循环与异步I/O(2) 源码
date: 2023-08-29 11:36:12
tags:
  - 阅读
  - Node.js
categories:
  - [阅读]
---
在 Node.js 中，事件循环的主要代码如下：
```c++
do {
  if (env->is_stopping()) break;
  uv_run(env->event_loop(), UV_RUN_DEFAULT);
  if (env->is_stopping()) break;

  platform->DrainTasks(isolate);

  more = uv_loop_alive(env->event_loop());
  if (more && !env->is_stopping()) continue;

  if (EmitProcessBeforeExit(env).IsNothing())
    break;

  {
    HandleScope handle_scope(isolate);
    if (env->RunSnapshotSerializeCallback().IsEmpty()) {
      break;
    }
  }

  // Emit `beforeExit` if the loop became alive either after emitting
  // event, or after running some callbacks.
  more = uv_loop_alive(env->event_loop());
} while (more == true && !env->is_stopping());

```

`uv_run()` 就是跑一轮事件循环。其中的 `UV_RUN_DEFAULT` 代表着执行事件循环直到不再有活动的和被引用的句柄(`handle`)或请求(`request`)。**就是直到事件循环监听的池子里面已经没有关心的事件在等待了**。

所以实际上上面这段代码有两层循环，第一层 `uv_run()` 里面实际的事件循环，第二层为外层的 `do-while`。

### **外层 do-while**
可以看到 while 循环执行的条件是当 is_stopping 不为 true，一旦处于停止状态，就立马结束事件循环。同时另一个判断条件 `more`，当第一次 uv_run 函数执行以后，去跑 V8 Platform 中的一些任务，跑完之后并不知道是否有新的事件，所以得判断一下 uv_event_loop() 现在是否还是以为 0, 若不为 0 则直接进入下一个大循环，如果真的为 0 ，再去进行后方的判断处理。

**而外层的 do-while 循环的存在是为了保证内部循环结束后，程序是真的要结束了，还是有可能会再丢事件进去重新来一轮内部循环。**

### **内部循环**
内部循环就是 uv_run() 中的内容(libuv 里的代码)。
```c
int uv_run(uv_loop_t* loop, uv_run_mode mode) {
  int timeout;
  int r;
  int ran_pending;

  r = uv__loop_alive(loop);
  if (!r)
    uv__update_time(loop);

  while (r != 0 && loop->stop_flag == 0) {
    uv__update_time(loop);
    uv__run_timers(loop);
    ran_pending = uv__run_pending(loop);
    uv__run_idle(loop);
    uv__run_prepare(loop);

    timeout = 0;
    if ((mode == UV_RUN_ONCE && !ran_pending) || mode == UV_RUN_DEFAULT)
      timeout = uv_backend_timeout(loop);

    uv__io_poll(loop, timeout);

    /* Run one final update on the provider_idle_time in case uv__io_poll
     * returned because the timeout expired, but no events were received. This
     * call will be ignored if the provider_entry_time was either never set (if
     * the timeout == 0) or was already updated b/c an event was received.
     */
    uv__metrics_update_idle_time(loop);

    uv__run_check(loop);
    uv__run_closing_handles(loop);

    if (mode == UV_RUN_ONCE) {
      /* UV_RUN_ONCE implies forward progress: at least one callback must have
       * been invoked when it returns. uv__io_poll() can return without doing
       * I/O (meaning: no callbacks) when its timeout expires - which means we
       * have pending timers that satisfy the forward progress constraint.
       *
       * UV_RUN_NOWAIT makes no guarantees about progress so it's omitted from
       * the check.
       */
      uv__update_time(loop);
      uv__run_timers(loop);
    }

    r = uv__loop_alive(loop);
    if (mode == UV_RUN_ONCE || mode == UV_RUN_NOWAIT)
      break;
  }

  /* The if statement lets gcc compile it to a conditional store. Avoids
   * dirtying a cache line.
   */
  if (loop->stop_flag != 0)
    loop->stop_flag = 0;

  return r;
}
```

<!-- TODO 这一部分之后对 Node.js 稍微熟悉后回过头来继续梳理源码 -->