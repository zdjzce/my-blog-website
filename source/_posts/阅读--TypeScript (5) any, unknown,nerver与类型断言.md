---
title: 阅读--TypeScript(5) any, unknown, never
date: 2023-05-21 19:02:30
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
  - [TypeScript]
---

### 内置类型：any 、unknown 与 never

#### any
在 TS 中，可以用 any 来表示任意类型，除了显式标记，TS 也会将变量/参数隐式推导为 any。比如使用 let 声明一个变量但不提供初始值，以及不为函数参数提供类型标注：
```ts
// any
let foo;

// foo、bar 均为 any
function func(foo, bar){}
```

any 的本质是类型系统中的顶级类型，即 Top Type。它能兼容所有类型，也能被所有类型兼容。
any 也是 TS 经常被诟病的原因之一，在很多场景如果我们要使用 any 可以多考虑考虑：
1. 类型不兼容时可以考虑使用类型断言。
2. 类型太复杂可以去断言为最简类型。如你需要调用 foo.bar.baz()，就可以先将 foo 断言为一个具有 bar 方法的类型。
3. 如果想表达未知类型，最合理的是使用 unknown。

#### unknown
unknown 和 any 有些类似。可以将类型为 unknown 的变量赋值为任意类型。但 unknown 类型的值不能赋值给 any 和 unknown 类型以外的其他类型。

```ts
let testUnknown: unknown = 'test'

testUnknown = 123
testUnknown = {}
testUnknown = 'zxc'

const testStr: string = testUnknown  // Error
const testNum: number = testUnknown  // Error
const testObj: {} = testUnknown  // Error
```

unknown 和 any 的差异主要体现在赋值给其他变量，any 很万金油所有类型都能够包容它，但 unknown 坚信自己以后会有一个确切的类型，是有类型检查的。这一点也体现在对 unknown 类型的变量进行属性访问时：
```ts
let unknownVar: unknown;

unknownVar.foo(); // 报错：对象类型为 unknown
```

要对 unknown 进行属性访问，需要进行类型断言：
```ts
(unknownVar as { foo: () => {} }).foo()
```
在类型未知的情况下，更推荐使用 unknown 标注。相当于你使用额外的心智负担保证了类型在各处的结构，同时还维持了类型检查的存在。

如果说 any, unknown 是比原始类型更上层的存在，就好比字符串类型 string 比字面量类型 'zzz' 更上层的存在一样。**即 any/unknown -> 原始类型、对象类型 -> 字面量类型**。那么，是否存在比字面量类型更底层一些的类型？

any 能够描述任意类型，字符串类型能够描述字符串和任意的字符串字面量，而字面量类型只表示一个精确的值类型。如要还要更底层，也就是再少一些类型信息，**那就只能什么都没有了**。

而内置类型 never 就是这么一个“什么都没有”的类型。此前另一个“什么都没有”的类型，void。但相比于 void ，never 还要更加空白一些。

#### 虚无的 never
```ts
type UnionWithNever = "xxx" | 52 | true | void | never;
```
将鼠标移到类型上，会发现此时类型为 `'xxx' | 52 | true | void`，never 被无视掉了，而 void 仍然存在，void 是有类型但它是'没有返回值'的类型。而 never 是真的什么都没有。

never 类型不携带任何类型信息，因此会在联合类型中被擦除。
```ts
declare let v1: never;
declare let v2: void;

v1 = v2; // X 类型 void 不能赋值给类型 never
```

在类型系统中，never 被称为 **Bottom Type**。是 TS 中最底层的类型。和 null, undefined一样，它是所有类型的子类型。但只有 never 类型的变量能够赋值给另一个 never 类型变量。

never 主要用于类型检查，比如要抛出一个错误：
```ts
function justThrow(): never {
  throw new Error()
}
```

如果一个函数的返回值类型为 never 那么它下方的代码都会被视为无效代码不执行：
```ts
function testA() {
  justThrow()
  console.log('123') // 不会执行 因为上面执行完后，已经无效
}
```

也可以显式利用它来进行类型检查，即上面在联合类型中 never 类型神秘消失的原因。假设，需要对一个联合类型的每个类型分支进行不同处理：
```ts
declare const strOrNumOrBool: string | number | boolean;

if (typeof strOrNumOrBool === "string") {
  console.log("str!");
} else if (typeof strOrNumOrBool === "number") {
  console.log("num!");
} else if (typeof strOrNumOrBool === "boolean") {
  console.log("bool!");
} else {
  throw new Error(`Unknown input type: ${strOrNumOrBool}`);
}
```

如果希望这个变量的每一种类型都需要得到妥善处理，在最后可以抛出一个错误，但这是运行时才会生效的措施，是否能在类型检查时就分析出来？
实际上，TS 很强大，在经过每一个 if，TS 的分支就会减少一个，直到最后类型收缩到 never。即一个无法再细分、本质上并不存在的虚空类型。可以利用只有 never 类型能赋值给 never 类型这一点，来巧妙地分支处理检查：
```ts
function testFun(strOrNumOrBool: string | number | boolean) {
  if (typeof strOrNumOrBool === "string") {
    // 一定是字符串！
    strOrNumOrBool.charAt(1);
  } else if (typeof strOrNumOrBool === "number") {
    strOrNumOrBool.toFixed();
  } else if (typeof strOrNumOrBool === "boolean") {
    strOrNumOrBool === true;
  } else {
    const _exhaustiveCheck: never = strOrNumOrBool;
    throw new Error(`Unknown input type: ${_exhaustiveCheck}`);
  }
}
```

假设现在新增了一个函数类型，但却没有在代码中新增分支，就会在 else 语句块中出现函数类型不能赋值给 never 类型，来提示错误，确保每个分支都能够被妥善处理。

never 时常还会不请自来，例如常常会遇到这样的错误：
```ts
const arr = [];

arr.push("xxx"); // 类型“string”的参数不能赋给类型“never”的参数。

```

此时这个未标明类型的数组被推导为了 `never[]` 类型，这种情况仅会在你启用了 `strictNullChecks` 配置，同时禁用了 `noImplicitAny` 配置时才会出现。解决的办法也很简单，为这个数组声明一个具体类型即可。


### 类型断言
类型断言能够显式告知类型检查程序当前变量的类型。它其实就是将变量的已有类型更改为新指定类型的操作。基本语法就是 `as NewType`

例如可以将 any unknown 断言到一个具体的类型：
```ts
let unknownV: unknown

(unknownV as { foo: () => {} }).foo()

```

也可以在**联合类型中断言**一个具体的分支:
```ts
function foo(union: string | number) {
  if ((union as string).includes('zd')) {}

  if ((union as number).toFixed() === '500') {}
}

```

什么时候该使用类型断言，就是 TS 分析不正确或者不符合预期时将其断言为此处的正确类型。除了使用 as ，也可以使用 `<>` 来类型断言，不过在 tsx 中并不能很好的被分析出来。

#### 双重断言
```ts
const str: string = '123';

// 类型 "string" 到类型 "{ handler: () => {}; }" 的转换可能是错误的，因为两种类型不能充分重叠。
(str as {handler: () => {} }).handler()
```
此时会提醒类型转换错误，可以先断言到 unknown 类型，再断言到预期类型：
```ts
const str: string = 'zdj';

(str as unknown as { handler: () => {} }).handler()

// 使用尖括号断言
(< {handler: () => {} }>(<unknown>str)).handler()
```

#### 非空断言
非空断言其实是类型断言的简化，使用了 `!` 语法，即 `obj!.func()!.prop` 的形式标记前面的一个声明一定是非空的（其实就是剔除了 null 和 undefined）

```ts
const foo = {
  func?: () => ({
    prop?: number | null
  })
}

foo.func().prop.toFixed()

```

此时 func 在 foo 不一定存在，prop 在 func 调用不一定存在，就会受到两个类型报错。要解决就是非空断言。
`foo.func!().prop!.toFixed()`

其应用位置类似可选链：
```ts
foo.func?.().prop?.toFixed()
```

但不同的是，非空断言运行时会保持调用链，因此在运行时可能会报错，但可选链在一部分收到 undefined 或者 null 就会短路。不会再发生调用。


