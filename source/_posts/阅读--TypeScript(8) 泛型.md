---
title: 阅读--TypeScript(8) 泛型
date: 2023-06-18 15:01:12
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---

### 类型别名中的泛型

类型别名声明了泛型坑位，其实就是等价于一个接收参数的函数：
```ts
type Factory<T> = T | number | string
```

类型别名的泛型多用来进行工具类型的封装，比如映射类型中的工具类型：
```ts
type Stringify<T> = {
  [k in typeof T]: string
}

type Clone<T> = {
  [k in typeof T]: T[k]
}
```
Stringify 会将一个对象类型的所有属性设置为 string，而 Clone 则会进行类型的完全复制。

TS 的内置工具类型 Partial:
```ts
type Partial<T> = {
  [P in keyof T]?: T[P]
}
```
Partial 会将传入的对象类型复制一份，并且会将所有属性变成可选。

类型别名与泛型的结合除了映射、索引类型外，还有一个条件类型：
```ts
type IsEqual<T> = T extends true ? 1 : 2

type A = IsEqual<true>; // 1
type B = IsEqual<false>; // 2
type C = IsEqual<'111'>; // 2
```

在条件类型参与的情况，通常泛型会被作为条件类型的判断条件 **(`T extends Condition` 或者 `Type Extends T`)** 以及返回值。


### 泛型约束与默认值
函数可以声明一个参数的默认值，泛型同样有着默认值的设定：
```ts
type Factory<T = boolean> = T | number

// 调用时可以不带任何参数
const foo:Factory = false
```

除了声明默认值，泛型还可以做到函数参数做不到的事：**泛型约束**，可以要求**传入**工具类型**的泛型**必须符合某条件，否则拒绝执行逻辑。如果是函数只能在逻辑中处理：
```ts
function add(source: number, add: number){
  if(typeof source !== 'number' || typeof add !== 'number'){
    throw new Error("Invalid arguments!")
  }
  
  return source + add;
}
```

在泛型中，可以使用 `extends` 关键字约束传入的泛型必须符合要求。 `A extends B` 意味 A 是 B 的子类型

```ts
type ResStatus<ResCode extends number> = ResCode extends 200 | 250 ? 'success' : 'failure'
```
在这个类型中将 ResCode 约束为 number，传入 200 或 250 将会返回 success，如果传入的不是 number 则会类型错误。
```ts

type Success = ResStatus<200> // success
type Res2 = ResStatus<'x'> // 类型 string 不满足约束 'number'

```
也可以让此类型无需显式传入就能调用，并且默认状态为成功，可以添加一个默认值:
```ts
type ResStatus<ResCode extends number = 200> = ResCode extends 200 | 250 ? 'success' : 'failure'
```

### 多泛型关联
不仅可以传入多个泛型参数还可以让几个泛型之间也存在联系：
```ts
type Conditional<Type, Condition, Result, FalsyResult> = Type extends Condition ? Result : FalsyResult


type Res1 = Conditional<'zz', string, true, false> // true
type Res2 = Conditional<11, string, true, false> // false

```
多泛型参数其实就像接受更多参数的函数，内部运行逻辑会更加抽象，这表现在泛型参数需要进行的逻辑运算会更复杂。

前文所说**多个泛型之间的依赖**，其实是在后续泛型参数中，依赖了前面的泛型，作为约束或默认值。
```ts
type Process<Input, SecondInput extends Input = Input, ThirdInput extends SecondInput = SecondInput> = number
```

在这个类型中，第二个类型是第一个类型的子类型并且默认赋值为第一个类型，第三个类型同理。当只传入第一个类型时，第二第三个类型都会进行赋值。

### 对象类型的泛型
在接口中使用简单的响应泛型处理：
```ts
interface Res<T = unknown> {
  code: number
  data: T
}
```
然后就可以传入指定的响应类型：
```ts
interface UserRes {
  name: string
  age: number
}

function getUserInfo(): Promise<Res<UserREs>> {}
```


### 函数中的泛型
假设有这么一个函数，它在处理参数为字符串、数字、对象的情况下，对不同参数类型进行不同的返回。首先能够直接想到的就是联合类型：
```ts

function handler(input: string | number | {}): string | number | {} {}

handler('123')
handler(123)
handler({})
```

但如果直接调用会发现返回值并没有和入参关联起来。函数的返回值依然是联合类型。此时又可以想到用函数重载：
```ts

function handler(input: string): string
function handler(input: number): number
function handler(input: {}): {}
function handler(input: string | number | {}): string | number | {} {}

```

但是这样写也太麻烦了。不如直接用泛型：
```ts
function handler<T>(input: T): T { return input }
```
这里声明了一个参数为泛型，并将参数的类型与返回值类型指向这个泛型，这样函数接受到参数 T 会自动被填充为这个参数的类型，做到了返回值与参数类型的关联。

在基于参数填充泛型时，类型信息会被推导至尽可能精确的程度，在传入一个值时这个值时不会再被修改的，如果使用一个变量作为参数，那么只会使用**变量的标注类型**，如果没有标注则会使用推导出的类型。

```ts
function handle<T>(input: T): T {}

const author = "123"; // 被推导为 "123"

let authorAge = 18; // 使用 let 声明，被推导为 number

handle(author); // 填充为字面量类型 "123"
handle(authorAge); // 填充为基础类型 number
```

再看一个传入多个泛型的函数：
```ts

function handler<T, U>( [ start, end ]: [ U, T ] ): [ U, T ] { return [ end, start ] }

```

函数中的泛型同样存在约束与默认值：
```ts

function handler<T extends string | number = string>(input: T): T { return input }

```

现在假设有一个函数接受两个参数：第一个参数为对象，第二个参数为字符串数组，函数的返回值会从对象中找到第二个参数包含的所有属性并且组合起来。

```ts
const object = { 'a': 1, 'b': '2', 'c': 3 };

pick(object, ['a', 'c']); // { a: 1, c: 3 }

type Picks<T> = {
  [k in keyof T]: T[k]
}

type Obj = Record<string, string>
function pick<T extends Obj, U extends [keyof T]>(obj: T, keys: U): Picks<T> {
  const find = {} as Picks<T>

  keys.forEach(key => find[key] = obj[key])

  return find

}
```

在这里约束了 T 为键值为字符串的 Obj 类型，U 为 [keyof T]的类型（即必须为 T 的键组成的数组），接着返回 Picks 类型。

函数的泛型也会被内部的逻辑消费，对于箭头函数的泛型书写方式是：
```ts
type Handle = <T>(input: T): T => {}
```


### Class 中的泛型
Class 中的泛型坑位可以被方法、属性、装饰器等消费。Class 内的方法还可以再声明自己的泛型参数:
```ts
class Queue<TElementType> {
  private _list: TElementType[];

  constructor(initial: TElementType[]) {
    this._list = initial;
  }

  // 入队一个队列泛型子类型的元素
  enqueue<TType extends TElementType>(ele: TType): TElementType[] {
    this._list.push(ele);
    return this._list;
  }

  // 入队一个任意类型元素（无需为队列泛型子类型）
  enqueueWithUnknownType<TType>(element: TType): (TElementType | TType)[] {
    return [...this._list, element];
  }

  // 出队
  dequeue(): TElementType[] {
    this._list.shift();
    return this._list;
  }
}
```