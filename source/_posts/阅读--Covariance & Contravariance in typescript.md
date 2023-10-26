---
title: 阅读--Covariance & Contravariance in typescript
date: 2023-10-26 20:18:12
tags:
  - 阅读
  - 英文博客
  - typescript
categories:
  - [阅读]
---
在 TypeScript 中，协变（Covariance）、逆变（Contravariance）和双变（Bivariant）是类型系统中的重要概念。它们描述了类型如何在继承或实现接口时相互关联。

本文博客参考于(大部分是直接翻译过来...)：![How I understand Covariance & Contravariance in typescript](https://dev.to/codeoz/how-i-understand-covariance-contravariance-in-typescript-2766)
该篇博客详细介绍了这三个东西的特点。原文作者保证文章结束后将会对这三个概念非常清晰(后仰)


```ts
class Animal {}

class Dog extends Animal {}

class Greyhound extends Dog {}
```
上方的代码 Dog 继承了 Animal, Greyhound 继承了 Dog。 而这是上方三个 “变的” 概念的基石。

### Covariance
协变接受子类型(subType)，但是不接受父类型(superType)

可以先写一个函数，他只接受 Dog 的协变类型，也就是子类型。
```ts
const acceptDogCovariance = function (value: Covariant<Dog>) {...}
acceptDogCovariance(new Animal()) // Error
acceptDogCovariance(new Dog())  // ok
acceptDogCovariance(new Greyhound()) // ok
```
可以看到协变只接受类型本身和子类型。

### Contravariance
协变可以接受父类型但是不可以接受子类型。
```ts
const acceptDogContravariance = function (value: Contravariance<Dog>) { ... }

acceptDogContravariance(new Animal()) // Ok, since Animal is a supertype of Dog
acceptDogContravariance(new Dog()) // Ok
acceptDogContravariance(new Greyhound()) // Error since Greyhound is a subtype of Dog
```


### Bivariant
双变接受两者， supertype & subtype。


### How Typescript use covariance and contravariance for argument in function
神奇的是，ts 中参数类型是 bivariant，这其实不是一种正确的行为。

```ts

class Animal {
  sayAnimal(): void {
    console.log('i am a animal')
  }
}

class Dog extends Animal {
  sayDog(): void {
    console.log('i am dog')
  }
}

class Cat extends Animal {
  sayCat(): void {
    console.log('')
  }
}

function makeAnimalAction(animalAction: (animal: Animal) => void): void {
  let cat: Cat = new Cat()
  animalAction(cat)
}


function dogAction(dog: Dog) {
  dog.sayDog()
}

makeAnimalAction(dogAction) // 类型“(dog: Dog) => void”的参数不能赋给类型“(animal: Animal) => void”的参数。参数“dog”和“animal” 的类型不兼容。类型 "Animal" 中缺少属性 "sayDog"，但类型 "Dog" 中需要该属性。
```
在这个例子中，可以证明参数的类型是双变，虽然他报错了，但是可以通过 ts 的配置： `--strictFunctionTypes` 标志来实现。

回到代码本身，通过这个函数可以看出来是逆变，它仅接受父类型，很显然我们不能把 dog 函数传到 `makeAnimalAction` 中，让狗去替代猫说话本身就不现实嘛！


### How Typescript use covariance and contravariance for returned type in function ?

那么 ts 又是如何在函数中使用协变与逆变返回类型？作者直接给出了结论233333：函数的返回类型是 `covariant` ！

```ts
class Animal {}


class Dog extends Animal {
  bark(): void {
    console.log("Bark")
  }
}


class GreyHound extends Dog {}


function makeDogBark(animalAction: (animal: Animal) => Dog) : void {
  animalAction(new Animal()).bark()
}

function animalAction(animal: Animal): Animal {
  return animal
}

function dogAction(animal: Animal): Dog {
  return animal as Dog // 只是为了测试这么写
}


makeDogBark(animalAction) // Error since not all Animal can bark.

makeDogBark(dogAction)  // ok
```

可以看到，将 animalAction 传入 makeDogBark 函数中会提醒 `"Animal" 中缺少属性 "bark"，但类型 "Dog" 中需要该属性。` 。而下方声明的 dogAction 就可以成功，尽管它的断言不够严谨。而这恰好证明函数的返回值是协变的，它仅接受子类型！