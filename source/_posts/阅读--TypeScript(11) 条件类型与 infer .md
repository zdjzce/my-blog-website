---
title: 阅读--TypeScript(11) 条件类型与 infer
date: 2023-08-20 12:05:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
  - [TypeScript]
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

在 TS 中元组是特殊的值，infer ElementType 会提取出联合类型  string | number，而不是数组类型 [string, number]。

除了数组，infer 结构也可以是接口：
```ts
// 提取对象属性值类型
type PropType<T, K extends keyof T> = T extends { [Key in k]: infer R } ? R : never
type Prop1 = PropType<{ name: string }, 'name'> // string

// 反转键名与键值
type ReverseKeyValue<T extends Record<string, unknown>> = T extends Record<infer K, infer V> ? Record<V & string, K> : never
type ReverseKeyValueResult1 = ReverseKeyValue<{ "key": "value" }>; // { "value": "key" }
```

为了体现 infer 作为类型工具的属性，这里结合了索引类型与映射类型，以及使用 & string 来确保属性名为 string 类型。
如果不使用 & 而是:
```ts
// 类型“V”不满足约束“string | number | symbol”。
type ReverseKeyValue<T extends Record<string, string>> = T extends Record<
  infer K,
  infer V
>
  ? Record<V, K>
  : never;
```
将会报错，因为泛型参数 V 的来源是从键值类型推导出来的，TS 中这样对键值类型进行 infer 推导，会导致类型信息丢失，不满足索引 string | number | symbol 的要求。

至于映射类型的判断条件，需要同时满足两端的类型，使用 `V & string` 就能确保类型参数 V 一定会满足 `string | never`。


infer 结构还可以是 Promise 结构：
```ts
type PromiseValue<T> = T extends Promise<infer V> ? V : T;

type PromiseValueResult1 = PromiseValue<Promise<number>>; // number
type PromiseValueResult2 = PromiseValue<number>; // number，但并没有发生提取
```

infer 会经常出现在嵌套场景中，如果使用了嵌套的 Promise 类型：
```ts
type PromiseValueResult3 = PromiseValue<Promise<Promise<boolean>>>; // Promise<boolean>，只提取了一层
```

这个时候就需要进行嵌套提取：
```ts
type PromiseValue<T> = T extends Promise<infer V>
  ? V extends Promise<infer N>
    ? N
    : V
  : T;
```

最好的解决办法使用递归来处理任意嵌套深度：
```ts
type PromiseValue<T> = T extends Promise<infer V> ? PromiseValue<V> : T;
```

条件类型在泛型的基础上支持了基于类型信息的动态条件判断，但无法直接消费填充类型信息，而 infer 关键字则为它补上了这一部分的能力。


### 分布式条件类型
分布式条件类型听起来很高级，但其实它指的是**条件类型的分布式特性**，只不过是条件类型在满足一定情况下会执行的逻辑。
```ts
type Condition<T> = T extends 1 | 2 | 3 ? T : never

// 1 | 2 | 3
type Rest1 = Condition<1 | 2 | 3 | 4 | 5> 

// never
type Res2 = 1 | 2 | 3 | 4 | 5 extends 1 | 2 | 3 ? 1 | 2 | 3 | 4 | 5 : never;
```

在 Rest1 中，进行判断的联合类型被作为泛型参数传入另一个独立的类型别名，而 Rest2 中直接对这两者进行判断。他们两者的第一个差异就是：**是否通过泛型参数传入**

再看另一个例子:
```ts
type Naked<T> = T extends boolean ? "Y" : "N";
type Wrapped<T> = [T] extends [boolean] ? "Y" : "N";

// "N" | "Y"
type Res3 = Naked<number | boolean>;

// "N"
type Res4 = Wrapped<number | boolean>;
```

第二个好理解，元组中可能会是 number 不兼容 boolean 类型。但是例子一就显得很诡异，两个例子唯一的差异是条件类型中的泛型参数**是否被数组包裹**。
同时，在 Rest3 的判断中，其联合类型的两个分支，正好对应 number 和 boolean 去分别判断后的结果。

所以分布式条件类型起作用的条件，`类型参数需要是一个联合类型`。其次，`类型参数需要通过泛型传入`。最后，`条件类型中的泛型参数不能被包裹`。

所以分布式条件类型产生的效果就是：把联合类型拆开来每个分支分别进行判断，再将最后的结果组合起来。

官方解释为：对于属于裸类型参数的检查类型，条件类型会在实例化时期自动分发到联合类型上。（Conditional types in which the checked type is a naked type parameter are called distributive conditional types. Distributive conditional types are automatically distributed over union types during instantiation.）

所谓的自动分发可以理解为各个分支不同的判断最后再进行组合。而裸类型指的就是泛型参数没有被包裹。

如果不希望进行联合类型成员的分布判断，而是希望直接判断这两个联合类型的兼容性判断，就像在最初的 Res2 中那样：
```ts
type CompareUnion<T, U> = [T] extends [U] ? true : false;

type CompareRes1 = CompareUnion<1 | 2, 1 | 2 | 3>; // true
type CompareRes2 = CompareUnion<1 | 2, 1>; // false
```

 而最实用的场景是，求交集：
 ```ts
type Intersection<A, B> = A extends B ? A : never

type IntersectionRes = Intersection<1 | 2 | 3 | 4 | 5, 1 | 2 | 3>
 ```

 