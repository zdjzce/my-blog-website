---
title: 阅读--Making hard things easy
date: 2023-10-20 16:18:12
tags:
  - 阅读
  - Node.js
categories:
  - [阅读]
---

原文链接：https://jvns.ca/blog/2023/10/06/new-talk--making-hard-things-easy/


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