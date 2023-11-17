---
title: 阅读--Making hard things easy
date: 2023-10-20 16:18:12
tags:
  - 阅读
  - Julia Evans
categories:
  - [阅读]
  - [英文博客]
---

原文链接：https://jvns.ca/blog/2023/10/06/new-talk--making-hard-things-easy/ ，本文对 Julia Evans 写的这篇博客进行总结。
作者举出四个语言（Bash、HTTP、SQL、DNS）的一些小例子并且结合遇到的问题进行解读，说出一套将事情变得简单的方法。

以下均使用第一人称进行描述。


### Bash
Bash 是我们不常用的脚本语言，也许半年？一年甚至数年才会编写一次 bash 代码。这导致我们遇到问题往往会很慌张，以下是一个例子：

``` bash
f() {
  mv *.txt ./tmp
  echo "success"
}

f
```
现在我们需要将当前所有后缀为 `.txt` 的文件移动到 tmp 文件夹中，但当前目录中并没有 tmp 这个文件夹，因此我们按照编码经验来说，希望它会抛出异常。但事实不是如此。
即使当前目录下没有名为 tmp 的文件夹并且执行报错，bash 依然会打印出 success。

然后我了解到在 bash 顶部加入 set-e 可以让 bash 遇到错误停止运行代码, 加入后这将不会打印 success：
```bash
set -e
```

现在我想在跳出错误后能够打印 `failed`，但神奇的事情发生了。
```bash
set -e
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

以上仅是一个示例，当我们很久不使用某个语言或者工具，会遇到很多奇怪且琐碎的问题，让我们感到困扰。那么怎么样才能让这样的事情变得简单？我们又能怎么做呢？要怎么从对一个东西毫不了解，过渡到能够基本正确使用一个工具或者语言呢？

> One thing that I sometimes hear is -- a newcomer will say "this is hard", and someone more experienced will say "Oh, yeah, it's impossible to use bash. Nobody knows how to use it."  ----  还蛮有意思的，新手觉得太难，老鸟说这玩意儿不可能用，没人知道怎么用这玩意儿。

谁对 Bash 最了解？肯定是电脑！那么电脑里又有什么**工具**对 Bash 最了解？ ShellCheck！它能够发现 bash 中可能会出现的问题并且提示你，在上面的代码里，bash 不能很好的给出提示，但是配合这个工具能够让你尽快的定位问题，它会提醒你说：`|| echo "failed"` 不能在全局与 `set -e` 一起使用。那么有这么好的工具能够去解决 Bash 编写的问题，还记那么多琐碎的边界干什么？ **但很多人却不知道**直到我跟他们说了 shellCheck，他们甚至认为这是我发明的 Linter (笑。

> So I think an incredible thing we can do is to reflect on the tools that we're using to reduce our cognitive load and all the things that we can't fit into our minds, and make sure our friends or coworkers know about them. ---- 所以我认为我们可以做一件难以置信的事情，就是反思我们用来减轻认知负担的工具，处理我们脑海中无法容纳的所有事物，并确保我们的朋友或同事了解它们。

**在遇到错误的时候我们常常会分享这些错误以及解决的思路，在社区上有许多人对此非常热衷，他们是乐于助人且技术精湛，也许当遇到问题的时候可以及时求助，兴许就有许多人遇到过同种类的问题。**


### HTTP
关于 HTTP，有一个故事：我有一个朋友跟我说一些新的开发人员正在努力解决 HTTP 给他们带来的问题，我感到很困惑，HTTP 有什么难的？不过我的思想很快发生了转变，有个朋友问我说：为什么你设置的 HTTP 请求头如此重要？我思索片刻：“要从浏览器开始说起”，浏览器。。。浏览器！！！火狐有着两千万行的代码，从上世纪九十年代就开始迭代，自从人们发现有很多安全性的漏洞，浏览器安全模型已经有一百万次变更了。浏览器有太多需要了解的地方了。如果一个问题涉及到 2000 万行代码，那么会让人感到非常困惑。

那么我们如何让它变得更容易呢？如何围绕这两千万行代码进行思考？

这里就不得不说到 HTTP 的请求头，HTTP 标头太多了，随便看一下都有四十多个，还有很多非官方的标头，一眼望过去标头完全是懵逼的状态。不过我对常用的标头进行了总结，有15个请求标头，这是一个主观的清单，拆解后的信息对我来说效果会更好。

> The general way I think about this trick is "turn a big list into a small list". 我一般对这个技巧的思考方式是“把一个大列表变成一个小列表”。

所以我的思考方式是：**把一个大列表变成小列表！**（我觉得可以延伸下：其实代入到生活里，将大的事情拆解为多个子模块，由易到难会让事情变得简单许多）。所以我们只需要记得一部分内容，剩下的内容交给各大参考文档就好了。对于 HTTP 来说，我非常喜欢 [RFC9110](https://www.rfc-editor.org/rfc/rfc9110) 的新权威参考。


### SQL
我开始考虑写关于 SQL 的文章是因为有人提到他们正在尝试学习 SQL，所以我想知道 - SQL 有什么难？是什么阻碍了我们尝试学习它？当我对某件事的难点感到困惑时，通常不是整件事情的难易度，而是我需要努力理解它的难点在哪里，当使用某个东西一段时间很多知识点是会遗忘的。

我习惯于阅读 SQL 查询，我们需要查询找到刚好拥有两只猫的人，按照吮吸一次就是， SELECT, FROM, WHERE, GROUP BY。选择，从，在哪里，分组依据。但是我有个小白朋友问我说：这是在做什么？我认为我朋友的观点是，这个 SQL 查询并不是他实际发生的顺序，如何使这个语句更容易呢？

我喜欢思考：计算机首先做什么？按时间顺序首先发生什么？

现在假设有一张 cats 表我们去做一些事情：
1. 从 cat 表开始 **FROM cats**
2. 过滤删除一些东西  **WHERE owner !=3**
3. 然后做一些组 **GROUP BY owner**
4. 接着过滤一些组 **HAVING count(*)=2**
5. 再做一些聚合 **SELECT owner,count(*)**
6. 然后对他进行排序，限制结果 **ORDER BY owner DESC**

所以这就是我对 SQL 常用语句的小总结：FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT。至少对于简单的例子来说，已经很通用了。

还有其他的例子，例如 CORS，如果你想在你的浏览器创建 `cross-origin`，可以将浏览器和服务器间每个详细的通讯按照时间顺序写下来，我相信将时间顺序发展的事情写下来能够让事情变得简单不少，也能够增加我们的理解度。

但其实这并不简单，这需要我们对很多内部构造了解的足够深才能够做到，举个例子：
我编写了 “在 Linux 中输入 Hello World 前发生了什么”，我在想，十年前有没有写过这篇文章呢？还真的有！，2013 年的时候撰写的这篇文章仅有 710 个单词，而 2023 年却有 4288 个单词！这并不是说 Linux 在这十年间有许多变动，只不过 2013 年的文章的信息少了很多，我在 23 年这个节点的知识储备要比我十年前多上不少，也许再过十年我的知识储备还会上涨很多！

对于大多数人而言，掌握的知识太过广泛其实意味着深度不够，只能说明你了解的比较多甚至能够融汇贯通，当你需要在一个领域里解决一个很深的问题时，不一定能够很顺畅。但这个领域一定有深挖的人，如果你问他这个是怎么回事他兴许一下就能够回答你说这是怎么发生的，怎么解决，为什么会发生。所以还蛮有意思的，每个人兴许都有自己专精的领域，向他人学习是个很好的习惯。

### DNS
平常我们不会涉及到 DNS 的编写，但 DNS 又在互联网上处处可见，处处都有它的影子，简单来说，当我们从浏览器访问一个地址时，最后会走到认证服务器(这是域名 DNS 记录所在位置的真实来源)。但是中间的过程还有调用的函数和缓存。

在缓存中对用户而言是看不见的，不能检查更无法控制。所以缓存与真实来源服务器的对话是根本看不到的。这对于我们来说已经是黑盒了，那么当一个系统大多是完全隐藏的东西，应该如何锻炼自己对系统的直觉？

既然我们无法控制真实来源服务器中的任何一个，那么为什么不写一个权威的域名服务器呢？每个人都可以写！我可以返回一个记录信息给用户，我将制作一个名为 strangeloop 的 DNS 记录，当我请求某一个接口时，都会收到 DNS 服务器返回的报告信息。这其实就能够帮我们排查一些问题了，当没有条件的时候，我们可以创造条件。

> Because when I look at that output, I'm not looking at all of it, I'm just looking at a few things. My eyes are ignoring the rest of it.

而 DNS 另一个让人常困惑的地方是，DNS 解析器缓存了数据，那么要怎么知道解析器是否缓存了某个域名？为什么从解析器得到了这个结果？这是隐藏的，不过依然有方法可以查看它。我通常用 dig 这个工具来进行 DNS 查询，它有一个名为 `+norecurse` 的标志，可以用它来查询解析程序，并要求它返回已缓存的结果。当打印出信息后，会发现太多无用的信息了！这也太复杂了，但实际上这只是交互体验差，从上世纪九十年代至今一直维持这样的信息结构，糟糕的输出格式常常会让新手不知所措，所以就需要忽略一些无用的部分，专注你要的信息。



### what can we do?
我们能够做什么让人们从 “我真的不明白这个东西” 到 “我基本上可以处理这个问题，至少节省 90% 的时间”？

> 1. sharing useful tools —— 共享有用的工具  
> 2. sharing references —— 共享参考文档
> 3. telling a chronological story of what happens on your computer —— 按时间顺序讲述计算机上发生的事
> 4. turning a big list into a small list of the things you actually use —— 将大列表变成小列表
> 5. showing the hidden things —— 展示隐藏的东西
> 6. demoing a confusing tool and telling folks which parts I pay attention to   演示一个令人困惑的工具并告诉人们我关注哪个部分