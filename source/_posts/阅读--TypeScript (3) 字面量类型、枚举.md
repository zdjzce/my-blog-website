---
title: 阅读--TypeScript(3) 字面量类型、枚举
date: 2023-05-04 09:42:30
tags:
  - 阅读
  - TypeScript
categories:
  - [阅读]
---

### 字面量类型
当描述接口返回值的时候会定义如下接口：
```ts
interface Response {
  code: number,
  status: string,
  data: any
}
```
但描述的其实不够准确，比如 code 可能是 200,400,500 等等，status 可能是 success 或者 failed。而上面只给出了宽泛的类型。
结合字面量类型可以将上面改造成：
```ts
interface Response {
  code: 200 | 400 | 500,
  status: 'success' | 'failed',
  data: any
}
```
在 TypeScript 中，这叫做字面量类型（Literal Types），它代表着比原始类型更精确的类型，同时也是原始类型的子类型。
字面量类型主要包括字符串字面量类型、数字字面量类型、布尔字面量类型和对象字面量类型，它们可以直接作为类型标注：

#### 联合类型
联合类型可以理解为，一组可用的类型集合，只要赋值时是指定联合类型之一的类型，就合法。
```ts
interface Tmp {
  mixed: true | string | 599 | {} | (() => {}) | (1 | 2)
}
```
- 对于联合类型中的函数类型，需要使用括号()包裹起来
- 函数类型并不存在字面量类型，因此这里的 (() => {}) 就是一个合法的函数类型
- 你可以在联合类型中进一步嵌套联合类型，但这些嵌套的联合类型最终都会被展平到第一级中

联合类型通常用于实现互斥属性，即这个属性如果有字段1，就没有字段2。
```ts
interface Tmp {
  user:
    | {
        vip: true;
        expires: string;
      }
    | {
        vip: false;
        promotion: string;
      };
}

declare var tmp: Tmp;

if (tmp.user.vip) {
  console.log(tmp.user.expires);
}
```
在这个例子中， user 属性会满足普通用户与 vip 用户两种类型，这里 vip 属性的类型基于布尔字面量类型声明，在实际使用时可以通过判断此属性为 true。

也可以通过类型别名来服用一组字面量联合类型：
```ts
type Code = 10000 | 10001 | 50000;

type Status = "success" | "failure";
```
除了原始类型的字面量类型以外，对象类型也有着对应的字面量类型。

#### 对象字面量类型
对象字面量类型就是一个对象类型的值。
```ts
interface Tmp {
  obj: {
    name: "xxx",
    age: 18
  }
}

const tmp: Tmp = {
  obj: {
    name: "xxx",
    age: 18
  }
}
```

如果要实现一个对象字面量类型，意味着完全的实现这个类型每一个属性的每一个值。
总的来说，在需要更精确类型的情况下，可以使用字面量类型加上联合类型的方式，将类型从 string 这种宽泛的原始类型直接收窄到 "resolved" | "pending" | "rejected" 这种精确的字面量类型集合。

**无论是原始类型还是对象类型的字面量类型，它们的本质都是类型而不是值。它们在编译时同样会被擦除，同时也是被存储在内存中的类型空间而非值空间。**

如果说字面量类型是对原始类型的进一步扩展（对象字面量类型的使用较少），那么枚举在某些方面则可以理解为是对对象类型的扩展。

#### 枚举
```ts
enum Items {
  Foo, // 0
  Bar, // 1
  Baz // 2
}
```
如果没有声明枚举的值，它会默认从 0 开始，以 1 递增。

如果只指定了某个成员的枚举值，之前未赋值的仍然会从 0 开始，之后的成员则会开始从枚举值递增。

```ts
enum Items {
  Foo, // 0,
  Bar = 500,
  Baz // 501
}
```

在数字型枚举，还可以使用延迟求值：
```ts
const returnNum = () => 100 + 499
enum Items {
  Foo = returnNum(),
  Bar = 599,
  Baz
}
```
延迟求值是有条件的，没有使用延迟求值的成员必须放在延迟枚举之后，或者第一位。

也可以同时使用字符串枚举和数字枚举：
```ts
enum Mixed {
  Num = 599,
  Str = "xxx"
}
```

枚举和对象的重要差距在于，**对象是单项映射**，只能从**键映射到键值**，枚举是双向映射的，枚举成员跟枚举值都可以互相映射。

```ts
enum Test {
  test = 3,
  dd,
  ss
}

console.log(Test.dd);
console.log(Test[4]);
```

可以看下枚举的编译产物，本质上是在对象里把键和值分别进行了赋值。相当于 `obj[key] = value` `obj[value] = key`

```js
var Test;
(function (Test) {
    Test[Test["test"] = 3] = "test";
    Test[Test["dd"] = 4] = "dd";
    Test[Test["ss"] = 5] = "ss";
})(Test || (Test = {}));
console.log(Test.dd);
console.log(Test[4]);
//# sourceMappingURL=index.js.map
```

但如果是字符串枚举，那就是**单项映射**，只有值为数字才是双向枚举。

##### 常量枚举
常亮枚举和枚举相似，只是其声明多了一个 const
```ts
const enum Items {
  Foo,
  Bar,
  Baz
}
```

它和普通枚举差异主要在访问性与编译产物，常量枚举**只能通过枚举成员访问枚举值**，反之不行。