# TypeScript 高阶用法

我给你整理**最实用、最核心、面试 / 开发必用**的 TS 高阶用法，全部配**简单易懂的示例**，不搞花里胡哨，你直接对照就能用。

------

## 一、类型工具（Type Utilities）—— 最常用

TS 内置了很多工具类型，不用自己写重复类型。

### 1. `Partial<T>`

把类型**所有属性变成可选**

```
interface User {
  name: string
  age: number
}
type PartialUser = Partial<User>
// { name?: string; age?: number }
```

### 2. `Required<T>`

把类型**所有属性变成必选**

### 3. `Readonly<T>`

把类型**所有属性变成只读**

### 4. `Pick<T, K>`

从类型里**挑选几个属性**

```
type UserName = Pick<User, 'name'>
// { name: string }
```

### 5. `Omit<T, K>`

从类型里**剔除几个属性**

```
type UserWithoutAge = Omit<User, 'age'>
// { name: string }
```

### 6. `Exclude<T, U>`

从联合类型里**排除某些类型**

```
type T = Exclude<'a' | 'b' | 'c', 'a'>
// 'b' | 'c'
```

### 7. `Extract<T, U>`

从联合类型里**提取某些类型**

### 8. `ReturnType<T>`

获取**函数返回值类型**

```
function fn() {
  return { name: 'ts' }
}
type FnReturn = ReturnType<typeof fn>
```

------

## 二、泛型（Generic）—— 高阶核心

泛型 = **类型的参数**，让类型可以复用、灵活。

### 1. 基础泛型函数

```
function identity<T>(arg: T): T {
  return arg
}
```

### 2. 泛型接口

```
interface Result<T> {
  code: number
  data: T
}
type UserResult = Result<User>
```

### 3. 泛型约束（限制类型范围）

```
interface Lengthwise {
  length: number
}
function logLength<T extends Lengthwise>(arg: T) {
  console.log(arg.length)
}
```

------

## 三、类型推断 + 类型守卫

让 TS **自动推导类型**，或你手动明确类型。

### 1. 类型守卫 `typeof`

```
function isString(value: unknown): value is string {
  return typeof value === 'string'
}
```

### 2. 类型守卫 `in`

```
if ('name' in user) {
  // TS 知道这里一定有 name
}
```

### 3. `instanceof` 类守卫

------

## 四、联合类型 & 交叉类型

### 1. 联合类型（或）

```
type A = string | number
```

### 2. 交叉类型（且）

```
type User = { name: string } & { age: number }
```

------

## 五、keyof 与 索引访问类型

超级常用，**动态拿对象属性类型**。

### 1. `keyof`

获取对象**所有 key 组成的联合类型**

```
type UserKeys = keyof User
// 'name' | 'age'
```

### 2. 索引访问

ts









```
type UserNameType = User['name'] // string
```

------

## 六、映射类型（高级造类型神器）

基于旧类型**生成新类型**。

ts









```
type ReadonlyOnly<T> = {
  readonly [P in keyof T]: T[P]
}
```

------

## 七、条件类型（三目运算符类型）

ts









```
type IsString<T> = T extends string ? true : false
```

------

## 八、重载（函数重载）

一个函数，**不同入参 → 不同返回类型**。

ts









```
function func(x: string): string
function func(x: number): number
function func(x: any) {
  return x
}
```

------

## 九、断言（Assert）

### 1. 类型断言

ts









```
const user = {} as User
```

### 2. `as const` 断言（变成只读字面量）

ts









```
const status = ['success', 'fail'] as const
```

------

## 十、高级模块化用法

### 1. 声明文件 `.d.ts`

给 JS 库写类型。

### 2. 模块 augment（模块扩展）

给已有类型**追加属性**（Vue/React 常用）。

------

## 十一、工具类型自己造（高级）

你可以造业务专属类型：

ts









```
type ApiResult<T> = {
  code: number
  msg: string
  data: T
}
```

------

# 最最常用的 TOP 10 高阶用法（必背）

1. **泛型 `<T>`**
2. **Partial / Omit / Pick / Readonly**
3. **ReturnType / Parameters**
4. **keyof + 索引访问**
5. **类型守卫 `is`**
6. **联合类型 & 交叉类型**
7. **as const**
8. **映射类型**
9. **条件类型**
10. **模块扩展**

------

### 你想要哪种？

我可以**按你的项目（Vue/React/Babylon3D）**

给你写 **一套真正能直接用的 TS 高阶代码模板**。