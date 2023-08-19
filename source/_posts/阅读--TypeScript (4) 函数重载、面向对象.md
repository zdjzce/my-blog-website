---
title: 阅读--TypeScript(4) 函数重载，面向对象
date: 2023-05-04 21:41:30
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---

### 前言
如果说函数代表着面向过程的编程，那么 Class 则代表着面向对象的编程，而它也是 ES6 新特性的重要一部分———终于可以和各种花式继承告别了。

此章主要记录函数与 Class 的类型标注，以及一些在 TypeScript 中独有或相比 JavaScript 更加完全的概念，如**重载**与**面向对象的编程**等。函数部分，主要关注其参数类型、返回值类型以及重载的应用。 Class部分，除了类型以外，还有访问性修饰符、继承、抽象类等来自于面向对象理念的实际使用。

### 函数

#### 函数的类型签名
函数的类型就是描述了**函数入参和返回值类型**，最简单的例子：
```ts
function foo(name: string): number {
  return name.length;
}
```
函数中同样存在类型推导，这里的 number 就可以不写。
在 JS 世界里，通常可以用**函数声明**和**函数表达式**来创建函数，函数声明就是上面的例子，函数表达式则是：
```ts
// 方式1
const foo: (name: string) => number = name => {
  return name.length
}
// 方式2
const foo = (name: string): number => {
  return name.length  
}
```

如果只是为了描述这个函数的类型结构，甚至可以使用 interface 来进行函数声明：
```ts
interface FuncFooStruct {
  (name: string): number
}
```

#### void
在 TypeScript 中，一个没有返回值（即没有调用 return 语句）的函数，其返回类型应当被标记为 void 而不是 undefined，即使它实际的值是 undefined。
```ts
// 没有调用 return 语句
function foo(): void { }

// 调用了 return 语句，但没有返回值
function bar(): void {
  return;
}
```
在 TypeScript 中，undefined 类型是一个实际的、有意义的类型值，而 void 才代表着空的、没有意义的类型值。在没有实际返回值时，使用 void 类型能更好地说明这个函数没有进行返回操作。
在上面的第二个例子中，其实更好的方式是使用 undefined ：
```ts
function bar(): undefined {
  return;
}
```

#### 可选参数与 rest 参数
在很多时候，我们会希望函数的参数可以更灵活，比如它不一定全都必传，当你不传入参数时函数会使用此参数的默认值。正如在对象类型中我们使用 ? 描述一个可选属性一样，在函数类型中也使用 ? 描述一个可选参数：
```ts
// 在函数逻辑中注入可选参数默认值
function foo1(name: string, age?: number): number {
  const inputAge = age || 18; // 或使用 age ?? 18
  return name.length + inputAge
}

// 直接为可选参数声明默认值
function foo2(name: string, age: number = 18): number {
  const inputAge = age;
  return name.length + inputAge
}
```
需要注意的是，**可选参数必须位于必选参数之后**。毕竟在 JavaScript 中函数的入参是按照位置（形参），而不是按照参数名（名参）进行传递。


对于 rest 参数的类型标注也比较简单，由于其实际上是一个数组，这里也应当使用数组类型进行标注：
`function foo(arg1: string, ...rest: [number, boolean]) { }`

#### 重载
假设有下面一个函数
```ts
function func(foo: number, bar?: boolean): string | number {
  if (bar) {
    return String(foo);
  } else {
    return foo * 599;
  }
}
```
单看逻辑，根据 bar 的值判断返回字符串还是数字，但是根据联合类型并不能很好的体现参数与返回值之间的关联。于是就需要函数重载：
```ts
function func(foo: number, bar: true): string;
function func(foo: number, bar?: false): number;
function func(foo: number, bar?: boolean): string | number {
  if (bar) {
    return String(foo);
  } else {
    return foo * 599;
  }
}

const res1 = func(599); // number
const res2 = func(599, true); // string
const res3 = func(599, false); // number

```

基于重载签名，就实现了将入参类型和返回值类型的可能情况进行关联，获得了更精确的类型标注能力。实际上，TypeScript 中的重载更像是伪重载，它只有一个具体实现，其重载体现在方法调用的签名上而非具体实现上。

#### 异步函数、Generator 函数等类型签名
对于异步函数、Generator 函数、异步 Generator 函数的类型签名，其参数签名基本一致，而返回值类型则稍微有些区别：
```ts
async function asyncFunc(): Promise<void> {}

function* genFunc(): Iterable<void> {}

async function* asyncGenFunc(): AsyncIterable<void> {}
```

### Class
#### 类与类成员的类型签名
Class 中的主要结构只有构造函数、属性、方法和访问符（Accessor）。
属性的类型标注类似于变量，而构造函数、方法、存取器的类型编标注类似于函数：
```ts
class Foo {
  prop: string;

  constructor(inputProp: string) {
    this.prop = inputProp;
  }

  print(addon: string): void {
    console.log(`${this.prop} and ${addon}`)
  }

  get propA(): string {
    return `${this.prop}+A`;
  }

  set propA(value: string) {
    this.prop = `${value}+A`
  }
}
```
setter 方法不允许进行返回值的类型标注，可以理解为 setter 的返回值并不会被消费。

#### 修饰符
在 TypeScript 中能够为 Class 成员添加这些修饰符：`public / private / protected / readonly`。除 readonly 以外，其他三个都属于**访问性修饰符**，而 **readonly 属于操作性修饰符**（就和 interface 中的 readonly 意义一致）。

```ts
class Foo {
  private prop: string;

  constructor(inputProp: string) {
    this.prop = inputProp;
  }

  protected print(addon: string): void {
    console.log(`${this.prop} and ${addon}`)
  }

  public get propA(): string {
    return `${this.prop}+A`;
  }

  public set propA(value: string) {
    this.propA = `${value}+A`
  }
}
```

- public：此类成员在类、类的实例、子类中都能被访问。
- private：此类成员仅能在类的内部被访问。
- protected：此类成员仅能在类与子类中被访问，你可以将类和类的实例当成两种概念，即一旦实例化完毕（出厂零件），那就和类（工厂）没关系了，即不允许再访问受保护的成员。

当不显式使用访问修饰符，成员的访问性会默认为 public，上面的例子里，通过构造函数为类成员赋值的方式还是麻烦，需要声明类属性以及在构造函数中赋值，可以直接**在构造函数中对参数应用访问性修饰符**

```ts
class Foo {
  constructor(public arg1: string, private arg2: boolean) { }
}

new Foo("xxx", true)
```

#### **静态成员**
在 TS 中，可以使用 static 关键字来标识静态成员
```ts
class Foo {
  static staticHandler() { }

  public instanceHandler() { }
}

```
不同于实例成员，在类的内部静态成员无法通过 this 访问，需要通过类的属性去访问，如 `Foo.staticHandle`。可以查看编译到 ES5 的代码：
```js
var Foo = /** @class */ (function () {
    function Foo() {
    }
    Foo.staticHandler = function () { };
    Foo.prototype.instanceHandler = function () { };
    return Foo;
}());
```

**实例成员挂载在原型上，静态成员是直接挂载在函数上**。这就是二者的差异：**静态成员不会被实例继承，始终只属于当前这个类（以及子类）**。

对于静态成员和实例成员的使用时机，可以使用**类+静态成员**来收敛变量。
```ts
class Utils {
  public static identifier = "linbudu";

  public static makeUHappy() {
    Utils.studyWithU();
    // ...
  }

  public static studyWithU() { }
}

Utils.makeUHappy();
```

#### **继承、实现、抽象类**
与 JS 一样，TS 实现继承也是使用 extends 关键字：
```ts
class Base { }
class Derived extends Base { }
```
对于这里的两个类，比较严谨的称呼是 基类（Base） 与 派生类（Derived）。当然，叫父类和子类也可以。
而这部分需要主要了解的是：**派生类对基类成员的访问与覆盖操作。**

基类中的哪些成员能够被派生类访问，完全是由访问修饰符决定的。派生类可以访问到 `public` 或 `protected`修饰的基类成员。基类的方法也可以在派生类中被覆盖，但仍然可以通过 super 访问到基类的方法。

``` ts
class Base {
  print() { }
}

class Derived extends Base {
  print() {
    super.print()
    // ...
  }
}
```

在派生类覆盖基类方法时，并不能确保派生类的这一方法能够覆盖基类方法，万一基类不存在这个方法呢？
```ts
class Base {
  printWithLove() { }
}

class Derived extends Base {
  override print() {
    // ...
  }
}
```
在这里 TS 将会给出错误，因为尝试覆盖的方法并未在基类中声明。通过这一关键字我们就能确保首先这个方法在基类中存在，同时标识这个方法在派生类中被覆盖了。

除了基类和派生类外，还有个重要的概念：**抽象类**。抽象类是对类结构与方法的抽象。它描述了一个类中应当有哪些成员。
在 TS 中使用 abstract 关键字声明：
```ts
abstract class AbsFoo {
  abstract absProp: string;
  abstract get absGetter(): string;
  abstract absMethod(name: string): string
}
```

注意：抽象类中成员也要使用 abstract 关键字才能被视为成员，如这里的抽象方法，可以实现（**implements**）一个抽象类。
```ts
class Foo implements AbsFoo {
  absProp: string = "xxx"

  get absGetter() {
    return "xxx"
  }

  absMethod(name: string) {
    return name
  }
}
```
此时，我们必须完全实现这个抽象类的每一个抽象成员。需要注意的是，在 TypeScript 中无法声明静态的抽象成员。

当然，也可以使用 interface 声明类的结构：
```ts
interface FooStruct {
  absProp: string;
  get absGetter(): string;
  absMethod(input: string): string
}
```

除此以外，我们还可以使用 Newable Interface 来描述一个类的结构（类似于描述函数结构的 Callable Interface）：
```ts
interface ComesFromString {
    name: string;
}

interface StringConstructable {
    new(n: string): ComesFromString;
}

class MadeFromString implements ComesFromString {
    constructor (public name: string) {
        console.log('ctor invoked');
    }
}

function makeObj(n: StringConstructable) {
    return new n('hello!');
}

console.log(makeObj(MadeFromString).name);
```