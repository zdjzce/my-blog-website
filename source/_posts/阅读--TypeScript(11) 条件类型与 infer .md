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
function universalAdd<T extends number | bigint | string>(x: T, y: T): LiteralToPrimitive<T> {
  return x + (y as any)
}

type LiteralToPrimitive<T> = T extends number ? number : T extends bigint ? bigint : T extends string ? string : never

```

条件类型还可以用来对更复杂的类型进行比较，比如函数类型：
```ts
type Func = (...args: any[]) => any
type FunctionConditionType<T extends Func> = T extends () => string ? 'string return func' : 'not string return func'

type StringReturnType = FunctionConditionType<() => string>
type NotStringReturnType = FunctionConditionType<() => number>
```

在这里，先创造了一个基本的函数类型它的入参和返回值都是any，这也就意味着所有函数都可以继承于它。接着对泛型的继承进行了判断，如果返回值是 string 的函数那么则直接返回字面量 'string return func' 否则返回 'not string return func'。


### **infer** 关键字
如果进行条件判断时不是为了去查看是否是子类型，而是要**拿到它的返回值**，TS 中支持通过 infer 关键字在条件类型中**提取类型的某一部分信息**。比如要提取函数返回值类型：
```ts
type FunctionReturnType<T extends Func> = T extends (...args: any) => infer R ? R : never
```
infer 意为推断。而 R 就是待推断的类型。
很好理解，很像 any，在传入泛型时，它会自行进行推导，无论传入什么函数类型，`infer R` 都会被填充为传入的函数返回值，但如果不是函数类型那么就返回一个 never。

并且 infer 并不局限于函数类型结构的推断，还可以是数组：
```ts
type Reverse<T extends any[]> = T extends [infer A, infer B] ? [B, A] : T

type Reverse1 = Reverse<[1, 2]> // [2, 1]
type Reverse2 = Reverse<[2, 1]> // [1, 2]
type Reverse2 = Reverse<[2, 1, 0]> // [2, 1, 0]
```
可以看到 infer 填入数组中进行推断然后将 A 和 B 进行互换。

上面的例子中仅仅填充了元组，如果需要任意长度的数组就需要和 rest 操作符进行配合使用：
```ts
// 提取首尾
type ExtractStartAndEnd<T extends any[]> = T extends [infer start, ...any[], infer end] ? [end, start] : T
type ExtractArray = ExtractStartAndEnd<[1, 2, 3, 4]> // [4, 1]

// 调换首尾
type SwapStartAndEnd<T extends (number | string)[]> = T extends [infer start, ...infer center, infer end] ? [end, ...center, start ] : T
type SwapHeadEnd = SwapStartAndEnd<[1, 2, 3]> // [3, 2, 1]

// 调换开头两个
type SwapFirstTwo<T extends (number | string)[]> = T extends [infer start, ...infer center, infer end] ? [start, end, ...center] : T
type SwapFirstTwoInstance = SwapFirstTwo<[1, 2, 3, 4]> // [1, 4, 2, 3]
```

infer 甚至可以和 rest 操作符一起同时提取一组不定长的类型，或者也可以使用 `...any[]`，上方的输出都是数组，但完全可以进行结构层面的转换，比如从数组到联合类型：
```ts
type ArrayItemType<T> = T extends Array<infer ElementType> ? ElementType : never

type ArrayItem1 = ArrayItemType<[string]> // string
type ArrayItem2 = ArrayItemType<[]> // never
type ArrayItem3 = ArrayItemType<[string, number]>  // string | number
```

