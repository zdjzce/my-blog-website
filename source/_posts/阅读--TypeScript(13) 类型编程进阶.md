---
title: 阅读--阅读--TypeScript(13) 类型编程进阶
date: 2023-10-28 14:36:12
tags:
  - 阅读
  - typescript
categories:
  - [阅读]
---

### 属性修饰
在很多工作场景下会用到工具类型，深层的属性修饰和已知属性的部分修饰等等。

比如我们想让对象属性全部变成可选并且下属的对象属性也变为可选，那么就可以编写下列这个类型：
```ts
type DeepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

```

首先获取传入泛型的所有 `key` 进行可选的标记, 接着判断值是否是 `object` 类型，是的话递归调用，否则返回值本身的类型。

类似的，还可以实现其他的递归属性调用: 
```ts
// 全部必选
type DeepRequired<T extends object> = {
  [K in keyof T]-?: T[K] extends object ? PropsAsRequired<T[K]> : T[K]
}

// 全部只读
export type DeepReadonly<T extends object> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 去掉只读
export type DeepMutable<T extends object> = {
  -readonly [K in keyof T]: T[K] extends object ? DeepMutable<T[K]> : T[K];
};

```

另外，在内置类型中存在一个能从联合类型中去除 `null | undefined` 的工具类型：

```ts
type NonNullable<T> = T extends null | undefined ? never : T
```

在声明类型时常常会用到 `string | null` 类型，代表这里有值但可能是空值，我们也可以将它进行递归处理去除所有的 null 与 undefined 子类型：
```ts
export type DeepNonNullable<T extends object> = {
  [K in keyof T]: T[K] extends object
    ? DeepNonNullable<T[K]>
    : NonNullable<T[K]>;
};
```

> DeepNonNullable 在项目中需要开启 --strictNullChecks 再回正常工作

那么，如果有这么个场景该怎么写类型呢：一个对象我需要把三个属性当做可选，其他的为必选。
如果按照思路将步骤拆分的话：
1. 拆分结构，将属性弄出来
2. 进行可选处理，属性修饰
3. 与必选合并，组合两个对象的类型，意味着得到同时符合两个类型的结构。

```ts
type MarkPropsAsOptional<T extends object, K extends keyof T = keyof T> = Partial<Pick<T, K>> & Omit<T, K>
```
在这里给传入的 K 泛型默认为 T 的所有键集合，不传值时就可以全部变成可选。接着使用 Pick 将指定键挑选出来并且变为可选，最后与排除键集合的对象进行交叉。就能够得到类型。

可以引入一个工具类型 `Flatten` 将它展平为单层的对象结构，方便查看结果：
```ts
export type Flatten<T> = { [K in keyof T]: T[K] };

type MarkPropsAsOptional<T extends object, K extends keyof T = keyof T> = Partial<Pick<T, K>> & Omit<T, K>


type Test2 = {
  a: string,
  b: string,
  c: string
}

const PicksKey = ['a', 'b'] as const

type TestMarkOptional = Flatten<MarkPropsAsOptional<Test2, typeof PicksKey[number]>>

```

移动到 `TestMarkOptional` 上可以发现类型显示为：
```ts
type testMarkOptional = {
   a?: string | undefined;
   b?: string | undefined;
   c: string;
}
```


与工具类型进行类型部分修饰：
```ts
export type MarkPropsAsRequired<
  T extends object,
  K extends keyof T = keyof T
> = Flatten<Omit<T, K> & Required<Pick<T, K>>>;

export type MarkPropsAsReadonly<
  T extends object,
  K extends keyof T = keyof T
> = Flatten<Omit<T, K> & Readonly<Pick<T, K>>>;

export type MarkPropsAsMutable<
  T extends object,
  K extends keyof T = keyof T
> = Flatten<Omit<T, K> & Mutable<Pick<T, K>>>;

export type MarkPropsAsNullable<
  T extends object,
  K extends keyof T = keyof T
> = Flatten<Omit<T, K> & Nullable<Pick<T, K>>>;

export type MarkPropsAsNonNullable<
  T extends object,
  K extends keyof T = keyof T
> = Flatten<Omit<T, K> & NonNullable<Pick<T, K>>>;
```

这样的工具类型实现起来也不麻烦，只要明确 **拆分-处理-合并** 的思路再基于内置的一些工具类型进行处理，不过这都是基于键名的裁剪，基于**键值类型去裁剪结构也是很重要的**


### 结构工具类型
对于结构工具类型主要有两个：
1. 基于键值类型的 Pick 与 Omit
2. 子结构的互斥处理

假设现在需要根据**值的类型选定对应的键名**，思路是不是应该是这样的：首先对值类型进行判断，如果符合要求那么返回对应的键名，不符合则返回 never。最后再从原始类型上对键名进行匹配就可以了。

```ts
type FunctionType = (...args: any[]) => any

type FunctionKeys<T extends object, FunctionType> = {
  [K in keyof T]-?: T[K] extends FunctionType ? K : never
}[keyof T]
```

可以看到与思路是一致的，先忽略 `[keyof T]` 如果将前面的结果进行测试会发现已经将期望的键都放到对象里面了：
```ts
// 注意这里把 keyof T 移除了
type FunctionKeys2<T extends object, FunctionType> = {
  [K in keyof T]-?: T[K] extends FunctionType ? K : never
}

type Res = FunctionKeys2<{
  foo: () => void,
  bar: (name: any) => string,
  test: string
}, FunctionType>

/* type Res = {
    foo: "foo";
    bar: "bar";
    test: never;
} */
```

如果在后方加入 `[keyof T]`, 也就是是 `Res[keyof T]` 拆解开可以得出:
```ts
type WhatWillWeGetEqual1 = Res["foo" | "bar" | "baz"];
type WhatWillWeGetEqual2 = Res["foo"] | Res["bar"] | Res["baz"];
type WhatWillWeGetEqual3 = "foo" | "bar" | never;
```
这就是 ts 中分布式类型的规则，将联合类型组合起来然后依次访问。

