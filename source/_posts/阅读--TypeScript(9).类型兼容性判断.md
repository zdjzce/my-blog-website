---
title: 阅读--TypeScript(9) 类型兼容性判断
date: 2023-06-21 22:45:12
tags:
  - 阅读
  - 面试题
  - TypeScript
categories:
  - [阅读]
---

在 TS 中， 有种概念叫做**结构化类型系统**，它有着自己的比较方式。以及另一种类型系统：标称类型系统。

比如以下代码就是结构化类型系统的表现：
```ts
class Cat {
  eat() {}
}

class Dog {
  eat() {}
}

function feedCat(cat: Cat) {}

feedCat(new Dog())  // 即使需要 Cat 但传入 Dog 没有报错
```
可以看到，即使要求了传入的参数为 Cat 的类，但传入 Dog 实例也没有关系，这是因为 TS 其实是比较传入的参数中是否包含了 Cat 的属性和方法。虽然他们类名不同，但仍然会被视为结构一致。
并且传入派生类也是可以的，即使他有自己特殊的属性和方法也不会报错，因为它也包含了入参对象所需的属性和方法。如果在 Dog 类中再添加一个新的属性或方法，在传入 Dog 的实例时也是不会报错的。与派生类同理。
```ts
class CatChild extends Cat {
  name = 'child'
}
feedCat(new CatChild()) // 也可以


class Dog {
  name = 'name'
  eat() {}
}

feedCat(new Dog()) // 也可以

```

不过一旦传入的参数没有包含参数类型所需的方法和属性时，就会报错。并且如果包含的函数即使名字相同，但返回值不同，也是不行的。
```ts

class Dog {
  name = '1'
}

feedCat(new Dog()) // 报错

```

结构化类型系统意味着基于完全的类型结构来判断类型兼容性


### 标称类型系统
在 TS 中，没有实现好的标称类型系统。比如如果有两个类型相同的变量，然后函数中有两个参数，不过只指定了其中一个类型，这样也是可以通过检查的，但其实他们的实际意义并不一样：
```ts
type USD: number
type CNY: number

const CNYCount: CNY = 100
const USDCount: USD = 100

function addCNY(source: CNY, input: CNY) {
  return source + input
}

addCNY(CNYCount, USDCount); // 不会报错 TS 只会检查类型
```

在示例中， USD 与 CNY 被认为是两个完全一致的类型，这其实不合常理因为他们表示的实际意义并不一致。
在标称类型系统中，这两个变量其实是两个完全不同的类型，类型的重要意义之一就是限制了**数据的可用操作与实际意义**。

### 模拟标称类型系统
如何区分两个类型它们是不同的？其实就是通过类型附带的额外信息来实现，要在 TS 中实现，其实也只需要为类型额外附加信息即可，比如 CNY 和 USD 分别附加上单位信息，同时也要保留原本的信息（number 类型）

