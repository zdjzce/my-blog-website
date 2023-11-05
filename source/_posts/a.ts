type DeepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}


type TestObj = {
  name: string,
  age: number,
  r: {
    test: string,
    tt: {
      ss: string
    }
  }
}


type abc = DeepPartial<TestObj>


type MarkPropsAsOptional<T extends object, K extends keyof T = keyof T> = Partial<Pick<T, K>> & Omit<T, K>


type test2 = {
  a: string,
  b: string,
  c: string
}

const picks = ['a', 'b'] as const

export type Flatten<T> = { [K in keyof T]: T[K] };
type testMarkOptional = Flatten<MarkPropsAsOptional<test2, typeof picks[number]>>


type Test3<T, K extends keyof T> = DeepPartial<Pick<T, K>>



type FunctionType = (...args: any[]) => any

type FunctionKeys<T, FunctionType> = {
  [K in keyof T]-?: T[K] extends FunctionType ? K : never
}[keyof T]

type TestFunctionKeys = FunctionKeys<{
  foo: () => void,
  bar: (name: any) => string,
  test: string
}, FunctionType>


type Wrapped<T, B> = T extends B ? 'Y' : 'N'


type Res1 = Wrapped<false | '1', boolean>

type Res2 = Wrapped<'1' | '2', '1' | '2' | '3'>



interface VIP {
  vipExpires: number;
}

interface CommonUser {
  promotionUsed: boolean;
}


type VU<T, U> = Exclude<keyof T, keyof U>


type Without222<T, U> = {
  [K in keyof T]?: never
}


type Without<T, U> = {
  [K in Exclude<keyof T, keyof U>]?: never
}

type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T)


type CUser = Flatten<XOR<VIP, CommonUser>>


type UserA = {
  name: string
  age: number
  inhabit: string
}

type UserB = {
  name: string
  age: number
}

export type PlainObjectType = Record<string, any>;

type Difference<A, B> = B extends A ? never: A


type ObjectDifference<T extends PlainObjectType, U extends PlainObjectType> = Pick<T, Difference<keyof T, keyof U>>



type Fun = (...args: any) => any


type LastParameter<T extends Fun> = T extends (arg: infer P) => any
  ? P
  : T extends (...args: infer R) => any
    ? R extends [...any, infer Q]
      ? Q
      : never
    : never



type FooFunc = LastParameter<(arg: number) => any> // number
type FooBar = LastParameter<(...args: string[]) => any> // string
type FooBaz = LastParameter<(...args: [string, never]) => any> // never

