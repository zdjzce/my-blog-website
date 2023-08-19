---
title: 阅读--TypeScript(10) Top Type 到 Bottom Type
date: 2023-08-19 16:45:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
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
