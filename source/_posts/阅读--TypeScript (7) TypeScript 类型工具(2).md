---
title: 阅读--TypeScript(7) TypeScript 类型工具(2)
date: 2023-06-04 20:42:30
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---



### 类型查询操作符： typeof
JS 中的 typeof 运用于检查变量类型，TS 中的 typeof返回的是一个 TS 类型:
```ts
const str = "zdj";

const obj = { name: "zdj" }

const nullVar = null;
const undefinedVar = undefined;

const func = (input: string) => {
  return input.length > 10;
}

type Str = typeof str; // "zdj"
type Obj = typeof obj; // { name: string; }
type Null = typeof nullVar; // null
type Undefined = typeof undefined; // undefined
type Func = typeof func; // (input: string) => boolean

```

可以在类型标注中使用 typeof，也可以在工具类型中使用 typeof:
```ts
const func = (input: string) => {
  return input.length > 10;
}

// const func: (input: string) => boolean
const func2: typeof func = (name: string) => {
  return name === 'zdj'
}
```

如果需要一个函数的返回值类型，可以使用 ReturnType
```ts
type FuncReturnType = ReturnType<typeof func>
```
typeof 返回的类型就是推导后的类型，并且是最窄的推导程度。也不必担心混用 js 的 typeof，在逻辑中使用的 typeof 一定是 js 的。而类型代码中使用的一定是 TS 的。


### 类型守卫
TS 中提供了非常强大的类型推导能力，它会随着代码逻辑不断尝试收窄类型。这一能力称之为类型的控制流分析（类型推导）。
就好像有一条河流，它有很多支流，在一定条件下会流向不同的支流，类似于 if else
```ts
function foo (input: string | number) {
  if (typeof input === 'string') {}
  if (typeof input === 'number') {}
}

```

每流过一个 if 分支，后续联合类型的分支就少了一个，因为这个类型已经在分支处理过了，不会进入下一个分支：
```ts
declare const strOrNumOrBool: string | number | boolean;

if (typeof strOrNumOrBool === "string") {
  // 一定是字符串！
  strOrNumOrBool.charAt(1);
} else if (typeof strOrNumOrBool === "number") {
  // 一定是数字！
  strOrNumOrBool.toFixed();
} else if (typeof strOrNumOrBool === "boolean") {
  // 一定是布尔值！
  strOrNumOrBool === true;
} else {
  // 要是走到这里就说明有问题！
  const _exhaustiveCheck: never = strOrNumOrBool;
  throw new Error(`Unknown input type: ${_exhaustiveCheck}`);
}

```

但如果把类型判断抽离成函数，则会发现报错，这是因为函数在另一个地方，内部逻辑并不在函数 foo 中，这样的类型控制流分析做不到跨函数上下文来进行类型的信息收集。
```ts
function isString(input: unknown): boolean {
  return typeof input === "string";
}

function foo(input: string | number) {
  if (isString(input)) {
    // 类型“string | number”上不存在属性“replace”。
    (input).replace("zd", "zd")
  }
  if (typeof input === 'number') { }
  // ...
}
```

实际上，将判断逻辑封装起来很常见，TS 也引入了 **is** 关键字来显式提供类型信息：
```ts
function isString(input: unknown): input is string {
  return typeof input === "string";
}

function foo(input: string | number) {
  if (isString(input)) {
    // 类型“string | number”上不存在属性“replace”。
    (input).replace("zd", "zd")
  }
  if (typeof input === 'number') { }
  // ...
}
```
isString 函数称为类型守卫在它的返回值中，不再用 boolean 作为类型标注，而是使用 input is string。拆看来看是这样的：

- input函数的某个参数
- is string，即 is 关键字 + 预期类型。如果这个函数返回 true，那么 is 关键字前入参的类型，就会被后续的类型控制流分析收集到。

类型守卫有些类似于类型断言，但类型守卫更宽容，你指定什么类型，就是什么类型。还可以在类型守卫中使用对象类型，联合类型，以下是常用的类型守卫：
```ts
export type Falsy = false | "" | 0 | null | undefined;

export const isFalsy = (val: unknown): val is Falsy => !val;

// 不包括不常用的 symbol 和 bigint
export type Primitive = string | number | boolean | undefined;

export const isPrimitive = (val: unknown): val is Primitive => ['string', 'number', 'boolean' , 'undefined'].includes(typeof val);
```

### 基于 in 与 instanceof 的类型保护
in 操作符在 JS 中已经存在，可以通过 `key in object` 判断这个 key 是否存在于 object 或原型链上。

既然能起到区分作用，那么 TS 中自然也可以用来保护类型：
```ts
interface Foo {
  foo: string
  fooOnly: boolean
}

interface Bar {
  bar: string
  barOnly: boolean
}

function handle(val: Foo | Bar) {
  if ('foo' in Foo) {
    val.fooOnly
  } else {
    val.barOnly
  }
}

```

在这里使用了 foo 和 bar 区分 input 联合类型，然后就可以在对应的分支代码块中正确访问到他们之一的独有类型。但是如果以共有的类型(值也一样的情况)来判断，那么分支里将会是初始的联合类型。

当 A 类型和 B 类型中包含同一个属性，但他们的值不同，依然可以进行独立判断，这可以称为**可辨识属性**:

```ts
interface Foo {
  name: 'foo'
  foo: string
  fooOnly: boolean
}

interface Bar {
  name: 'bar'
  bar: string
  barOnly: boolean
}

function handle(val: Foo | Bar) {
  if (val.name == 'foo') {
    val.fooOnly
  } else {
    val.barOnly
  }
}

```

除此之外， JS 中还存在一个功能类似于 typeof  与 in 的操作符：**instanceof**, 它判断的是原型级别的关系，如 `foo instanceof Base` 会沿着 foo 的原型链查找 Base.prototype 是否存在其上，也可以简单认为这是判断 foo 是否是 Base 基类的实例。同样的，instanceof 在 TS 中也可以用来进行类型保护：
```ts
class FooBase {}
class BarBase {}

class Foo extends FooBase {
  fooOnly()
}

class Bar extends BarBase {
  barOnly()
}

function handle(val: Foo | Bar) {
  if (val instanceof FooBase) {
    val.fooOnly()
  } else {
    val.barOnly()
  }
}
```

除了使用 is 关键字的类型守卫外，还有 asserts 关键字的类型断言守卫。

### 类型断言守卫
如果写过测试用例或者使用过 NodeJs 的 asserts 模块，那么应该不陌生：
```ts
import assert from 'assert'

let name: any = 'zdj'

assert(typeof name === 'number')

// number 类型
name.toFixed()
```
上面的代码在运行时会抛出一段错误，因为 assert 接受到的表达式结果为 false。类似于类型守卫的场景：如果断言不成立，比如这里的值类型不为 number，那么在断言下方的代码就执行不到。如果断言通过了，不管最开始是什么类型，断言后的代码中就**一定符合断言的类型**。这里如果断言通过，那么接下来就将是 number。

但**断言类型和类型守卫最大的不同在于**，在判断条件不通过时，断言守卫需要抛出一个错误，类型守卫只需要剔除预期的类型，断言守卫并不会始终抛出错误，所以它的返回值类型并不能简单地使用 never 类型。为此，TS3.7 版本加入了 asserts 关键字来进行断言场景下的类型守卫，比如 assert 方法的签名可以是这样的：
```ts
function assert(condition: any, msg?: string): assert condition {
  if (!condition) throw new Error(msg)
}
```
这里用的是 assert condition，而 condition 来自于实例逻辑，这也意味着将 condition 这一逻辑层面的代码，作为了类型层面的判断依据，相当于在返回值类型中使用了一个逻辑表达式进行了类型标注。

举例来说，对于 `assert(typeof name === 'number')` 这么一个断言，如果函数成功返回，就说明后续代码中的 condition 都成立，也就是 name 神奇的变成了 number。

这里的 condition 甚至可以结合使用 is 关键字来提供进一步的类型守卫能力：
```ts
let name: any = 'zdj'

function assertIsNumber(val: any): asserts val is number {
  if (typeof val != 'number') {
    throw new Error('Not a Number')
  }
}

assertIsNumber(name)

name.toFixed()

```
这种情况下，无需再为断言守卫传入一个表达式，而是可以将这个判断用的表达式放进断言守卫的内部，来获得更独立地代码逻辑。


### 总结
学习到了新的类型工具，包括操作符 keyof、typeof，属于类型语法的交叉类型、索引类型（的三个部分）、映射类型、类型守卫等等。
在类型守卫方面，通过 is 关键字来断言某个函数的返回值，让其能够在分支切换中正确推导。使用类型保护类型守卫来进行类型控制流的分析
纠正等。同时，也了解到了可辨识属性（不同的类型中独一的属性）而他们组合起来就是可辨识联合类型。


### 接口合并
在 interface 中接口还能够使用继承进行合并，在继承子接口可以声明同名属性，但不能够覆盖父接口属性。**子接口中需要兼容付接口中的属性**:

```ts
interface Struct1 {
  primitiveProp: string;
  objectProp: {
    name: string;
  };
  unionProp: string | number;
}

// 接口“Struct2”错误扩展接口“Struct1”。
interface Struct2 extends Struct1 {
  // “primitiveProp”的类型不兼容。不能将类型“number”分配给类型“string”。
  primitiveProp: number;
  // 属性“objectProp”的类型不兼容。
  objectProp: {
    age: number;
  };
  // 属性“unionProp”的类型不兼容。
  // 不能将类型“boolean”分配给类型“string | number”。
  unionProp: boolean;
}
```

类似的。如果直接声明多个同名接口，虽然接口会合并，但这些同名属性的类型仍然需要兼容。
```ts
interface Struct1 {
  primitiveProp: string
}

interface Struct1 {
  // 后续属性声明必须属于同一类型。
  // 属性“primitiveProp”的类型必须为“string”，但此处却为类型“number”。
  primitiveProp: number
}
```

如果是接口和类型别名之间的合并呢？如接口继承类型别名，类型别名使用交叉类型合并接口。
```ts
type Base = {
  name: string;
};

interface IDerived extends Base {
  // 报错！就像继承接口一样需要类型兼容
  name: number;
  age: number;
}

interface IBase {
  name: string;
}

// 合并后的 name 同样是 never 类型
type Derived = IBase & {
  name: number;
};
```