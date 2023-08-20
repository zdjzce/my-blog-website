---
title: 阅读--TypeScript(11) 条件类型与 infer
date: 2023-08-20 12:05:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---

 ### 条件类型
 条件类型的语法类似于三元表达式：
 ```ts
 TypeA extends TypeB ? Result1 : Result2
 ```
需要注意的是，条件类型中用 extends 判断类型的兼容性，而不是判断类型的全等性。

在很多场景下条件类型都与泛型一起出现：
```ts
type LiteralType<T> = T extends string ? string : number
```

```ts
function universalAdd<T extends number | bigint | string>(x: T, y: T) {
  return x + y
}

universalAdd(1, 2)
```
在上面的函数例子中，由于两个参数都引用了泛型 T，所以在传入参数 (1, 2) 时，泛型 T 被填充为 `1 | 2`。此时的返回值类型就需要从字面量联合类型推导出原本的基础类型。而 `1 | 2` 联合类型可以被认为是 number 的子类型(同一基础类型的联合类型是基础类型的子类型)。

所以在这个例子中，描述返回值的话，就可以从联合类型推断到基础类型的提取：
```ts
function universalAdd<T extends number | bigint | string>(x: T, y: T) {
  return x + y
}


type LiteralToPrimitive<T> = T extends number ? number : T extends bigint ? bigint : T extends string ? string : never

```