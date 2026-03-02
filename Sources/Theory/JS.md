# JavaScript Interview Theory Guide

## Table of Contents
1. [Data Types and Values](#data-types-and-values)
2. [Functions](#functions)
3. [DOM and Events](#dom-and-events)
4. [Objects and Prototypes](#objects-and-prototypes)
5. [Variables and Scope](#variables-and-scope)
6. [Arrays and Methods](#arrays-and-methods)
7. [ES6+ Features](#es6-features)
8. [Operators](#operators)
9. [Asynchronous JavaScript](#asynchronous-javascript)
10. [Design Patterns and Principles](#design-patterns-and-principles)
11. [Web APIs and Storage](#web-apis-and-storage)
12. [Advanced Concepts](#advanced-concepts)

---

## Data Types and Values

### 1. Какие значения являются falsy значениями
**Ответ:** Falsy значения - это значения, которые при приведении к логическому типу становятся false. В JavaScript их 6:
- `false` - логическое значение false
- `0` - ноль
- `-0` - отрицательный ноль
- `0n` - BigInt, нулевое значение
- `""` или `''` или `` - пустая строка
- `null` - отсутствие значения
- `undefined` - неопределенное значение
- `NaN` - не число

```javascript
// Примеры
if (!false) console.log("false - falsy"); // Выведет
if (!0) console.log("0 - falsy"); // Выведет
if (!"") console.log('"" - falsy'); // Выведет
if (!null) console.log("null - falsy"); // Выведет
```

### 2. Что возвращает typeof null возвращают ?
**Ответ:** `typeof null` возвращает `"object"`. Это ошибка в языке, существующая с первых версий JavaScript.

```javascript
console.log(typeof null); // "object"
// Правильная проверка на null:
if (value === null) {
  // код
}
```

### 3. null vs undefined vs undeclared
**Ответ:**
- `null` - специальное значение, которое представляет "ничего", "пусто" или "значение неизвестно". Это присваиваемое значение.
- `undefined` - значение по умолчанию для переменных, которым не присвоено значение.
- `undeclared` - переменные, которые не были объявлены в области видимости.

```javascript
let a; // undefined
let b = null; // null
console.log(a); // undefined
console.log(b); // null
// console.log(c); // ReferenceError: c is not defined (undeclared)
```

### 4. Какие типы данных знаешь
**Ответ:** JavaScript имеет 8 типов данных:
- **Примитивы:**
  - `number` - числа (включая Infinity и NaN)
  - `string` - строки
  - `boolean` - логические значения (true/false)
  - `undefined` - неопределенное значение
  - `null` - "ничего" или "пустое"
  - `symbol` - уникальные идентификаторы (ES6+)
  - `bigint` - длинные целые числа (ES2020+)
- **Объекты:**
  - `object` - объекты, включая массивы, функции, даты и т.д.

### 5. Почему результатом сравнения двух обьектов похожих будет false и как это исправить
**Ответ:** Объекты сравниваются по ссылке, а не по значению. Два разных объекта с одинаковыми свойствами не равны.

```javascript
let obj1 = {a: 1};
let obj2 = {a: 1};
console.log(obj1 == obj2); // false
console.log(obj1 === obj2); // false

// Для глубокого сравнения можно использовать:
// 1. JSON.stringify (с ограничениями)
console.log(JSON.stringify(obj1) === JSON.stringify(obj2)); // true

// 2. Lodash
// _.isEqual(obj1, obj2)

// 3. Рекурсивная функция для глубокого сравнения
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  let keys1 = Object.keys(obj1);
  let keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}
```

---

## Functions

### 6. Function expression vs function declaration vs стрелочная функция
**Ответ:**

**Function Declaration** - объявление функции:
```javascript
// Поднимается (hoisting) и может быть вызвана до объявления
function myFunction() {
  return "Hello";
}
```

**Function Expression** - функциональное выражение:
```javascript
// Не поднимается, может быть вызвана только после объявления
const myFunction = function() {
  return "Hello";
};
```

**Arrow Function** - стрелочная функция:
```javascript
// Не имеет своего контекста this
const myFunction = () => {
  return "Hello";
};
// Или короткая форма:
const myFunction = () => "Hello";
```

**Различия:**
- Function Declaration поднимается (hoisting)
- Arrow functions не имеют собственного `this`, `arguments`, `super`, `new.target`
- Arrow functions не могут быть использованы как конструкторы (с `new`)
- Function Declaration имеет имя, Function Expression может быть анонимной

### 7. Что такое каррирование
**Ответ:** Каррирование - это техника преобразования функции с несколькими аргументами в последовательность вложенных функций, каждая из которых принимает один аргумент.

```javascript
// Обычная функция
function multiply(a, b, c) {
  return a * b * c;
}

// Каррированная функция
function multiplyCurried(a) {
  return function(b) {
    return function(c) {
      return a * b * c;
    };
  };
}

// Использование
console.log(multiply(2, 3, 4)); // 24
console.log(multiplyCurried(2)(3)(4)); // 24

// Стрелочная каррированная функция
const multiplyArrow = a => b => c => a * b * c;
console.log(multiplyArrow(2)(3)(4)); // 24
```

### 8. Что такое чистая функция и приведи пример
**Ответ:** Чистая функция - это функция которая:
1. При одинаковых входных данных всегда возвращает одинаковый результат
2. Не имеет побочных эффектов (не изменяет внешнее состояние)
3. Не зависит от внешнего состояния

```javascript
// Чистая функция
function add(a, b) {
  return a + b;
}

// Не чистая функция (зависит от внешнего состояния)
let x = 5;
function addImpure(a) {
  return a + x; // зависит от глобальной переменной x
}

// Не чистая функция (имеет побочный эффект)
function logAndAdd(a, b) {
  console.log("Сложение", a, b); // побочный эффект
  return a + b;
}
```

### 9. Что такое тернарный оператор
**Ответ:** Тернарный оператор - это оператор, который принимает три операнда: условие, выражение для случая true и выражение для случая false. Это сокращенная форма if-else.

```javascript
// Синтаксис: условие ? выражение_если_true : выражение_если_false
let age = 18;
let status = (age >= 18) ? "совершеннолетний" : "несовершеннолетний";

// Эквивалентный if-else блок:
if (age >= 18) {
  status = "совершеннолетний";
} else {
  status = "несовершеннолетний";
}
```

### 10. Типы функций (10 видов)
**Ответ:** В JavaScript есть следующие типы функций:
1. Function Declaration
2. Function Expression
3. Arrow Function
4. Anonymous Function (анонимная функция)
5. Named Function (именованная функция)
6. Constructor Function (функция-конструктор)
7. IIFE (Immediately Invoked Function Expression)
8. Generator Function (функция-генератор)
9. Async Function (асинхронная функция)
10. Callback Function (функция обратного вызова)

### 11. Функции-генераторы
**Ответ:** Генераторы - это специальный тип функций, которые могут приостанавливать выполнение и возвращать промежуточные результаты с помощью ключевого слова `yield`.

```javascript
function* myGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = myGenerator();
console.log(gen.next()); // {value: 1, done: false}
console.log(gen.next()); // {value: 2, done: false}
console.log(gen.next()); // {value: 3, done: false}
console.log(gen.next()); // {value: undefined, done: true}

// Пример с передачей значений
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

for (let num of range(1, 5)) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

### 12. Принимают или возращают [1,2,3].map(?) ? [1,2,3].filter(?) ? [1,2,3].some(?) ? [1,2,3].every(?) ? [1,2,3].includes(?) ?
**Ответ:**
- `[1,2,3].map(?)` - принимает **callback-функцию**, возвращает **новый массив**
- `[1,2,3].filter(?)` - принимает **callback-функцию**, возвращает **новый массив**
- `[1,2,3].some(?)` - принимает **callback-функцию**, возвращает **boolean**
- `[1,2,3].every(?)` - принимает **callback-функцию**, возвращает **boolean**
- `[1,2,3].includes(?)` - принимает **значение для поиска**, возвращает **boolean**

```javascript
// Примеры:
[1,2,3].map(x => x * 2); // [2,4,6] - callback-функцию, возвращает новый массив
[1,2,3].filter(x => x > 1); // [2,3] - callback-функцию, возвращает новый массив
[1,2,3].some(x => x > 2); // true - callback-функцию, возвращает boolean
[1,2,3].every(x => x > 0); // true - callback-функцию, возвращает boolean
[1,2,3].includes(2); // true - значение для поиска, возвращает boolean
```

### 13. this как работает в js
**Ответ:** Контекст `this` зависит от того, как вызывается функция:
1. В обычной функции - зависит от места вызова
2. В методе объекта - ссылается на объект
3. В стрелочной функции - наследует контекст от внешней функции
4. При вызове с `call`, `apply`, `bind` - явно указывается

```javascript
const obj = {
  name: "John",
  greet: function() {
    console.log(this.name); // "John"
  },
  arrow: () => {
    console.log(this.name); // undefined (this из глобального контекста)
  }
};

obj.greet(); // "John"
obj.arrow(); // undefined

// Явное указание this
function sayName() {
  console.log(this.name);
}
const person = { name: "Alice" };
sayName.call(person); // "Alice"
sayName.apply(person); // "Alice"
const boundSayName = sayName.bind(person);
boundSayName(); // "Alice"
```

### 14. Что такое IIFE?
**Ответ:** IIFE (Immediately Invoked Function Expression) - это функция, которая выполняется сразу после определения. Используется для изоляции области видимости.

```javascript
// Синтаксис IIFE
(function() {
  console.log("IIFE выполнена!");
})();

// Или с ES6:
(() => {
  console.log("IIFE со стрелочной функцией");
})();

// Часто используется для изоляции переменных:
(function() {
  var localVar = "private";
  // localVar не доступна снаружи
})();
```

### 15. function.prototype.apply function.prototype.call
**Ответ:** Оба метода используются для вызова функции с указанным контекстом:
- `call(thisArg, arg1, arg2, ...)` - передает аргументы по отдельности
- `apply(thisArg, [argsArray])` - передает аргументы в виде массива

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: "Bob" };

// call
greet.call(person, "Hello", "!"); // "Hello, Bob!"

// apply
greet.apply(person, ["Hello", "!"]); // "Hello, Bob!"

// bind создает новую функцию с привязанным контекстом
const boundGreet = greet.bind(person);
boundGreet("Hi", "."); // "Hi, Bob!"
```

### 16. Для чего используется оператор "||"?
**Ответ:** Оператор `||` (логическое ИЛИ) возвращает первый истинный операнд или последний, если все ложные. Часто используется для установки значений по умолчанию.

```javascript
// Логическая операция
console.log(true || false); // true
console.log(false || false); // false

// Установка значений по умолчанию
function greet(name) {
  name = name || "гость";
  console.log("Привет, " + name);
}
greet(); // "Привет, гость"
greet("Иван"); // "Привет, Иван"

// Возвращение первого истинного значения
console.log(0 || 5 || 10); // 5
console.log(null || undefined || "default"); // "default"
```

### 17. Для чего используется оператор "!!"?
**Ответ:** Двойное отрицание `!!` используется для приведения значения к логическому типу.

```javascript
console.log(!!"hello"); // true
console.log(!!""); // false
console.log(!!1); // true
console.log(!!0); // false
console.log(!!{}); // true
console.log(!!null); // false
console.log(!!undefined); // false

// Аналог Boolean()
console.log(Boolean("hello")); // true
console.log(Boolean(0)); // false
```

### 18. В чем отличие .forEach() и .map()
**Ответ:**
- `forEach()` - перебирает массив, не возвращает новый массив, используется для выполнения побочных эффектов
- `map()` - возвращает новый массив с результатами вызова callback для каждого элемента

```javascript
const numbers = [1, 2, 3];

// forEach - не возвращает ничего (undefined)
const forEachResult = numbers.forEach(num => console.log(num * 2));
// Выводит: 2, 4, 6
console.log(forEachResult); // undefined

// map - возвращает новый массив
const mapResult = numbers.map(num => num * 2);
console.log(mapResult); // [2, 4, 6]
```

### 19. Функция высшего порядка что такое и разбор компонента высшего порядка
**Ответ:** Функция высшего порядка (HOF) - это функция, которая принимает другую функцию в качестве аргумента или возвращает функцию.

```javascript
// Функция высшего порядка
function higherOrderFunction(callback) {
  return function() {
    console.log("Выполняется HOF");
    callback();
  };
}

// Примеры HOF в массивах
[1, 2, 3].map(x => x * 2); // map - HOF (принимает callback)
[1, 2, 3].filter(x => x > 1); // filter - HOF (принимает callback)

// Компонент высшего порядка (HOC) в React
function withLogger(WrappedComponent) {
  return function(props) {
    console.log("Props:", props);
    return <WrappedComponent {...props} />;
  };
}
```

---

## DOM and Events

### 20. Что такое DOM
**Ответ:** DOM (Document Object Model) - это программный интерфейс для HTML и XML документов. Он представляет документ как древовидную структуру узлов и объектов, позволяя программам изменять структуру, стиль и содержимое документа.

```javascript
// Пример работы с DOM
const element = document.getElementById("myElement");
element.style.color = "red";
element.textContent = "Новый текст";
```

### 21. Какие есть фазы в жизни события
**Ответ:** Событие проходит через три фазы:
1. **Capture phase (фаза захвата)** - событие движется от корня документа к элементу-цели
2. **Target phase (фаза цели)** - событие достигает элемента-цели
3. **Bubble phase (фаза всплытия)** - событие движется от элемента-цели обратно к корню документа

```javascript
// Регистрация обработчика для фазы захвата (третий параметр true)
element.addEventListener("click", handler, true); // capture phase
element.addEventListener("click", handler, false); // bubble phase (по умолчанию)
```

### 22. Что такое Event.target
**Ответ:** `Event.target` - это свойство события, которое ссылается на элемент, который первоначально вызвал событие (элемент, на котором произошло событие). В отличие от `this`, который ссылается на элемент, к которому прикреплён обработчик.

```javascript
document.addEventListener('click', function(e) {
  console.log(e.target); // элемент, который был кликнут
  console.log(this); // элемент, к которому прикреплён обработчик
});
```

### 23. e.preventDefault() и e.stopPropagation()
**Ответ:**
- `e.preventDefault()` - отменяет стандартное поведение элемента (например, переход по ссылке, отправка формы)
- `e.stopPropagation()` - останавливает всплытие события, предотвращая вызов обработчиков на родительских элементах

```javascript
// Отмена стандартного поведения
document.getElementById('myForm').addEventListener('submit', function(e) {
  e.preventDefault(); // форма не будет отправлена
  console.log("Форма отправлена без перезагрузки страницы");
});

// Остановка всплытия
document.getElementById('child').addEventListener('click', function(e) {
  e.stopPropagation(); // событие не всплывет к родителю
  console.log("Клик на дочернем элементе");
});
```

### 24. div в dive, когда кликнул на вложенный что будет (маржинов паддингов нет)
**Ответ:** При клике на вложенный div будет происходить всплытие событий (event bubbling). Сначала событие будет обработано вложенным div, затем всплывет к родительскому div, если для него тоже есть обработчик.

```html
<div id="parent">
  Родительский DIV
  <div id="child">Дочерний DIV</div>
</div>
```

```javascript
document.getElementById('child').addEventListener('click', () => {
  console.log('Клик на дочернем div');
});

document.getElementById('parent').addEventListener('click', () => {
  console.log('Клик на родительском div');
});

// При клике на дочернем div будет выведено:
// 1. "Клик на дочернем div"
// 2. "Клик на родительском div" - из-за всплытия
```

### 25. Типы узлов DOM
**Ответ:** Основные типы узлов DOM:
- `Node.ELEMENT_NODE` (1) - элементы HTML
- `Node.TEXT_NODE` (3) - текстовые узлы
- `Node.COMMENT_NODE` (8) - комментарии
- `Node.DOCUMENT_NODE` (9) - документ
- `Node.DOCUMENT_FRAGMENT_NODE` (11) - фрагмент документа

```javascript
const element = document.body;
console.log(element.nodeType); // 1 (ELEMENT_NODE)

const textNode = document.createTextNode("Привет");
console.log(textNode.nodeType); // 3 (TEXT_NODE)
```

---

## Objects and Prototypes

### 26. Как создать обьект без прототипа
**Ответ:** Используйте `Object.create(null)` или `Object.setPrototypeOf({}, null)`.

```javascript
// Создание объекта без прототипа
const obj = Object.create(null);
console.log(obj.__proto__); // undefined
console.log(obj.toString); // undefined

// Обычный объект имеет прототип
const normalObj = {};
console.log(normalObj.__proto__); // [Object: null prototype] {}
console.log(normalObj.toString); // [Function: toString]
```

### 27. Как в JS создать обьект? (три способа)
**Ответ:**
1. Литерал объекта: `const obj = {}`
2. Функция-конструктор: `const obj = new Object()`
3. Object.create(): `const obj = Object.create(null)` или `Object.create(proto)`

```javascript
// 1. Литерал
const obj1 = { name: "John" };

// 2. Конструктор
const obj2 = new Object();
obj2.name = "John";

// 3. Object.create
const obj3 = Object.create(null);
obj3.name = "John";
```

### 28. Какие способы создания обьекта вы знаете (5 штук)
**Ответ:**
1. Литерал объекта: `const obj = {}`
2. Функция-конструктор: `const obj = new Object()`
3. Object.create(): `const obj = Object.create(proto)`
4. Классы (ES6): `class MyClass {}; const obj = new MyClass()`
5. Фабричная функция: `function createObj() { return {}; }`

```javascript
// 1. Литерал
const obj1 = { name: "John" };

// 2. Конструктор
const obj2 = new Object({ name: "John" });

// 3. Object.create
const obj3 = Object.create(Object.prototype, { name: { value: "John" } });

// 4. Классы
class Person {
  constructor(name) {
    this.name = name;
  }
}
const obj4 = new Person("John");

// 5. Фабричная функция
function createPerson(name) {
  return {
    name: name,
    greet: function() {
      return `Hello, ${this.name}`;
    }
  };
}
const obj5 = createPerson("John");
```

### 29. Как проверять является ли обьект массивом
**Ответ:** Лучший способ - `Array.isArray()`, также можно использовать `Object.prototype.toString.call()`.

```javascript
const arr = [1, 2, 3];
const obj = {};

// Способ 1 (рекомендуемый)
console.log(Array.isArray(arr)); // true
console.log(Array.isArray(obj)); // false

// Способ 2
console.log(Object.prototype.toString.call(arr)); // "[object Array]"
console.log(Object.prototype.toString.call(obj)); // "[object Object]"

// Способ 3 (менее надежный)
console.log(arr instanceof Array); // true (но может не работать в разных контекстах)
```

### 30. hasOwnProperty
**Ответ:** `hasOwnProperty` проверяет, содержит ли объект указанное свойство напрямую (не унаследованное).

```javascript
const obj = { name: "John" };
console.log(obj.hasOwnProperty("name")); // true
console.log(obj.hasOwnProperty("toString")); // false (унаследовано от Object.prototype)

// Современный способ (рекомендуемый)
console.log(Object.hasOwn(obj, "name")); // true
console.log(Object.hasOwn(obj, "toString")); // false
```

### 31. Разница между in и .hasOwnProperty()
**Ответ:**
- `hasOwnProperty` проверяет только собственные свойства объекта
- `in` проверяет как собственные, так и унаследованные свойства

```javascript
const parent = { parentProp: "parent" };
const child = Object.create(parent);
child.childProp = "child";

// hasOwnProperty
console.log(child.hasOwnProperty("childProp")); // true
console.log(child.hasOwnProperty("parentProp")); // false

// in operator
console.log("childProp" in child); // true
console.log("parentProp" in child); // true
```

### 32. Что такое замыкание
**Ответ:** Замыкание - это комбинация функции и лексического окружения, в котором эта функция была объявлена. Функция имеет доступ к переменным внешней функции даже после возврата внешней функции.

```javascript
function outerFunction(x) {
  return function innerFunction(y) {
    return x + y; // innerFunction имеет доступ к x из внешней области
  };
}

const add5 = outerFunction(5);
console.log(add5(3)); // 8

// Практический пример - приватные переменные
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
```

### 33. в чём разница __proto__ и prototype
**Ответ:**
- `__proto__` - это свойство, которое указывает на прототип объекта (для наследования)
- `prototype` - это свойство функции-конструктора, которое используется для создания `__proto__` у создаваемых объектов

```javascript
function Person(name) {
  this.name = name;
}

// prototype - свойство функции-конструктора
Person.prototype.greet = function() {
  return `Hello, ${this.name}`;
};

const person = new Person("John");

// __proto__ - свойство созданного объекта
console.log(person.__proto__ === Person.prototype); // true
console.log(person.greet()); // "Hello, John"
```

### 34. Что такое классы
**Ответ:** Классы - это синтаксический сахар для работы с прототипным наследованием в JavaScript (введены в ES6). Они не являются самостоятельной парадигмой, а просто удобным способом создания конструкторов.

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  greet() {
    return `Hello, I'm ${this.name}`;
  }
  
  static species() {
    return "Homo sapiens";
  }
}

class Student extends Person {
  constructor(name, age, grade) {
    super(name, age); // вызов родительского конструктора
    this.grade = grade;
  }
  
  study() {
    return `${this.name} is studying`;
  }
}

const student = new Student("Alice", 20, "A");
console.log(student.greet()); // "Hello, I'm Alice"
console.log(Student.species()); // "Homo sapiens"
```

---

## Variables and Scope

### 35. var vs let vs const
**Ответ:**
- `var` - имеет функциональную область видимости, поднимается (hoisting), может быть переопределена
- `let` - имеет блочную область видимости, поднимается но не инициализируется до объявления
- `const` - имеет блочную область видимости, поднимается но не инициализируется, не может быть переопределена

```javascript
function example() {
  console.log(a); // undefined из-за hoisting
  // console.log(b); // ReferenceError
  // console.log(c); // ReferenceError
  
  var a = 1;
  let b = 2;
  const c = 3;
  
  if (true) {
    var x = 1; // видна за пределами блока
    let y = 2; // видна только внутри блока
    const z = 3; // видна только внутри блока
  }
  
  console.log(x); // 1
  // console.log(y); // ReferenceError
  // console.log(z); // ReferenceError
}
```

### 36. поднятие (хотсинг) расскажи
**Ответ:** Поднятие (hoisting) - это механизм в JavaScript, при котором объявления переменных и функций перемещаются в начало своей области видимости во время компиляции.

```javascript
// Объявления функций поднимаются полностью
console.log(hoistedFunc()); // "I'm hoisted"

function hoistedFunc() {
  return "I'm hoisted";
}

// var переменные поднимаются с undefined
console.log(x); // undefined
var x = 5;
console.log(x); // 5

// let и const поднимаются, но не инициализируются (Temporal Dead Zone)
// console.log(y); // ReferenceError
let y = 10;

// Объявления функций поднимаются, но выражения нет
// hoistedExpr(); // TypeError
var hoistedExpr = function() {
  return "I'm not hoisted as a function";
};
```

### 37. Что такое деструктуризация
**Ответ:** Деструктуризация позволяет извлекать значения из объектов и массивов в отдельные переменные.

```javascript
// Деструктуризация массива
const arr = [1, 2, 3];
const [a, b, c] = arr;
console.log(a, b, c); // 1 2 3

// Деструктуризация объекта
const obj = { name: "John", age: 30, city: "NYC" };
const { name, age } = obj;
console.log(name, age); // "John" 30

// С переименованием и значениями по умолчанию
const { name: personName, country = "USA" } = obj;
console.log(personName, country); // "John" "USA"

// Вложенные объекты
const nested = { user: { name: "Alice", details: { age: 25 } } };
const { user: { name: userName, details: { age: userAge } } } = nested;
console.log(userName, userAge); // "Alice" 25
```

### 38. Что такое arguments
**Ответ:** `arguments` - это псевдомассив, содержащий все аргументы, переданные в функцию. Доступен только в функциях, объявленных с помощью function keyword (не в стрелочных функциях).

```javascript
function example(a, b) {
  console.log(arguments); // Arguments(3) [1, 2, 3, callee: f, Symbol(Symbol.iterator): f]
  console.log(arguments[0]); // 1
  console.log(arguments[2]); // 3
  
  // arguments не является массивом
  console.log(Array.isArray(arguments)); // false
  
  // Преобразование к массиву
  const argsArray = Array.from(arguments);
  const argsArray2 = [...arguments];
  console.log(Array.isArray(argsArray)); // true
}

example(1, 2, 3);

// Стрелочная функция не имеет arguments
const arrowFunc = () => {
  // console.log(arguments); // ReferenceError
};
```

---

## Arrays and Methods

### 39. push() inshift()
**Ответ:**
- `push()` - добавляет элементы в конец массива, возвращает новую длину
- `unshift()` - добавляет элементы в начало массива, возвращает новую длину

```javascript
let arr = [2, 3, 4];

// push - добавляет в конец
let newLength = arr.push(5);
console.log(arr); // [2, 3, 4, 5]
console.log(newLength); // 4

// unshift - добавляет в начало
newLength = arr.unshift(1);
console.log(arr); // [1, 2, 3, 4, 5]
console.log(newLength); // 5
```

### 40. Принимают или возвращают [1,2,3].unshift(?) ? [1,2,3].slice(?) ? [1,2,3].splice(?) ?
**Ответ:**
- `[1,2,3].unshift(?)` - принимает **элементы для добавления**, возвращает **новую длину массива**
- `[1,2,3].slice(?)` - принимает **индексы начала и конца**, возвращает **новый массив**
- `[1,2,3].splice(?)` - принимает **индекс, количество элементов и новые элементы**, возвращает **удаленные элементы**

```javascript
const arr = [1, 2, 3];

// unshift - принимает элементы, возвращает длину
const newLength = arr.unshift(0); // [0, 1, 2, 3], возвращает 4

// slice - принимает индексы, возвращает новый массив
const sliced = [1, 2, 3].slice(1, 3); // [2, 3]

// splice - принимает индекс, кол-во, новые элементы, возвращает удаленные
const original = [1, 2, 3, 4];
const removed = original.splice(1, 2, 'a', 'b'); // removed = [2, 3], original = [1, 'a', 'b', 4]
```

### 41. Принимают или возращают Object.create(?) ? Object.assign(?) ? Object.prototype.hasOwnProperty(?) ?
**Ответ:**
- `Object.create(?)` - принимает **прототип** и **дескрипторы свойств**, возвращает **новый объект**
- `Object.assign(?)` - принимает **целевой объект и один или несколько исходных**, возвращает **целевой объект**
- `Object.prototype.hasOwnProperty(?)` - принимает **имя свойства**, возвращает **boolean**

```javascript
// Object.create
const obj = Object.create({ parent: true }, {
  prop: { value: 'value', writable: true }
});

// Object.assign
const target = { a: 1 };
const source = { b: 2 };
const result = Object.assign(target, source); // target = {a: 1, b: 2}, result === target

// hasOwnProperty
const exampleObj = { prop: 'value' };
const hasProp = exampleObj.hasOwnProperty('prop'); // true
```

### 42. разница между .push(),.pop(),.shift() и .unshift()
**Ответ:**
- `push()` - добавляет элементы в **конец** массива
- `pop()` - удаляет **последний** элемент массива
- `shift()` - удаляет **первый** элемент массива
- `unshift()` - добавляет элементы в **начало** массива

```javascript
let arr = [2, 3];

arr.push(4); // [2, 3, 4] - добавляет в конец
let popped = arr.pop(); // [2, 3], popped = 4 - удаляет с конца
arr.unshift(1); // [1, 2, 3] - добавляет в начало
let shifted = arr.shift(); // [2, 3], shifted = 1 - удаляет с начала
```

---

## ES6+ Features

### 43. Что было введено в ES6? Основные компоненты
**Ответ:** В ES6 (ES2015) было введено множество важных возможностей:
- let и const
- Стрелочные функции
- Классы
- Модули
- Деструктуризация
- Spread и Rest операторы
- Template literals
- Promise
- Default, rest и spread параметры
- for...of цикл
- Map и Set
- Proxy
- Symbol
- Generator
- Module export/import

### 44. спрэд vs рэст операторы
**Ответ:**
- **Spread** (`...`) - распределяет элементы массива/объекта
- **Rest** (`...`) - собирает элементы в массив/объект

```javascript
// Spread - распределение
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// Rest - сбор
function sum(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}
console.log(sum(1, 2, 3, 4)); // 10

const [first, ...rest] = [1, 2, 3, 4];
console.log(first); // 1
console.log(rest); // [2, 3, 4]
```

---

## Operators

### 45. Что можете рассказать про эти операторы
```
1) ?.
2) ...
3) ??
4) IF
5) &&=
6) `${foo}`
7) structuredClone(value: bar)
8) someArray.at()
```

**Ответ:**

1. **?. (Optional Chaining)** - безопасное обращение к вложенным свойствам
2. **... (Spread/Rest)** - распределение/сбор элементов
3. **?? (Nullish Coalescing)** - возвращает правый операнд если левый null или undefined
4. **if (условие)** - условный оператор (не оператор, выражение)
5. **&&= (Logical AND Assignment)** - присваивание с логическим И
6. **`${foo}` (Template Literal)** - шаблонная строка
7. **structuredClone()** - глубокое клонирование объектов
8. **.at()** - доступ к элементу массива с поддержкой отрицательных индексов

```javascript
// 1. Optional Chaining
const user = { profile: { name: "John" } };
console.log(user?.profile?.name); // "John"
console.log(user?.unknown?.prop); // undefined (без ошибки)

// 2. Spread
const arr = [1, 2, ...[3, 4, 5]];

// 3. Nullish Coalescing
console.log(null ?? "default"); // "default"
console.log(undefined ?? "default"); // "default"
console.log(0 ?? "default"); // 0 (0 не null/undefined)

// 4. if - условие, не оператор
if (condition) {
  // код
}

// 5. Logical AND Assignment
let x = 5;
x &&= 10; // x = x && 10 = 10
let y = 0;
y &&= 20; // y = y && 20 = 0

// 6. Template Literal
const name = "John";
const greeting = `Hello, ${name}!`;

// 7. structuredClone
const original = { a: { b: 1 } };
const cloned = structuredClone(original);
cloned.a.b = 2;
console.log(original.a.b); // 1 (не изменилось)

// 8. at() method
const arr2 = [10, 20, 30];
console.log(arr2.at(0)); // 10
console.log(arr2.at(-1)); // 30 (последний элемент)
```

### 46. Для чего используется оператор "&&"?
**Ответ:** Оператор `&&` (логическое И) возвращает первый ложный операнд или последний, если все истинные. Часто используется для выполнения кода при выполнении условия.

```javascript
// Логическая операция
console.log(true && false); // false
console.log(true && true); // true

// Условное выполнение
const user = { authenticated: true };
user.authenticated && console.log("Пользователь аутентифицирован");

// Проверка свойства перед использованием
const obj = { user: { name: "John" } };
obj.user && obj.user.name && console.log(obj.user.name);

// Short-circuit evaluation
function doSomething() {
  console.log("Функция выполнена");
  return true;
}

false && doSomething(); // doSomething() не вызывается
true && doSomething(); // doSomething() вызывается
```

---

## Asynchronous JavaScript

### 47. Что такое промисы
**Ответ:** Promise (промис) - это объект, представляющий завершение или ошибку асинхронной операции. У промиса есть три состояния:
- `pending` - начальное состояние
- `fulfilled` - успешно выполнено
- `rejected` - выполнено с ошибкой

```javascript
// Создание промиса
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      resolve("Успех!");
    } else {
      reject("Ошибка!");
    }
  }, 1000);
});

// Использование промиса
promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
  .finally(() => console.log("Завершено"));

// Пример с fetch
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Ошибка:', error));
```

### 48. async/await расскажи
**Ответ:** `async/await` - это синтаксический сахар для работы с промисами, который позволяет писать асинхронный код синхронно.

```javascript
// async функция всегда возвращает промис
async function asyncFunc() {
  return "Результат";
}

// await можно использовать только внутри async функции
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
}

// Параллельное выполнение
async function fetchMultiple() {
  const [result1, result2] = await Promise.all([
    fetch('https://api1.com'),
    fetch('https://api2.com')
  ]);
  
  return [await result1.json(), await result2.json()];
}
```

### 49. Цикл Event Loop
**Ответ:** Event Loop - это механизм, который позволяет JavaScript быть однопоточным, но при этом обрабатывать асинхронные операции без блокировки выполнения. Он работает следующим образом:
1. Выполняет синхронный код
2. Обрабатывает микротаски (промисы)
3. Выполняет одну макротаску
4. Возвращается к обработке микротасок
5. Повторяет процесс

### 50. что попадает в микротаски а что в макротаски
**Ответ:**
- **Микротаски:**
  - Promise.then/catch/finally
  - queueMicrotask()
  - process.nextTick() (Node.js)

- **Макротаски:**
  - setTimeout/setInterval
  - setImmediate (Node.js)
  - I/O операции
  - DOM события

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Вывод: 1, 4, 3, 2
// Сначала синхронный код: 1, 4
// Потом микротаски: 3
// Потом одна макротаска: 2
```

---

## Design Patterns and Principles

### 51. Расскажите про kiss, dry, yagni
**Ответ:**
Это важные принципы разработки программного обеспечения, которые помогают писать более качественный и поддерживаемый код:

- **KISS (Keep It Simple, Stupid)** - делай проще. Код должен быть максимально простым и понятным.
  - **Принцип:** Избегай излишней сложности, где это возможно
  - **Пример:**
    ```javascript
    // Плохо - излишне сложный подход
    function isEven(number) {
      if(number % 2 === 0) {
        return true;
      } else {
        return false;
      }
    }
    
    // Хорошо - простой и понятный подход
    const isEven = number => number % 2 === 0;
    ```
  - **Преимущества:** Легче читать, отлаживать и поддерживать

- **DRY (Don't Repeat Yourself)** - не повторяйся. Избегай дублирования кода, выноси в функции/модули.
  - **Принцип:** Каждый фрагмент знаний должен иметь единственное, однозначное и авторитетное представление в системе
  - **Пример:**
    ```javascript
    // Плохо - дублирование кода
    function calculateAreaRect(width, height) {
      return width * height;
    }
    
    function calculateSurfaceBox(width, height, depth) {
      return 2 * (width * height + width * depth + height * depth);
    }
    
    // Хорошо - повторное использование
    function multiply(a, b) {
      return a * b;
    }
    
    function calculateAreaRect(width, height) {
      return multiply(width, height);
    }
    
    function calculateSurfaceBox(width, height, depth) {
      const side1 = multiply(width, height);
      const side2 = multiply(width, depth);
      const side3 = multiply(height, depth);
      return 2 * (side1 + side2 + side3);
    }
    ```
  - **Преимущества:** Уменьшает количество кода, облегчает поддержку и обновление

- **YAGNI (You Aren't Gonna Need It)** - тебе это не понадобится. Не добавляй функционал, который пока не нужен.
  - **Принцип:** Реализуй возможности только тогда, когда они действительно необходимы
  - **Пример:**
    ```javascript
    // Плохо - добавление потенциальной функциональности, которая пока не нужна
    class User {
      constructor(name, email) {
        this.name = name;
        this.email = email;
        // Добавляем поля, которые могут понадобиться в будущем
        this.createdAt = null;
        this.updatedAt = null;
        this.lastLogin = null;
        this.preferences = {};
        this.permissions = [];
      }
    }
    
    // Хорошо - добавляем только то, что действительно нужно сейчас
    class User {
      constructor(name, email) {
        this.name = name;
        this.email = email;
      }
    }
    ```
  - **Преимущества:** Уменьшает сложность кода, экономит время разработки, избегает ненужной функциональности

Эти принципы тесно связаны и дополняют друг друга, способствуя созданию более чистого, эффективного и поддерживаемого кода.

### 52. функционально кодированье в js основные пункты
**Ответ:** Функциональное программирование в JavaScript включает:
- Использование чистых функций
- Избегание мутаций и изменения состояния
- Использование функций высшего порядка
- Иммутабельность данных
- Каррирование
- Композиция функций
- Работа с массивами через map, filter, reduce

```javascript
// Пример функционального подхода
const numbers = [1, 2, 3, 4, 5];

// Вместо императивного подхода
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    doubled.push(numbers[i] * 2);
  }
}

// Функциональный подход
const doubledFunc = numbers
  .filter(n => n % 2 === 0)
  .map(n => n * 2);
```

---

## Web APIs and Storage

### 53. В чем отличие sessionStorage от LocalStorage (3 пункта)
**Ответ:**
1. **Время жизни:** LocalStorage сохраняется до очистки вручную, sessionStorage очищается при закрытии вкладки/браузера
2. **Домен:** LocalStorage доступен на всем домене, sessionStorage привязан к вкладке/окну
3. **Персистентность:** LocalStorage сохраняется между сеансами, sessionStorage - только в текущей сессии

### 54. Какие методы предоставляет сессионное хранилище
**Ответ:** sessionStorage предоставляет следующие методы:
- `setItem(key, value)` - сохранить пару ключ-значение
- `getItem(key)` - получить значение по ключу
- `removeItem(key)` - удалить пару ключ-значение
- `clear()` - очистить всё хранилище
- `key(index)` - получить ключ по индексу
- `length` - получить количество элементов

```javascript
// Сохранение данных
sessionStorage.setItem('username', 'john');

// Чтение данных
const username = sessionStorage.getItem('username');

// Удаление данных
sessionStorage.removeItem('username');

// Очистка всего хранилища
sessionStorage.clear();
```

### 55. cookie vs localstorage vs sessionstorage vs indexDB
**Ответ:**
- **Cookies:** Отправляются с каждым HTTP-запросом, ограничены по размеру (~4KB), могут иметь срок действия
- **LocalStorage:** Хранит данные локально до очистки, ~5-10MB, синхронный доступ
- **SessionStorage:** Хранит данные до закрытия вкладки, ~5-10MB, привязан к вкладке
- **IndexedDB:** База данных для хранения больших объемов структурированных данных, асинхронный доступ, может хранить объекты, файлы и т.д.

### 56. Расскажи про веб-воркеры и сервис воркеры
**Ответ:**
- **Web Workers:** Выполняют тяжелые вычисления в фоновом потоке, не блокируя UI
- **Service Workers:** Специальный тип воркеров для кэширования, оффлайн-функций, push-уведомлений

```javascript
// Web Worker
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ command: 'calculate', data: largeDataset });
worker.onmessage = function(e) {
  console.log('Результат:', e.data);
};

// worker.js
self.onmessage = function(e) {
  const result = heavyCalculation(e.data);
  self.postMessage(result);
};
```

---

## Advanced Concepts

### 57. map vs set vs weakmap vs weakset
**Ответ:**
- **Map:** Хранит пары ключ-значение, ключом может быть любой тип данных
- **Set:** Хранит уникальные значения любого типа
- **WeakMap:** Как Map, но ключами могут быть только объекты, автоматически очищается сборщиком мусора
- **WeakSet:** Как Set, но значениями могут быть только объекты, автоматически очищается сборщиком мусора

```javascript
// Map
const map = new Map();
map.set('key', 'value');
map.set(obj, 'object value');

// Set
const set = new Set([1, 2, 3, 2]); // [1, 2, 3]

// WeakMap
const weakMap = new WeakMap();
weakMap.set(obj, 'value'); // obj - может быть очищен сборщиком мусора

// WeakSet
const weakSet = new WeakSet();
weakSet.add(obj); // obj - может быть очищен сборщиком мусора
```

### 58. Что представляет из себя чиста функция? Критерии чистоты?
**Ответ:** Чистая функция должна удовлетворять следующим критериям:
1. Всегда возвращает одинаковый результат при одинаковых аргументах
2. Не имеет побочных эффектов (не изменяет внешнее состояние, не взаимодействует с I/O)
3. Не зависит от внешнего состояния (не использует переменные из внешней области видимости)

### 59. Разница между typeOf и InstanceOf
**Ответ:**
- `typeof` - возвращает строку с типом значения
- `instanceof` - проверяет, был ли объект создан конструктором (проверяет цепочку прототипов)

```javascript
// typeof
console.log(typeof "hello"); // "string"
console.log(typeof 42); // "number"
console.log(typeof true); // "boolean"
console.log(typeof {}); // "object"
console.log(typeof null); // "object" (ошибка в JS)

// instanceof
const arr = [1, 2, 3];
console.log(arr instanceof Array); // true
console.log(arr instanceof Object); // true
```

### 60. строгое vs нестрого сравнение
**Ответ:**
- `==` - нестрогое сравнение (с автоматическим приведением типов)
- `===` - строгое сравнение (без приведения типов)

```javascript
// Нестрогое сравнение
console.log(5 == "5"); // true
console.log(true == 1); // true
console.log(null == undefined); // true

// Строгое сравнение
console.log(5 === "5"); // false
console.log(true === 1); // false
console.log(null === undefined); // false
```

### 61. Почему у стрелочной функции нельзя применить call apply bind
**Ответ:** У стрелочных функций нет собственного `this`, `arguments`, `super`, `new.target`. Они наследуют эти значения от внешней функции, поэтому `call`, `apply`, `bind` не могут изменить контекст `this`.

### 62. Какие методы предоставляет сессионное хранилище
**Ответ:** (Дублирует вопрос 54, но вот полный список методов):
- `setItem(key, value)` - сохранить данные
- `getItem(key)` - получить данные
- `removeItem(key)` - удалить данные
- `clear()` - очистить всё хранилище
- `key(index)` - получить ключ по индексу
- `length` - количество элементов

### 63. Перечисли все способы которыми можно перебрать обьект
**Ответ:**
1. `for...in` цикл
2. `Object.keys()`
3. `Object.values()`
4. `Object.entries()`
5. `Object.getOwnPropertyNames()`
6. `Reflect.ownKeys()`

```javascript
const obj = { a: 1, b: 2, c: 3 };

// 1. for...in
for (let key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key, obj[key]);
  }
}

// 2. Object.keys()
Object.keys(obj).forEach(key => console.log(key, obj[key]));

// 3. Object.values()
Object.values(obj).forEach(value => console.log(value));

// 4. Object.entries()
Object.entries(obj).forEach(([key, value]) => console.log(key, value));
```

### 64. как можно спровоцировать эффект полного зависания страницы
**Ответ:** Повесить страницу можно следующими способами:
1. Бесконечный цикл: `while(true) {}`
2. Огромное количество синхронных операций
3. Рекурсия без условия завершения
4. Непрерывный вызов тяжелых функций
5. Блокирующие операции в главном потоке

### 65. Анимация js vs анимации css
**Ответ:**
- **CSS анимации:** Более производительные, используют GPU, проще реализовать простые анимации
- **JS анимации:** Более гибкие, могут реагировать на события, лучше подходят для сложной логики

### 66. Типы таймеров в js
**Ответ:**
- `setTimeout()` - выполнить код один раз через заданное время
- `setInterval()` - выполнить код регулярно с заданным интервалом
- `setImmediate()` - в Node.js, выполнить код в следующем тике
- `requestAnimationFrame()` - для анимаций, синхронизирован с частотой обновления экрана

### 67. Типы обьектов
**Ответ:** В JavaScript есть несколько типов объектов:
- Простые объекты: `{}`
- Массивы: `[]`
- Функции: `function`
- Даты: `Date`
- Ошибки: `Error`
- Регулярные выражения: `RegExp`
- И другие специфичные типы

### 68. Является ли использование унарного плюса самым быстрым способом преобразования строки в число
**Ответ:** Унарный плюс (`+`) - один из самых быстрых способов преобразования строки в число, но он не всегда безопасен (преобразует "abc" в NaN). Для больших объемов данных он действительно быстрее `parseInt` или `parseFloat`.

### 69. Что такое оператор опциональной последовательности (Optional Chaining Operator)
**Ответ:** Оператор `?.` позволяет безопасно обращаться к вложенным свойствам объектов, не вызывая ошибок, если какое-то из промежуточных свойств равно `null` или `undefined`.

```javascript
const user = { profile: { address: { city: "NYC" } } };
console.log(user?.profile?.address?.city); // "NYC"
console.log(user?.unknown?.prop); // undefined (без ошибки)
```

### 70. Какие есть фазы в жизни события
**Ответ:** (Дублирует вопрос 21) Событие проходит через три фазы:
1. Capture phase (фаза захвата) - событие движется от корня к цели
2. Target phase (фаза цели) - событие достигает целевого элемента
3. Bubble phase (фаза всплытия) - событие всплывает обратно к корню