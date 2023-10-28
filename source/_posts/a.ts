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
}

type TestFunctionKeys = FunctionKeys<{
  foo: () => void,
  bar: (name: any) => string,
  test: string
}, FunctionType>

