---
title: 阅读--TypeScript(6) TypeScript 类型工具(1)
date: 2023-06-04 17:02:30
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---


### 类型别名
类型别名是 TS 最重要的一个功能，从一个简单的函数类型别名，到类型体操，都离不开类型别名
`type A = string`


通过 type 关键字声明一个类型别名 A，同时它的类型等价于 string 类型，类型别名的作用主要是对一组类型或一个特定类型结构进行封装。
比如抽离一组联合类型：
```ts
type StatusCode = 200 | 301 | 400 | 500 | 502;
type PossibleDataTypes = string | number | (() => unknown);

const status: StatusCode = 502;
```

抽离一个函数类型：
```ts
type Handle = (e: Event) => void

const clickHandle:Handler = e => {}

```

声明一个对象类型就像 interface 那样：
```ts
type ObjType = {
  name: string;
  age: number;
}
```

接收泛型的工具类型：
```ts
type MaybeArray<T> = T | T[];

// 函数泛型我们会在后面了解~
function ensureArray<T>(input: MaybeArray<T>): T[] {
  return Array.isArray(input) ? input : [input];
}
```

### 联合类型与交叉类型
联合类型的符号是 `|`，代表了按位或，即只需要符合联合类型中的一个类型，就可以认为实现了这个联合类型。
而代表着按位与的 `&` 则不同，需要符合这里的所有类型，才可以说实现了这个交叉类型，即 `a&b`，需要同时满足 A 与 B 两个类型才行。
```ts
interface NameStruct {
  name: string
}

interface AgeStruct {
  age: number
}

type Profile = NameStruct & AgeStruct

const profileObj: Profile = {
  name: '123',
  age: 22
}
```
这里是基于对象类型的合并，同时包含了了两个接口。那对于原始类型呢？

```ts
type StrAndSum = string & number; // nerver
```
可以看到，变成了 never ，交叉类型新的类型会同时符合交叉类型的所有成员，回顾例子，根本没有既是 string 又是 number的类型，所以这也是 never 存在的原因，**描述根本不存在的类型**。

对于对象类型的交叉类型，内部的同名属性类型同样会按照交叉类型进行合并：
```ts
type Struc1 = {
  prop: string,
  ObjectProp: {
    name: string
  }
}

type Struc2 = {
  prop: number,
  ObjectProp: {
    age: number
  }
}

type Struc3 = Struc1 & Struc2

type Prop = Struc3['prop'] // never
type ObjectProp = Struc3['ObjectProp'] // {name: string, age: number }

```
交叉类型和联合类型的区别就是，联合类型只需要符合成员之一即可（||），而交叉类型需要严格符合每一位成员（&&）

### 索引类型
索引类型主要值得是在接口或者类型别名，通过**语法快速声明一个键值类型一致的类型结构**：
```ts
interface Types1 {
  [key: string]: string
}

type Types2 = {
  [key: string]: string
}

type PropType1 = Types1['test'] // string
type PropType1 = Types2['test2'] // string
```
这个例子中声明的键类型为 string，也就是说以这个接口实现的变量的键只能是字符串类型。
但由于 JS 中，**使用数字索引访问会转换为字符串索引访问**，也就是说 `obj[11]` 和 `obj['11']` 的效果是一致的，因此在字符串索引中仍然可以声明数字类型的键，symbol 类型也是如此:
```ts
const foo: Types1 = {
  'zdj': 'zzz',
  222: 'zxc',
  [Symbol('ddd')]: 'symbol'
}
```

索引签名类型可以和具体的键值对声明并存，但具体的键值类型也需要符合索引类型：
```ts
interface AllStringTypes {
  // 类型“number”的属性“propA”不能赋给“string”索引类型“boolean”。
  propA: number;
  [key: string]: boolean;
}
```

### 索引类型查询
索引类型查询也就是 `keyof` 操作符，严谨的说它可以将对象中的所有键转换为`字面量`类型，然后再组合成联合类型。**但数字类型的键名并不会转换为字符串类型字面量，仍然会保持数字类型**。

```ts
interface Foo {
  zdj: 1,
  123: 2
}

type Foo2 = keyof Foo // 'zdj' | 123
// 在 vscode 中只能看到 keyof Foo
// 可以这么做
type FooKeys = keyof Foo & {}
```


### 索引类型访问
在 JS 中可以通过 `obj[expression]` 的方式动态访问一个对象属性（即计算属性），expression 表达式会先被执行，然后使用返回值访问属性。在 TS 中可以通过类似的方式：
```ts
interface NumberRecord {
  [key: string]: number
}

type PropType = NumberRecord[string] // number
```

```ts
interface Foo {
  propA: number;
  propB: boolean;
}

type PropAType = Foo['propA']; // number
type PropBType = Foo['propB']; // boolean
```

看起来这里就是普通的值访问，但实际上这里的'propA'和'propB'都是字符串字面量类型，而不是一个 JavaScript 字符串值。索引类型查询的本质其实就是，通过键的字面量类型（'propA'）访问这个键对应的键值类型（number）。

那么如果想要拿到一个类型的所有索引类型，并且返回他们的值类型，该怎么做呢
```ts
interface Foo {
  propA: number;
  propB: boolean;
}
type PropTypeUnion = Foo[keyof Foo]  // number | boolean
```
使用字面量类型进行索引类型访问，结果就是拿到每个分支对应的类型最后变成联合类型。

在未声明索引类型签名是不可以使用 typeA[string] 这种原始类型的访问方式，只能通过字面量类型来访问。


### 映射类型
映射类型是一个确切的类型工具，类似于JS 中的 map 方法，映射类型的主要作用是**基于键名映射到键值类型**

```ts
type Stringfy<T> = {
  [K in keyof T]: string
}
```

这个工具会接受一个类型，假定是对象类型，使用 keyof 拿到这个对象类型的键名组成的联合类型，然后通过映射类型（in 关键字）将这个联合类型的每个成员映射出来，设置为 string。

```ts
interface Foo {
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: () => void;
}

type StringifiedFoo = Stringify<Foo>;

// 等价于
interface StringifiedFoo {
  prop1: string;
  prop2: string;
  prop3: string;
  prop4: string;
}
```

既然拿到了键，那键值类型也能拿到：
```ts
interface Clone<T> {
  [K in keyof T]: T[K]
}
```

这里的T[K]其实就是上面说到的索引类型访问，使用键的字面量类型访问到了键值的类型，这里就相当于克隆了一个接口。需要注意的是，这里其实只有K in 属于映射类型的语法，keyof T 属于 keyof 操作符，[K in keyof T]的[]属于索引签名类型，T[K]属于索引类型访问。

| 类型工具 |  创建新类型的方式   | 常见搭配 |
| -----   |     ----            | ----   

		
|类型别名（Type Alias）| 将一组类型/类型结构封装，作为一个新的类型|	联合类型、映射类型 |
|工具类型（Tool Type）|	在类型别名的基础上，基于泛型去动态创建新类型 |	基本所有类型工具 |
联合类型（Union Type）|	创建一组类型集合，满足其中一个类型即满足这个联合类型（||） |	类型别名、工具类型 |
交叉类型（Intersection Type）|	创建一组类型集合，满足其中所有类型才满足映射联合类型（&&）	| 类型别名、工具类型 | 
索引签名类型（Index Signature Type）|	声明一个拥有任意属性，键值类型一致的接口结构 |	映射类型 |
索引类型查询（Indexed Type Query） | 	从一个接口结构，创建一个由其键名字符串字面量组成的 | 联合类型	映射类型 | 
索引类型访问（Indexed Access Type）| 	从一个接口结构，使用键名字符串字面量访问到对应的键值类型 | 	类型别名、映射类型 |
映射类型 （Mapping Type）|	从一个联合类型依次映射到其内部的每一个类型 | 	工具类型 |