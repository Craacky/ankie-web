# TypeScript: Полное руководство для подготовки к интервью 🚀

## Содержание
- [1. Ключевое слово declare в TS](#1-ключевое-слово-declare-в-ts)
- [2. Модификаторы доступа в TS](#2-модификаторы-доступа-в-ts)
- [3. Что такое TS и зачем он нужен](#3-что-такое-ts-и-зачем-он-нужен)
- [4. Утилита Pick - пример использования](#4-утилита-pick---пример-использования)
- [5. Абстрактный класс vs интерфейс](#5-абстрактный-класс-vs-интерфейс)
- [6. Объединение vs пересечение типов](#6-объединение-vs-пересечение-типов)
- [7. Разница между типами void, never и unknown](#7-разница-между-типами-void-never-и-unknown)
- [8. Типы vs интерфейсы](#8-типы-vs-интерфейсы)
- [9. Чем отличается unknown от any, когда использование any оправдано](#9-чем-отличается-unknown-от-any-когда-использование-any-оправдано)
- [10. Утилита Record - пример использования](#10-утилита-record---пример-использования)
- [11. Типы массивов и кортежей](#11-типы-массивов-и-кортежей)
- [12. Утилита Readonly - пример использования](#12-утилита-readonly---пример-использования)
- [13. Объединение и пересечение](#13-объединение-и-пересечение)
- [14. Утилита Partial - пример использования](#14-утилита-partial---пример-использования)
- [15. Утилита Required - пример использования](#15-утилита-required---пример-использования)
- [16. Основные типы TypeScript](#16-основные-типы-typescript)
- [17. Литеральные типы](#17-литеральные-типы)
- [18. Когда использовать типы, а когда интерфейсы](#18-когда-использовать-типы-а-когда-интерфейсы)
- [19. Основные и расширенные типы TS, утилиты, способы управления типами, продвинутые паттерны](#19-основные-и-расширенные-типы-ts-утилиты-способы-управления-типами-продвинутые-паттерны)
- [20. Утилита Exclude - пример использования](#20-утилита-exclude---пример-использования)
- [21. Утилита Extract - пример использования](#21-утилита-extract---пример-использования)
- [22. Утилита Omit - пример использования](#22-утилита-omit---пример-использования)
- [23. Утилита NonNullable - пример использования](#23-утилита-nonnullable---пример-использования)
- [24. Когда использовать типы, а когда интерфейсы](#24-когда-использовать-типы-а-когда-интерфейсы)

---

## 1. Ключевое слово declare в TS

**Вопрос:** Что делает ключевое слово `declare` в TypeScript?

**Ответ:** Ключевое слово `declare` используется для описания формы существующего JavaScript кода (библиотек, API, переменных), которое TypeScript не компилирует, но знает о его существовании. Оно используется в основном при создании файлов определений типов (`.d.ts`) для библиотек JavaScript.

```ts
// Пример объявления глобальной переменной из внешней библиотеки
declare var myLib: {
  startTime: number;
  endTime: number;
};

// Пример объявления глобальной функции
declare function myFunc(msg: string): void;
```

Это позволяет использовать сторонние библиотеки с типобезопасностью.

---

## 2. Модификаторы доступа в TS

**Вопрос:** Какие модификаторы доступа существуют в TypeScript?

**Ответ:** В TypeScript есть три модификатора доступа:

- `public` — члены класса доступны отовсюду. По умолчанию все члены класса являются `public`.
- `private` — члены класса доступны только внутри класса.
- `protected` — члены класса доступны внутри класса и его подклассов.

```ts
class Example {
  public publicProp: string;
  private privateProp: string;
  protected protectedProp: string;

  constructor() {
    this.publicProp = 'public';
    this.privateProp = 'private';
    this.protectedProp = 'protected';
  }
}

class Child extends Example {
  someMethod() {
    // this.publicProp;      // OK
    // this.privateProp;     // Ошибка!
    // this.protectedProp;   // OK
  }
}
```

---

## 3. Что такое TS и зачем он нужен

**Вопрос:** Что такое TypeScript и зачем он вообще нужен?

**Ответ:** TypeScript — это надмножество JavaScript, добавляющее статическую типизацию. Он компилируется в обычный JavaScript. TypeScript нужен для:

- Типобезопасности, выявления ошибок на этапе компиляции
- Лучшей поддержки кода в больших проектах
- Улучшенной автодополнения и навигации в IDE
- Ясности намерений при разработке (документация кода)
- Совместимости с существующим JavaScript кодом
- Поддержки новых возможностей ES, которые компилируются в старые версии JavaScript

---

## 4. Утилита Pick - пример использования

**Вопрос:** Для чего утилита Pick? Приведите пример.

**Ответ:** Утилита `Pick<T, K>` позволяет создать новый тип, выбирая определенные свойства `K` из типа `T`.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Выбираем только нужные поля
type UserProfile = Pick<User, 'name' | 'email'>;

// Результат: { name: string; email: string; }
const user: UserProfile = {
  name: 'John',
  email: 'john@example.com'
};
```

---

## 5. Абстрактный класс vs интерфейс

**Вопрос:** Абстрактный класс против интерфейса?

**Ответ:** 

**Абстрактный класс:**
- Может содержать реализации методов (как абстрактные, так и конкретные)
- Может иметь поля и конструкторы
- Не может быть инстанциирован напрямую
- Подклассы должны реализовать абстрактные методы
- Поддерживает наследование только от одного класса

**Интерфейс:**
- Содержит только определения (до TS 2.0), но может содержать реализации методов с TS 2.0+
- Не может содержать реализации полей (только определения)
- Не имеет конструктора
- Поддерживает множественное наследование
- Используется для определения контракта

```ts
// Абстрактный класс
abstract class Animal {
  abstract makeSound(): void;
  move(): void {
    console.log('Moving...');
  }
}

// Интерфейс
interface Flyable {
  fly(): void;
}

class Bird extends Animal implements Flyable {
  makeSound(): void {
    console.log('Tweet!');
  }
  
  fly(): void {
    console.log('Flying!');
  }
}
```

---

## 6. Объединение vs пересечение типов

**Вопрос:** Объединение против пересечения?

**Ответ:** 

**Объединение (Union):** `TypeA | TypeB` — значение может быть любого из указанных типов.
```ts
let value: string | number;
value = 'hello'; // OK
value = 42;      // OK
```

**Пересечение (Intersection):** `TypeA & TypeB` — значение должно удовлетворять всем указанным типам одновременно.
```ts
interface A { a: string }
interface B { b: number }

let obj: A & B; // Объект должен иметь и a, и b
obj = { a: 'hello', b: 42 }; // OK
```

---

## 7. Разница между типами void, never и unknown

**Вопрос:** Разница между типами void, never и unknown?

**Ответ:**

- `void` — используется для функций, которые ничего не возвращают (или возвращают `undefined`)
- `never` — тип для значений, которые никогда не происходят (например, функции, выбрасывающие ошибки или бесконечные циклы)
- `unknown` — самый безопасный тип, представляет значение неизвестного типа, требует проверки перед использованием

```ts
// void
function logMessage(msg: string): void {
  console.log(msg);
}

// never
function throwError(msg: string): never {
  throw new Error(msg);
}

// unknown
let userInput: unknown = 'hello';
if (typeof userInput === 'string') {
  // Теперь можно использовать userInput как строку
  const str = userInput.toUpperCase();
}
```

---

## 8. Типы vs интерфейсы

**Вопрос:** Типы vs интерфейсы?

**Ответ:** Основные различия:

**Type alias (типы):**
- Поддерживают объединения, пересечения, примитивы
- Не могут быть повторно объявлены (расширены)
- Лучше подходят для простых определений и объединений

**Interface (интерфейсы):**
- Могут быть расширены другими объявлениями (declaration merging)
- Предпочтительнее для объектных форм
- Подают лучше в сообщениях об ошибках

```ts
// type
type Name = string;
type User = Name | { name: string };

// interface
interface User {
  name: string;
}
interface User {  // declaration merging
  age: number;
}
// Результат: { name: string; age: number; }
```

---

## 9. Чем отличается unknown от any, когда использование any оправдано

**Вопрос:** Чем отличается unknown от any? Когда использование any оправдано?

**Ответ:**

`any` отключает проверку типов, позволяя делать что угодно.
`unknown` — безопасный супертип, требует проверки перед использованием.

Использование `any` оправдано:
- При работе с ненадежными API или библиотеками без типов
- Во время миграции с JavaScript на TypeScript
- Иногда в дженериках, где тип действительно может быть любым

```ts
let value: any;
value.func();  // ОК, но потенциально опасно

let unknownValue: unknown;
// unknownValue.func();  // Ошибка, требуется проверка
if (typeof unknownValue === 'function') {
  unknownValue.func();  // OK
}
```

---

## 10. Утилита Record - пример использования

**Вопрос:** Для чего утилита Record? Приведите пример.

**Ответ:** Утилита `Record<K, T>` создает тип, свойства которого имеют ключи типа `K` и значения типа `T`. Часто используется для создания объектов-карт.

```ts
// Создание объекта с ключами типа string и значениями типа number
const userScores: Record<string, number> = {
  john: 95,
  jane: 87,
  bob: 92
};

// Использование с перечислениями
enum Status { Active = 'active', Inactive = 'inactive' }
const statusMap: Record<Status, string> = {
  [Status.Active]: 'User is active',
  [Status.Inactive]: 'User is not active'
};
```

---

## 11. Типы массивов и кортежей

**Вопрос:** Типы массивов и кортежей?

**Ответ:**

**Массивы:**
```ts
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];
```

**Кортежи:**
```ts
// Кортеж с фиксированным количеством элементов разных типов
let person: [string, number] = ['John', 30];
// person = [30, 'John'];  // Ошибка!

// Кортеж с опциональными элементами (начиная с TS 3.0)
let optionalTuple: [string, number?];
optionalTuple = ['hello'];         // OK
optionalTuple = ['hello', 42];     // OK
```

---

## 12. Утилита Readonly - пример использования

**Вопрос:** Для чего утилита Readonly? Приведите пример.

**Ответ:** Утилита `Readonly<T>` делает все свойства типа `T` только для чтения.

```ts
interface Todo {
  title: string;
  description: string;
}

const todo: Readonly<Todo> = {
  title: 'Learn TypeScript',
  description: 'Complete the tutorial'
};

// todo.title = 'Updated';  // Ошибка! Свойства только для чтения
```

---

## 13. Объединение и пересечение

**Вопрос:** Объединение и пересечение?

**Ответ:** (То же, что и вопрос 6, подробный ответ)

**Объединение (Union):** `TypeA | TypeB`
```ts
type Status = 'success' | 'error' | 'warning';
let myStatus: Status = 'success';
```

**Пересечение (Intersection):** `TypeA & TypeB`
```ts
interface Address {
  street: string;
}
interface Contact {
  phone: number;
}

type Person = Address & Contact;
// Результат: { street: string; phone: number; }
```

---

## 14. Утилита Partial - пример использования

**Вопрос:** Для чего утилита Partial? Приведите пример.

**Ответ:** Утилита `Partial<T>` делает все свойства типа `T` опциональными.

```ts
interface User {
  name: string;
  email: string;
  age: number;
}

// Создание обновления пользователя, где все поля опциональны
function updateUser(id: number, update: Partial<User>) {
  // Обновляем только указанные поля
  console.log(`Updating user ${id} with:`, update);
}

updateUser(1, { name: 'New Name' });  // OK
updateUser(2, {});  // OK - можно обновить ничего
```

---

## 15. Утилита Required - пример использования

**Вопрос:** Для чего утилита Required? Приведите пример.

**Ответ:** Утилита `Required<T>` делает все свойства типа `T` обязательными (противоположна `Partial`).

```ts
interface User {
  name?: string;
  email?: string;
  phone?: string;
}

// Для валидации данных, требуем все поля
function validateUser(user: Required<User>) {
  // Все поля теперь обязательны
  console.log(user.name.toUpperCase());  // Типо-безопасно
  console.log(user.email.toLowerCase()); // Типо-безопасно
}

const userData: User = {
  name: 'John',
  email: 'john@example.com',
  phone: '123-456-7890'
};

validateUser(userData as Required<User>); // Нужно явное преобразование
```

---

## 16. Основные типы TypeScript

**Вопрос:** Основные типы TypeScript?

**Ответ:** Основные типы TypeScript:

**Примитивные типы:**
- `string` — строки
- `number` — числа
- `boolean` — логические значения
- `null` — отсутствие значения
- `undefined` — определенная, но неинициализированная переменная
- `symbol` — уникальные идентификаторы
- `bigint` — большие целые числа

**Объектные типы:**
- `Object` — объекты
- `Array` — массивы
- `Function` — функции

**Специальные типы:**
- `any` — любой тип
- `void` — отсутствие значения
- `never` — тип для значений, которые никогда не происходят
- `unknown` — неизвестный тип (безопасная альтернатива any)

---

## 17. Литеральные типы

**Вопрос:** Литеральные типы?

**Ответ:** Литеральные типы позволяют указать конкретное значение в качестве типа. Это может быть строка, число или логическое значение.

```ts
// Строковые литералы
let direction: 'up' | 'down' | 'left' | 'right';
direction = 'up';  // OK
// direction = 'top';  // Ошибка!

// Числовые литералы
let dice: 1 | 2 | 3 | 4 | 5 | 6;
dice = 4;  // OK
// dice = 7;  // Ошибка!

// Булевые литералы
let isActive: true;
isActive = true;  // OK
// isActive = false;  // Ошибка!
```

---

## 18. Когда использовать типы, а когда интерфейсы

**Вопрос:** Когда использовать типы, а когда интерфейсы?

**Ответ:**

**Используйте типы (type aliases):**
- Для объединений и пересечений типов
- Для примитивов и их комбинаций
- Когда нужно создать псевдоним для сложного типа
- Для объявления кортежей

**Используйте интерфейсы:**
- Для объектных форм
- Когда предполагается расширение (declaration merging)
- При работе с классами и наследованием
- Для определения форм API
- В большинстве случаев, когда определяете объект

```ts
// Типы подходят для объединений
type Status = 'active' | 'inactive';
type Permission = 'read' | 'write' | 'admin';

// Интерфейсы для объектов
interface User {
  name: string;
  age: number;
}
```

---

## 19. Основные и расширенные типы TS, утилиты, способы управления типами, продвинутые паттерны

**Вопрос:** Перечислите основные типы TS, расширенные типы, утилиты для типов, способы управления типами и продвинутые паттерны.

**Ответ:**

### Основные типы:
- `string`, `number`, `boolean`
- `null`, `undefined`
- `symbol`, `bigint`
- `object`, `Array`, `Function`

### Расширенные типы:
- `any`, `unknown`, `void`, `never`
- Объединения (`|`), пересечения (`&`)
- Литеральные типы
- Типы шаблонов (template literal types)

### Утилиты для типов:
- `Partial<T>`, `Required<T>`, `Readonly<T>`
- `Pick<T, K>`, `Omit<T, K>`
- `Record<K, T>`, `Exclude<T, U>`, `Extract<T, U>`
- `NonNullable<T>`, `Parameters<T>`, `ReturnType<T>`

### Способы управления типами:
- Утверждения типов (`as`, `<Type>`)
- Защиты типов (type guards)
- Дискриминированные объединения
- Кастомные защитники типов

### Продвинутые паттерны:
- Паттерны типов (conditional types)
- Извлечение и распределение типов
- Рекурсивные типы
- Mapped types
- Дженерики

---

## 20. Утилита Exclude - пример использования

**Вопрос:** Для чего утилита Exclude? Приведите пример.

**Ответ:** Утилита `Exclude<T, U>` исключает из `T` все типы, которые присутствуют в `U`.

```ts
type T0 = Exclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'
type T1 = Exclude<'a' | 'b' | 'c', 'a' | 'b'>;   // 'c'
type T2 = Exclude<string | number | (() => void), Function>;  // string | number

// Практический пример
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = Pick<Todo, Exclude<keyof Todo, 'completed'>>;
// Результат: { title: string; description: string; }
```

---

## 21. Утилита Extract - пример использования

**Вопрос:** Для чего утилита Extract? Приведите пример.

**Ответ:** Утилита `Extract<T, U>` извлекает из `T` все типы, которые присутствуют в `U`.

```ts
type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'>;   // 'a'
type T1 = Extract<string | number | (() => void), Function>;  // () => void
type T2 = Extract<'a' | 'b' | 'c', 'd'>;         // never

// Практический пример
type EventNames = 'click' | 'scroll' | 'mousemove';
type MouseEvents = 'click' | 'mousemove';

type SelectedEvents = Extract<EventNames, MouseEvents>;
// Результат: 'click' | 'mousemove'
```

---

## 22. Утилита Omit - пример использования

**Вопрос:** Для чего утилита Omit? Приведите пример.

**Ответ:** Утилита `Omit<T, K>` создает тип, исключая из `T` определенные свойства `K`.

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
}

// Сделать новый тип без completed и createdAt
type TodoPreview = Omit<Todo, 'completed' | 'createdAt'>;
// Результат: { title: string; description: string; }

// Практический пример: создание формы обновления данных
type TodoUpdate = Omit<Todo, 'createdAt'>;  // Не нужно обновлять дату создания
```

---

## 23. Утилита NonNullable - пример использования

**Вопрос:** Для чего утилита NonNullable? Приведите пример.

**Ответ:** Утилита `NonNullable<T>` исключает `null` и `undefined` из типа `T`.

```ts
type T0 = NonNullable<string | number | undefined>;  // string | number
type T1 = NonNullable<string[] | null | undefined>;  // string[]
type T2 = NonNullable<undefined>;                    // never

// Практический пример
function processValue<T>(value: NonNullable<T>) {
  // value гарантированно не null и не undefined
  return value;
}

// processValue(undefined);  // Ошибка!
processValue('hello');  // OK
processValue(42);       // OK
```

---

## 24. Когда использовать типы, а когда интерфейсы

**Вопрос:** Когда использовать типы, а когда интерфейсы?

**Ответ:** (То же, что и вопрос 18, но с более подробной информацией)

Вот краткое практическое руководство:

1. **Используйте интерфейсы по умолчанию** для объектных форм
2. **Используйте типы**, когда:
   - Нужны объединения: `type Position = 'top' | 'bottom'`
   - Нужны пересечения: `type Mix = A & B`
   - Нужны кортежи: `type Pair = [string, number]`
   - Нужен псевдоним для сложного типа: `type Callback = (data: string) => void`

3. **Интерфейсы предпочтительнее**, когда:
   - Определяете форму API
   - Ожидаете расширения в будущем (declaration merging)
   - Работаете с классами (implements)
   - Хотите получить более понятные сообщения об ошибках

```ts
// Интерфейс для формы API
interface ApiResponse {
  status: number;
  data: string;
}

// Type для объединения
type Status = 'success' | 'error' | 'loading';
```

</content>