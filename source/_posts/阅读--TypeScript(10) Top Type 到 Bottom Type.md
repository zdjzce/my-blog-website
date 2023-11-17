---
title: 阅读--TypeScript(10) Top Type 到 Bottom Type
date: 2023-08-20 01:45:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
  - [TypeScript]
---

TS 中对所有类型都明确了兼容关系，也就是类型层级。从最上层的 any, unknow, 到最底层的 never。

### 原始类型父子关系
一个基础类型和对应的字面量类型必然存在父子类型关系。
```ts
type Result1 = "z" extends string ? 1 : 2; // 1
type Result2 = 1 extends number ? 1 : 2; // 1
type Result3 = true extends boolean ? 1 : 2; // 1
type Result4 = { name: string } extends object ? 1 : 2; // 1
type Result5 = { name: 'x' } extends object ? 1 : 2; // 1
```

### 联合类型
在联合类型中，只要符合其中一个类型，就可以认为实现了这个联合类型：

```ts
type Result7 = 1 extends 1 | 2 | 3 ? 1 : 2  // 1
type Result8 = 'z' extends 'z' | 'b' | 'a' ? 1 : 2 // 1
type Result9 = true extends true | 'a' ? 1 : 2 // 1
type Result10 = string extends string | boolean // 1
```
即使联合类型中的某一项与类型并不匹配，但只要符合其他项，就满足条件。

如果反过来，判断字面量组成的联合类型是否是原始类型的子类型，情况就稍有不同：
```ts
type Result11 = 'a' | 'b' | 'c' extends string ? 1 : 2 // 1
type Result12 = 'a' | 'b' | 1 extends string  ? 1 : 2 // 2

```
去掉上面 Result12 的特殊情况，由此其实可以得出结论: 字面量类型 < 包含此字面量类型的联合类型 < 对应的原始类型:
```ts
type Result13 = 'x' extends 'x' | '599'
  ? 'x' | '599' extends string
    ? 2
    : 1
  : 0;
// 2
```

### 包装类型
string 会是 String 的子类型，String 类型会是 Object 类型的子类型，神奇的是，中间还有其他的类型：
```ts
type Result14 = string extends String ? 1 : 2 // 1
type Result15 = String extends {} ? 1 : 2 // 1
type Result16 = {} extends object ? 1 : 2 // 1
type Result17 = object extends Object ? 1 : 2 //1
```

这看起来有点不符合常理，因为 {} 是 object 的字面量类型，但是 String 竟然是 {} 的子类型。在 TS 中所有原始类型的装箱类型都继承于 {}，将 **{}** 理解为空对象或许会更合适点。
可以看到 `string extends String; String extends {}` 但是如果 `string extends {}` 却不会成立。

对于`{}、Object、object` 他们之间可以相互是对方的子类型。

```ts
type Result16 = {} extends object ? 1 : 2; // 1
type Result18 = object extends {} ? 1 : 2; // 1

type Result17 = object extends Object ? 1 : 2; // 1
type Result20 = Object extends object ? 1 : 2; // 1

type Result19 = Object extends {} ? 1 : 2; // 1
type Result21 = {} extends Object ? 1 : 2; // 1
```
但是他们的理解方式是不一样的，`{} extends object; {} extends Object` 可以理解为这个空对象是 'object' 的字面量类型，但 `object extends {}; Object extends {}` 却是从结构化类型系统的比较出发的，即 `{}` 是一个空对象，可以被视为所有类型的基类，也就是类型都包含了 `{}` 中的方法和属性。

至于 `Object` 与 `object` 则要分开讨论， Object 包含了除了 Top Type 以外的所有类型(基础类型，函数类型等)。object 包含了所有非原始类型的类型（数组、对象、函数）

可以得出结论： 原始类型 < 装箱类型 < Object 类型

### Top Type
TS 类型中，最顶端的就是 any, unknown 这两个类型。因此，Object 类型自然会是 any 与 unknown 类型的子类型。
```ts
type Result22 = Object extends any ? 1 : 2 // 1
type Result23 = Object extends unknown ? 1 : 2 // 1
```

如果将条件类型的两端对调一下：
```ts
type Result24 = any extends Object ? 1 : 2 // 1 | 2
type Result25 = unknown extends Object ? 1 : 2 // 2 
```

看起来有点匪夷所思，但仔细想想, any 代表了任何可能的类型，当使用 any extends 时。它其实同时包含了两个部分，即让条件成立的一部分，以及让条件不成立的一部分。在 TS 内部的条件类型处理中，如果接受判断的是 any，那么会直接返回条件结果组成的联合类型。

any 在赋值给其他类型时来者不拒，但 unknown 则只允许赋值给 unknown 类型和 any 类型。这也好理解，因为它代表着 '不知道的类型'，赋值给其他类型岂不是也代表着其他类型也是未知的？

any 类型和 unknown 类型的比较也是相互成立的：
```ts
type Result31 = any extends unknown ? 1 : 2  // 1
type Result32 = unknown extends any ? 1 : 2  // 1
```

那么接着其实就可以得出类型层级的结论:  Object < any / unknown


### Bottom Type
TS 内置的 Bottom Type 代表了 ‘虚无’ 的类型，一个根本不存在的类型，对于这样的类型，它会是`任何类型的子类型`，也包括字面量类型：
```ts
type Result33 = never extends '123' ? 1 : 2 // 1
type Result34 = never extends string ? 1 : 2 // 1
```
那么 null / undefined / void 又代表什么呢？在 TS 中他们只是基础类型，比 never 还要高一个层级。和 string / number / object 病灭有什么区别
所以可以得出结论 never < 字面量类型。


### 类型层级链
接下来基于上面的结论，就可以得出完整的类型层级链：
```ts

type TypeChain = never extends 'zdj' ? 'zdj' extends string ? string extends String ? String extends {} ? {} extends object ? object extends Object ? Object extends any ? any extends unknown ? unknown extends unknown ? 1 : 2 : 3: 4 : 5: 6 : 7 : 8 : 9 : 10 // 1
```


### 其他比较场景
对于基类和派生类，派生类本身就是继承于基类，有着自己的属性和方法，如果将派生类与基类进行比较，那么在 TS 中会进行结构化类型比较，类型必然会存在子类型关系。

联合类型的判断，前面只判断了联合类型的单个成员，如果是多个成员：
```ts
type Result35 = 1 | 2 | 3 extends 1 | 2 | 3 | 4 | 5 ? 1 : 2  // 1
type Result36 = '1' | '2' | '3' extends '1' | '2' | '3' | '4' | '5' ? 1 : 2  // 1
type Result37 = 1 | 2 | 3 extends 1 | 4 | 5 ? 1 : 2  // 2
```
实际上，对于联合类型的比较，只要看一个联合类型是否是一个联合类型的子集就知道结果了。

对于数组的比较会稍微有些特殊，对于元组与数组会稍有不同，下面是例子：
```ts
type Result38 = [number, string] extends number[] ? 1 : 2 // 1
type Result39 = [number, string] extends number[] ? 1 : 2  // 2
type Result40 = [number, string] extends (number | string)[] ? 1 : 2 // 1

type Result41 = any[] extends number[] ? 1 : 2 // 1
type Result42 = unknown extends number[] ? 1 : 2 // 2
type Result43 = never extends number[] ? 1 : 2 // 1
```

对于 39 元组中包含了 string 类型，所以不成立。
对于 40 要求条件为 (number | string) 联合类型中的任意类型组成的数组，所以成立。


最后可以完全得出类型层级的结构：
TopType: any unknown
顶级原型: Object
装箱类型: String Number Boolean Symbol Array object Date Function Promise RegExp Map
基础类型: string number boolean undefined null symbol
字面量类型: 1  '1' true ...
Bottom Type: never