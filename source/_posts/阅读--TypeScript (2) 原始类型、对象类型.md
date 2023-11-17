---
title: 阅读--TypeScript(2) 原始类型、对象类型
date: 2023-05-03 23:24:00
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
  - [TypeScript]
---

学习一件新事物的较好方式是和你已掌握的做对比，通过二者之间通用的概念帮你快速熟悉新的事物。比如，在掌握了 Vue 以后再去学习 React，对于组件通信、状态管理、插槽等这些二者共有的概念，会感到非常熟悉。
### 原始类型的类型标注
JS 的内置类型在 TS 中都有对应的类型注解：
```ts
const name: string = 'xxx';
const age: number = 24;
const male: boolean = false;
const undef: undefined = undefined;
const nul: null = null;
const obj: object = { name, age, male };
const bigintVar1: bigint = 9007199254740991n;
const bigintVar2: bigint = BigInt(9007199254740991);
const symbolVar: symbol = Symbol('unique');
```

#### null 与 undefined
在 TS 中 null 与 undefined 都代表有**具体意义的类型**，而不像 JS 中前者代表**有值但为空值**，后者代表**没有值**。这两者在没有开启 `strictNullChecks` 检查的情况下，会被视作其他类型的子类型，比如 string 类型会被认为包含了 null 与 undefined 类型：
```ts
const tmp1: null = null;
const tmp2: undefined = undefined;

const tmp3: string = null; // 仅在关闭 strictNullChecks 时成立，下同
const tmp4: string = undefined;
```

#### void

```js
<a href="javascript:void(0)">清除缓存</a>
```

这里的 `void(0)` 等价于 `void 0`，即 void expression 的语法。void 操作符会执行后面跟着的表达式并返回一个 undefined，如你可以使用它来执行一个立即执行函数（IIFE）：
```js
void function iife() {
  console.log("Invoked!");
}();
```

能这么做是因为，void 操作符强制将后面的函数声明转化为了表达式，因此整体其实相当于：`void((function iife(){})())`。

TS 中也有 void，不过表达的是函数没有返回值或者没有显式返回值：
```ts
function func1() {}
function func2() {
  return;
}
function func3() {
  return undefined;
}
```

func1 和 func2 都没有返回值，只有 func3 返回值推导成 undefined。但在实际代码执行，func1 和 func2 返回值都是 undefined。

func3 虽然显式返回了值，但仍然可以使用 void，原因就像前文说的，func1 和 func2 实际上也返回 undefined。null 类型也可以，但需要在关闭 strictNullChecks 配置的情况下才能成立。
```ts
const voidVar1: void = undefined;

const voidVar2: void = null; // 需要关闭 strictNullChecks
```

### 数组的类型标注

```ts
const arr1: string[] = [];

const arr2: Array<string> = [];
```
这两种数组声明完全是等价的，通常来说第一种用的多。

在某些情况下，使用 元组（Tuple） 来代替数组要更加妥当，比如一个数组中只存放固定长度的变量，但我们进行了超出长度地访问：
```ts
const arr3: string[] = ['x', 'x', 'x'];

console.log(arr3[599]);
```
这种情况肯定不符合预期，我们希望超出指定的数组索引范围就报错，于是就可以使用元组：
```ts
const arr4: [string, string, string] = ['x', 'x', 'x'];

console.log(arr4[599]); //长度为“3”的元组类型“[string, string, string]”在索引“599“处没有元素
```

同时也可以为元组各项指定类型。以及可选成员，对于标记可选成员在 `--strictNullCheckes` 配置下会被视为 `string | undefined` 类型。
```ts
const arr5: [string, number, boolean] = ['xxx', 599, true];
// 可选成员
const arr6: [string, number?, boolean?] = ['xxx'];
// 下面这么写也可以
// const arr6: [string, number?, boolean?] = ['xxx', , ,];
```

此时元组长度会发生变化，比如元组 arr6 的长度类型为 1 | 2 | 3
```ts
type TupleLength = typeof arr6.length; // 1 | 2 | 3
```

这么一看元组的可读性并没有太好，但在 TS4 中，有了`具名元组`。
```ts
const arr7: [name: string, age: number, male: boolean] = ['xxx', 599, true];
```
使用元组确实能帮助我们进一步提升数组结构的严谨性，包括基于位置的类型标注、避免出现越界访问等等。

### 对象的类型标注

在 TypeScript 中我们也需要特殊的类型标注来描述对象类型，即 interface ，你可以理解为它代表了这个**对象对外提供的接口结构**。
```ts
interface IDescription {
  name: string;
  age: number;
  male: boolean;
}

const obj1: IDescription = {
  name: 'linbudu',
  age: 599,
  male: true,
};

```

除了声明属性以及属性的类型以外，我们还可以对属性进行修饰，常见的修饰包括**可选（Optional） 与 只读（Readonly）** 这两种。

可选属性：
```ts
interface IDescription {
  name: string;
  age: number;
  male?: boolean;
  func?: Function;
}

const obj2: IDescription = {
  name: 'xxx',
  age: 599,
  male: true,
  // 无需实现 func 也是合法的
};
```
此时直接访问 male 属性类型仍然会是 `boolean | undefined` 。因为这是自己定义的。
即使你对可选属性进行了赋值，TypeScript 仍然会使用接口的描述为准进行类型检查，可以使用类型断言、非空断言或可选链解决。

readonly: 防止属性被再次赋值:
```ts
interface IDescription {
  readonly name: string;
  age: number;
}

const obj3: IDescription = {
  name: 'xxx',
  age: 599,
};

// 无法分配到 "name" ，因为它是只读属性
obj3.name = "zxc";
```

其实在数组与元组层面也有着只读的修饰，但与对象类型有着两处不同 :

- 你只能将整个数组/元组标记为只读，而不能像对象那样标记某个属性为只读。
- 一旦被标记为只读，那这个只读数组/元组的类型上，将不再具有 push、pop 等方法（即会修改原数组的方法），因此报错信息也将是类型 xxx 上不存在属性“push”这种。这一实现的本质是只读数组与只读元组的类型实际上变成了 ReadonlyArray，而不再是 Array。

#### type 与 interface
很多人更喜欢用 type（Type Alias，类型别名）来代替接口结构描述对象，更推荐的方式是，interface 用来描述对象、类的结构，而类型别名用来将一个函数签名、一组联合类型、一个工具类型等等抽离成一个完整独立的类型。但大部分场景下接口结构都可以被类型别名所取代，因此，只要你觉得统一使用类型别名让你觉得更整齐，也没什么问题。

### object、Object 以及 { }
Object 在 TS 中表示包含了所有的类型。
```ts
// 对于 undefined、null、void 0 ，需要关闭 strictNullChecks
const tmp1: Object = undefined;
const tmp2: Object = null;
const tmp3: Object = void 0;

const tmp4: Object = 'linbudu';
const tmp5: Object = 599;
const tmp6: Object = { name: 'linbudu' };
const tmp7: Object = () => {};
const tmp8: Object = [];
```

和 Object 类似的还有 Boolean、Number、String、Symbol，这几个**装箱类型（Boxed Types）** 同样包含了一些**超出预期的类型**。以 String 为例，它同样**包括 undefined、null、void**，以及代表的 **拆箱类型（Unboxed Types） string**。
```ts
const tmp9: String = undefined;
const tmp10: String = null;
const tmp11: String = void 0;
const tmp12: String = 'xxx';

// 以下不成立，因为不是字符串类型的拆箱类型
const tmp13: String = 599; // X
const tmp15: String = () => {}; // X
const tmp16: String = []; // X
```

`注意：在任何情况下都不该用装箱类型`

object: 代表除了原始值外的引用类型。

最后是{}，可以认为{}就是一个对象字面量类型，可以认为使用{}作为类型签名就是一个合法的，但内部无属性定义的空对象。
虽然能够将其作为变量的类型，但你实际上无法对这个变量进行任何赋值操作：
```ts
const tmp30: {} = { name: 'xxx' };

tmp30.age = 18; // X 类型“{}”上不存在属性“age”。
```

最后，为了更好地区分 Object、object 以及{}这三个具有迷惑性的类型，我们再做下总结：

- 在任何时候都不要，不要，不要使用 Object 以及类似的装箱类型。

- 当你不确定某个变量的具体类型，但能确定它不是原始类型，可以使用 object。但我更推荐进一步区分，也就是使用 Record<string, unknown> 或 Record<string, any> 表示对象，unknown[] 或 any[] 表示数组，(...args: any[]) => any表示函数这样。

- 我们同样要避免使用{}。{}意味着任何非 null / undefined 的值，从这个层面上看，使用它和使用 any 一样恶劣。


### unique symbol
Symbol 在 JavaScript 中代表着一个唯一的值类型，它类似于字符串类型，可以作为对象的属性名，并用于避免错误修改 对象 / Class 内部属性的情况。而在 TypeScript 中，symbol 类型并不具有这一特性，**一百个具有 symbol 类型的对象，它们的 symbol 类型指的都是 TypeScript 中的同一个类型**。为了**实现“独一无二”**这个特性，TypeScript 中**支持了 unique symbol 这一类型声明**，它是 symbol 类型的子类型，每一个 unique symbol 类型都是独一无二的。

在 JavaScript 中，我们可以用 Symbol.for 方法来复用已创建的 Symbol，如 Symbol.for("xxx") 会首先查找全局是否已经有使用 xxx 作为 key 的 Symbol 注册，如果有，则返回这个 Symbol，否则才会创建新的 Symbol 。

