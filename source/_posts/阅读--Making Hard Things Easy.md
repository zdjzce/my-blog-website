---
title: 阅读--Making hard things easy
date: 2023-10-20 16:18:12
tags:
  - 阅读
  - Julia Evans
categories:
  - [阅读]
---

原文链接：https://jvns.ca/blog/2023/10/06/new-talk--making-hard-things-easy/
本文对 Julia Evans 写的这篇博客进行总结。

``` bash
f() {
  mv *.txt ./tmp
  echo "success"
}

f
```

即使当前目录下没有名为 tmp 的文件夹并且执行报错，bash 依然会打印出 success。


在顶部加入 `set -e` 后，将不会打印 success

```bash
f() {
  mv *.txt ./tmp
  echo "success"
}

f || echo "failed"
```

log: 
``` bash
mv: rename *.txt to ./tmp: No such file or directory
success
```

在调用 f 函数后并且试图打印 `echo failed` 竟然 tmd 又打印出了 success ???

竟然是因为 `|| echo "failed"` 不能在全局与 `set -e` 一起使用？？

以上仅是一个示例，作者有一点说的很对：当我们很久不使用某个语言或者工具，会遇到很多奇怪且琐碎的问题，让我们感到困扰。那么怎么样才能让这样的事情变得简单？我们又能怎么做呢？

> One thing that I sometimes hear is -- a newcomer will say "this is hard", and someone more experienced will say "Oh, yeah, it's impossible to use bash. Nobody knows how to use it."  ----  还蛮有意思的，新手觉得太难，老鸟说这玩意儿不可能用，没人直到怎么用这玩意儿。

那么要怎么从对一个东西毫不了解，过渡到能够基本正确使用一个工具或者语言呢？

Julia 在原文中指明：谁对 Bash 最了解？肯定是电脑！那么电脑里又有什么**工具**对 Bash 最了解？ ShellCheck！它能够发现 bash 中可能会出现的问题并且提示你，在上面的代码里，bash 不能很好的给出提示，但是配合这个工具能够让你尽快的定位问题，他会提醒你说：`|| echo "failed"` 不能在全局与 `set -e` 一起使用。那么有这么好的工具能够去解决 Bash 编写的问题，还记那么多琐碎的边界干什么？ **但很多人却不知道**直到 Julia 跟他们说了 shellCheck，他们甚至认为这是 Julia 发明的 Linter (笑，

紧接着他说：
> So I think an incredible thing we can do is to reflect on the tools that we're using to reduce our cognitive load and all the things that we can't fit into our minds, and make sure our friends or coworkers know about them. ---- 所以我认为我们可以做一件难以置信的事情，就是反思我们用来减轻认知负担的工具，处理我们脑海中无法容纳的所有事物，并确保我们的朋友或同事了解它们。

Julia 主张当遇到问题的时候可以及时求助，如果有人对他说了很多关于 Bash 出现的错误，他可能会选择解决这个问题。


关于 HTTP，Julia 提到了一个故事：他有一个朋友跟他说一些新的开发人员正在努力解决 HTTP 给他们带来的问题，Julia 感到很困惑，HTTP 有什么难的？