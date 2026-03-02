# JavaScript Quiz Collection - 200+ Interview Code Samples

## 📚 Table of Contents
- [1. Variables and Data Types](#1-variables-and-data-types)
- [2. Functions](#2-functions)
- [3. Scope and Closures](#3-scope-and-closures)
- [4. Objects and Prototypes](#4-objects-and-prototypes)
- [5. Arrays](#5-arrays)
- [6. Hoisting](#6-hoisting)
- [7. Event Loop and Asynchronous Programming](#7-event-loop-and-asynchronous-programming)
- [8. Promises and Async/Await](#8-promises-and-asyncawait)
- [9. This Keyword](#9-this-keyword)
- [10. Classes and Inheritance](#10-classes-and-inheritance)
- [11. Higher-Order Functions](#11-higher-order-functions)
- [12. Destructuring](#12-destructuring)
- [13. Spread and Rest Operators](#13-spread-and-rest-operators)
- [14. ES6+ Features](#14-es6-features)
- [15. Error Handling](#15-error-handling)
- [16. Bind, Call, Apply](#16-bind-call-apply)
- [17. Prototypal Inheritance](#17-prototypal-inheritance)
- [18. Miscellaneous](#18-miscellaneous)

---

## 1. Variables and Data Types

### Q1
```javascript
console.log(typeof undefined);
console.log(typeof null);
```
**Объяснение:** В JavaScript `undefined` — это тип данных, который представляет собой неопределенное значение. `null` — это специальное значение, которое представляет собой "ничего", но, тем не менее, `typeof null` возвращает "object" из-за исторических причин в языке JavaScript.
**Output:**
```
undefined
object
```

### Q2
```javascript
var a = 1;
var b = 2;
var c = 3;
console.log({a, b, c});
```
**Объяснение:** Это пример сокращенного синтаксиса объектного литерала в ES6. Когда имя переменной совпадает с именем свойства, можно использовать сокращенную запись {a} вместо {a: a}.
**Output:**
```
{a: 1, b: 2, c: 3}
```

### Q3
```javascript
let x;
console.log(x);
console.log(y);
var y;
```
**Объяснение:** Переменная `x` объявлена с помощью `let`, но не инициализирована, поэтому она имеет значение `undefined`. Переменная `y` объявлена с помощью `var`, но также не инициализирована. Из-за поднятия (`hoisting`) переменной `var` она существует в начале выполнения функции, но имеет значение `undefined`.
**Output:**
```
undefined
undefined
```

### Q4
```javascript
console.log(1 + "2" + "2");
console.log(1 + +"2" + "2");
console.log("A" - "B" + 2);
```
**Объяснение:** В первом выражении происходит конкатенация строк: 1 преобразуется в строку и соединяется с "2" и "2". Во втором выражении унарный оператор + преобразует "2" в число, поэтому 1 + 2 = 3, затем 3 преобразуется в строку и соединяется с "2". В третьем выражении "A" - "B" возвращает NaN, который затем конкатенируется с "2".
**Output:**
```
122
32
NaN2
```

### Q5
```javascript
console.log(0.1 + 0.2 == 0.3);
console.log(0.1 + 0.2);
```
**Объяснение:** Это знаменитая проблема точности чисел с плавающей запятой в JavaScript (и большинстве языков программирования). Из-за способа представления чисел в двоичном виде, 0.1 + 0.2 не равно в точности 0.3.
**Output:**
```
false
0.30000000000000004
```

### Q6
```javascript
console.log(Number("123"));
console.log(Number(""));
console.log(Number("  "));
console.log(Number("12s"));
```
**Объяснение:** Конструктор `Number()` пытается преобразовать значение в число. "123" становится 123, пустая строка и строка с пробелами становятся 0, а "12s" возвращает NaN, потому что содержит недопустимые символы.
**Output:**
```
123
0
0
NaN
```

### Q7
```javascript
console.log(Boolean(0));
console.log(Boolean(""));
console.log(Boolean([]));
console.log(Boolean({}));
```
**Объяснение:** В JavaScript есть 6 ложных (falsy) значений: false, 0, "", null, undefined, NaN. Все остальные значения, включая пустые массивы и объекты, считаются истинными.
**Output:**
```
false
false
true
true
```

### Q8
```javascript
let obj = {};
console.log(obj.a);
console.log(delete obj.a);
console.log(obj.a);
```
**Объяснение:** `obj.a` возвращает undefined, потому что свойство 'a' не было определено. Оператор `delete` пытается удалить свойство 'a', но так как его не существует, операция возвращает true. `obj.a` снова возвращает undefined.
**Output:**
```
undefined
true
undefined
```

### Q9
```javascript
const arr = [1, 2, 3];
const obj = {a: 1, b: 2};
console.log(typeof arr);
console.log(typeof obj);
console.log(Array.isArray(arr));
console.log(Array.isArray(obj));
```
**Объяснение:** В JavaScript массивы также являются объектами, поэтому `typeof` возвращает "object" как для массивов, так и для объектов. Для проверки является ли значение массивом, нужно использовать `Array.isArray()`.
**Output:**
```
object
object
true
false
```

### Q10
```javascript
console.log(null == undefined);
console.log(null === undefined);
console.log("" == false);
console.log("" === false);
```
**Объяснение:** Оператор `==` выполняет приведение типов (coercion), поэтому null и undefined равны. Оператор `===` не приводит типы, поэтому null и undefined не равны. Пустая строка и false равны при сравнении ==, но различаются при строгом сравнении.
**Output:**
```
true
false
true
false
```

---

## 2. Functions

### Q11
```javascript
function sayHello() {
    return "Hello";
}
console.log(sayHello());
console.log(typeof sayHello);
```
**Объяснение:** Здесь объявлена функция `sayHello`, которая возвращает строку "Hello". При вызове `sayHello()` функция возвращает "Hello". При использовании `typeof` для функции возвращается "function".
**Output:**
```
Hello
function
```

### Q12
```javascript
var x = 21;
var fun = function () {
    console.log(this.x);
};
fun();
```
**Объяснение:** В строгом режиме `this` внутри функции будет `undefined`, а не глобальным объектом. В нестрогом режиме `this` указывает на глобальный объект (window в браузере), но у глобального объекта нет свойства x. В любом случае результат будет `undefined`.
**Output:**
```
undefined
```

### Q13
```javascript
function foo() {
    return 
    {
        message: "Hello"
    };
}
console.log(foo());
```
**Объяснение:** Автоматическая вставка точки с запятой происходит после ключевого слова `return`, так что функция возвращает `undefined`, а объект игнорируется.
**Output:**
```
undefined
```

### Q14
```javascript
var bar = function(x) { return x; };
console.log(bar(5));
```
**Объяснение:** Анонимная функция присваивается переменной `bar`. Функция принимает один аргумент и возвращает его. При вызове с аргументом 5, функция возвращает 5.
**Output:**
```
5
```

### Q15
```javascript
function checkType(x) {
    if (typeof x === 'function') {
        return x();
    } else {
        return x;
    }
}
console.log(checkType(5));
console.log(checkType(function() { return 10; }));
```
**Объяснение:** Функция проверяет тип аргумента. Если это функция, она вызывается и возвращается результат. Иначе возвращается сам аргумент. В первом случае возвращается 5, во втором - результат выполнения анонимной функции (10).
**Output:**
```
5
10
```

### Q16
```javascript
function createCounter() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}
const counter = createCounter();
console.log(counter());
console.log(counter());
console.log(counter());
```
**Объяснение:** Это пример замыкания. Внутренняя функция сохраняет ссылку на переменную `count` из внешней функции, позволяя сохранить состояние между вызовами.
**Output:**
```
1
2
3
```

### Q17
```javascript
function duplicate(arr) {
    return arr.concat(arr);
}
console.log(duplicate([1, 2, 3]));
```
**Объяснение:** Метод `concat()` создает новый массив, объединяя элементы массива, для которого он вызван, с другими массивами и/или значениями. В данном случае объединяется массив сам с собой.
**Output:**
```
[1, 2, 3, 1, 2, 3]
```

### Q18
```javascript
function greet(name, greeting) {
    return `${greeting || 'Hello'}, ${name}!`;
}
console.log(greet('John'));
console.log(greet('Jane', 'Hi'));
```
**Объяснение:** Используется логический оператор ИЛИ (||) для предоставления значения по умолчанию. Если `greeting` не определен или является falsy значением, используется 'Hello'.
**Output:**
```
Hello, John!
Hi, Jane!
```

### Q19
```javascript
function multiply(a, b = 2) {
    return a * b;
}
console.log(multiply(5));
console.log(multiply(5, 3));
```
**Объяснение:** Это пример параметра по умолчанию. Когда аргумент `b` не передается, используется значение 2. В первом вызове `b` равно 2, во втором `b` равно 3.
**Output:**
```
10
15
```

### Q20
```javascript
const square = x => x * x;
const add = (a, b) => a + b;
console.log(square(5));
console.log(add(3, 4));
```
**Объяснение:** Это стрелочные функции ES6. Они обеспечивают более короткий синтаксис для написания функций. Первая функция возводит число в квадрат, вторая складывает два числа.
**Output:**
```
25
7
```

---

## 3. Scope and Closures

### Q21
```javascript
function outer() {
    var x = 10;
    function inner() {
        console.log(x);
    }
    inner();
}
outer();
```
**Объяснение:** Внутренняя функция имеет доступ к переменной `x` из внешней функции благодаря замыканию. Это позволяет внутренней функции "запомнить" контекст, в котором она была создана.
**Output:**
```
10
```

### Q22
```javascript
var x = 10;
function foo() {
    console.log(x);
    var x = 20;
    console.log(x);
}
foo();
```
**Объяснение:** Из-за поднятия переменной `var x` внутри функции, `x` становится локальной переменной. В начале выполнения функции `x` инициализирована как `undefined`, поэтому первый `console.log` выводит `undefined`. Затем `x` получает значение 20.
**Output:**
```
undefined
20
```

### Q23
```javascript
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0);
}
```
**Объяснение:** Из-за поднятия и общего замыкания, все функции setTimeout ссылаются на одну и ту же переменную `i`. К моменту выполнения setTimeout, цикл уже завершился, и `i` равно 3.
**Output:**
```
3
3
3
```

### Q24
```javascript
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0);
}
```
**Объяснение:** `let` создает отдельное привязывание для каждой итерации цикла. Каждая функция setTimeout получает свою собственную копию переменной `i`.
**Output:**
```
0
1
2
```

### Q25
```javascript
function createFunctions() {
    var result = [];
    for (var i = 0; i < 3; i++) {
        result[i] = function() {
            return i;
        };
    }
    return result;
}
var funcs = createFunctions();
console.log(funcs[0]());
console.log(funcs[1]());
console.log(funcs[2]());
```
**Объяснение:** Все функции в массиве ссылаются на одну и ту же переменную `i` из внешнего замыкания. К моменту вызова функций цикл уже завершился, и `i` содержит значение 3.
**Output:**
```
3
3
3
```

### Q26
```javascript
function createFunctions() {
    var result = [];
    for (var i = 0; i < 3; i++) {
        result[i] = (function(x) {
            return function() {
                return x;
            };
        })(i);
    }
    return result;
}
var funcs = createFunctions();
console.log(funcs[0]());
console.log(funcs[1]());
console.log(funcs[2]());
```
**Объяснение:** Здесь используется IIFE (Immediately Invoked Function Expression) для создания отдельного замыкания для каждого значения `i`. Каждая внутренняя функция захватывает своё собственное значение `x`.
**Output:**
```
0
1
2
```

### Q27
```javascript
var globalVar = "global";

function checkScope() {
    console.log(globalVar);
    var globalVar = "local";
    console.log(globalVar);
}
checkScope();
```
**Объяснение:** Из-за поднятия переменной `globalVar` внутри функции, она становится локальной. В начале выполнения функции `globalVar` инициализирована как `undefined`, поэтому первый `console.log` выводит `undefined`. Затем присваивается "local".
**Output:**
```
undefined
local
```

### Q28
```javascript
let x = 1;
{
    console.log(x);
    let x = 2;
    console.log(x);
}
```
**Объяснение:** Это вызывает ошибку, потому что переменная `x` в блоке находится в "временной мертвой зоне" от начала блока до точки, где она объявлена. Попытка доступа к `x` до объявления вызывает ошибку.
**Output:**
```
Error: Cannot access 'x' before initialization
```

### Q29
```javascript
var a = 1;
function b() {
    a = 10;
    return;
    function a() {}
}
b();
console.log(a);
```
**Объяснение:** Функция `a` поднимается внутри функции `b`, становясь локальной переменной. Присваивание `a = 10` изменяет локальную переменную, а не глобальную.
**Output:**
```
1
```

### Q30
```javascript
var x = 10;
function test() {
    if (false) {
        var x = 20;
    }
    console.log(x);
}
test();
```
**Объяснение:** Даже если условие false, переменная `var x` поднимается к началу функции, перекрывая глобальную переменную. Но поскольку внутри блока не происходит присваивания, `x` остается `undefined`.
**Output:**
```
undefined
```

---

## 4. Objects and Prototypes

### Q31
```javascript
const obj = { a: 1, b: 2 };
obj.c = 3;
console.log(obj);
delete obj.a;
console.log(obj);
```
**Объяснение:** Объекты в JavaScript изменяемы (mutable) даже при объявлении с `const`. Мы можем добавлять и удалять свойства. Оператор `delete` удаляет свойство из объекта.
**Output:**
```
{ a: 1, b: 2, c: 3 }
{ b: 2, c: 3 }
```

### Q32
```javascript
const person = { name: 'John', age: 30 };
console.log(Object.keys(person));
console.log(Object.values(person));
console.log(Object.entries(person));
```
**Объяснение:** `Object.keys()` возвращает массив с именами свойств объекта. `Object.values()` возвращает массив значений свойств. `Object.entries()` возвращает массив пар [ключ, значение] для каждого свойства.
**Output:**
```
['name', 'age']
['John', 30]
[['name', 'John'], ['age', 30]]
```

### Q33
```javascript
const obj1 = { a: 1 };
const obj2 = obj1;
obj2.a = 2;
console.log(obj1.a);
console.log(obj2.a);
```
**Объяснение:** `obj1` и `obj2` ссылаются на один и тот же объект в памяти. Изменение одного из них влияет на другой. Это демонстрирует, как объекты передаются по ссылке.
**Output:**
```
2
2
```

### Q34
```javascript
const obj = { a: 1, b: { c: 2 } };
const copy = Object.assign({}, obj);
obj.b.c = 3;
console.log(obj.b.c);
console.log(copy.b.c);
```
**Объяснение:** `Object.assign()` создает поверхностную (shallow) копию объекта. Вложенные объекты копируются по ссылке, поэтому изменение obj.b.c также изменяет copy.b.c.
**Output:**
```
3
3
```

### Q35
```javascript
const obj = { a: 1, b: 2 };
console.log('a' in obj);
console.log('c' in obj);
console.log(obj.hasOwnProperty('a'));
console.log(obj.hasOwnProperty('toString'));
```
**Объяснение:** Оператор `in` проверяет наличие свойства в объекте или в его прототипной цепочке. `hasOwnProperty()` проверяет только собственные свойства объекта, исключая наследуемые.
**Output:**
```
true
false
true
false
```

### Q36
```javascript
function Person(name) {
    this.name = name;
}
Person.prototype.getName = function() {
    return this.name;
};
const person = new Person('John');
console.log(person.getName());
console.log(person.hasOwnProperty('name'));
console.log(person.hasOwnProperty('getName'));
```
**Объяснение:** Свойство `name` определено как собственное свойство объекта, поэтому `hasOwnProperty` возвращает true. `getName` - метод прототипа, поэтому `hasOwnProperty` возвращает false.
**Output:**
```
John
true
false
```

### Q37
```javascript
const obj = { a: 1, b: 2 };
for (let key in obj) {
    console.log(key + ': ' + obj[key]);
}
```
**Объяснение:** Цикл `for...in` перебирает все перечисляемые свойства объекта, включая унаследованные. В данном случае перебираются только собственные свойства объекта.
**Output:**
```
a: 1
b: 2
```

### Q38
```javascript
const obj = { a: 1, b: 2 };
Object.defineProperty(obj, 'c', {
    value: 3,
    enumerable: false
});
console.log(obj.c);
console.log(Object.keys(obj));
```
**Объяснение:** `Object.defineProperty()` позволяет точно настраивать поведение свойств. В данном случае свойство `c` не является перечисляемым (`enumerable: false`), поэтому оно не появляется в `Object.keys()`.
**Output:**
```
3
['a', 'b']
```

### Q39
```javascript
const obj = { a: 1, b: 2 };
const proto = { c: 3 };
Object.setPrototypeOf(obj, proto);
console.log(obj.c);
```
**Объяснение:** `Object.setPrototypeOf()` устанавливает прототип объекта. Теперь obj наследует свойства от proto, и мы можем получить доступ к свойству `c` через obj, даже если оно не является его собственным свойством.
**Output:**
```
3
```

### Q40
```javascript
const obj1 = { a: 1 };
const obj2 = { b: 2 };
const merged = Object.assign(obj1, obj2);
console.log(merged);
console.log(obj1);
console.log(obj1 === merged);
```
**Объяснение:** `Object.assign()` копирует значения всех перечисляемых собственных свойств из одного или более исходных объектов в целевой объект. Целевой объект изменяется и возвращается.
**Output:**
```
{ a: 1, b: 2 }
{ a: 1, b: 2 }
true
```

---

## 5. Arrays

### Q41
```javascript
const arr = [1, 2, 3];
arr[10] = 10;
console.log(arr.length);
console.log(arr[5]);
```
**Объяснение:** В JavaScript можно присваивать значения элементам массива с любыми индексами. Если индекс превышает текущую длину массива, длина обновляется. Элементы между старой и новой длиной становятся `undefined`.
**Output:**
```
11
undefined
```

### Q42
```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
console.log(arr1.concat(arr2));
console.log([...arr1, ...arr2]);
```
**Объяснение:** И `concat()` и синтаксис spread создают новый массив, объединяя элементы двух массивов. Spread-оператор - это более современный способ объединения массивов.
**Output:**
```
[1, 2, 3, 4, 5, 6]
[1, 2, 3, 4, 5, 6]
```

### Q43
```javascript
const arr = [1, 2, 3, 4, 5];
console.log(arr.slice(1, 3));
console.log(arr.splice(1, 2));
console.log(arr);
```
**Объяснение:** `slice(1, 3)` возвращает новый массив с элементами с индекса 1 до (но не включая) индекса 3. `splice(1, 2)` изменяет исходный массив, удаляя 2 элемента, начиная с индекса 1, и возвращает удаленные элементы.
**Output:**
```
[2, 3]
[2, 3]
[1, 4, 5]
```

### Q44
```javascript
const arr = [1, 2, 3, 4, 5];
console.log(arr.map(x => x * 2));
console.log(arr.filter(x => x % 2 === 0));
console.log(arr.reduce((acc, x) => acc + x, 0));
```
**Объяснение:** `map()` создает новый массив, применяя функцию к каждому элементу. `filter()` создает новый массив с элементами, удовлетворяющими условию. `reduce()` объединяет все элементы массива в одно значение.
**Output:**
```
[2, 4, 6, 8, 10]
[2, 4]
15
```

### Q45
```javascript
const arr = [1, [2, 3], [4, [5, 6]]];
console.log(arr.flat());
console.log(arr.flat(2));
```
**Объяснение:** `flat()` создаёт новый массив со всеми подмассивами, соединёнными в нём рекурсивно до указанной глубины. `flat()` без аргумента сглаживает только на 1 уровень, `flat(2)` сглаживает на 2 уровня.
**Output:**
```
[1, 2, 3, 4, [5, 6]]
[1, 2, 3, 4, 5, 6]
```

### Q46
```javascript
const arr = [1, 2, 3];
arr.forEach(x => console.log(x * 2));
```
**Объяснение:** `forEach()` выполняет указанную функцию для каждого элемента массива. В отличие от `map()`, `forEach()` не возвращает новый массив, а просто выполняет операцию.
**Output:**
```
2
4
6
```

### Q47
```javascript
const arr = [1, 2, 3, 4, 5];
console.log(arr.some(x => x > 3));
console.log(arr.every(x => x > 0));
console.log(arr.find(x => x > 2));
```
**Объяснение:** `some()` проверяет, удовлетворяет ли хотя бы один элемент условию. `every()` проверяет, удовлетворяют ли все элементы условию. `find()` возвращает первый элемент, удовлетворяющий условию, или `undefined`.
**Output:**
```
true
true
3
```

### Q48
```javascript
const arr = [3, 1, 4, 1, 5];
console.log(arr.sort());
console.log(arr.reverse());
```
**Объяснение:** `sort()` и `reverse()` изменяют исходный массив (мутируют его) и возвращают изменённый массив. По умолчанию `sort()` преобразует элементы в строки и сортирует их в лексикографическом порядке.
**Output:**
```
[1, 1, 3, 4, 5]
[5, 4, 3, 1, 1]
```

### Q49
```javascript
const arr = [1, 2, 3];
console.log(Array.isArray(arr));
console.log(Array.from('hello'));
console.log(Array.of(1, 2, 3));
```
**Объяснение:** `Array.isArray()` проверяет, является ли значение массивом. `Array.from()` создаёт новый экземпляр Array из массивоподобного или итерируемого объекта. `Array.of()` создаёт новый экземпляр Array с переменным числом аргументов.
**Output:**
```
true
['h', 'e', 'l', 'l', 'o']
[1, 2, 3]
```

### Q50
```javascript
const matrix = [[1, 2], [3, 4]];
console.log(matrix[0][1]);
const flattened = matrix.flat();
console.log(flattened);
```
**Объяснение:** `matrix[0][1]` обращается к элементу [0][1] двумерного массива. `flat()` сглаживает вложенные массивы в один плоский массив.
**Output:**
```
2
[1, 2, 3, 4]
```

---

## 6. Hoisting

### Q51
```javascript
console.log(x);
var x = 5;
```
**Объяснение:** Поднятие переменных `var` означает, что объявление переменной поднимается к началу области видимости, но присваивание остается на месте. `x` объявляется как `undefined` до присваивания.
**Output:**
```
undefined
```

### Q52
```javascript
console.log(getName());
function getName() {
    return "John";
}
```
**Объяснение:** Объявления функций полностью поднимаются, поэтому функцию можно вызвать до её объявления. Функция будет доступна сразу.
**Output:**
```
John
```

### Q53
```javascript
console.log(getName);
var getName = function() {
    return "Jane";
};
```
**Объяснение:** Только объявление переменной `getName` поднимается, но не присваивание функции. На момент вызова `getName` равен `undefined`.
**Output:**
```
undefined
```

### Q54
```javascript
var temp = 10;
function hoistTest() {
    console.log(temp);
    var temp = 20;
    console.log(temp);
}
hoistTest();
```
**Объяснение:** Переменная `temp` внутри функции поднимается, становясь локальной. В начале выполнения функции `temp` равна `undefined`, затем получает значение 20.
**Output:**
```
undefined
20
```

### Q55
```javascript
getName();
var getName = function() {
    console.log("Function expression");
};
function getName() {
    console.log("Function declaration");
}
```
**Объяснение:** Объявления функций поднимаются до объявления переменных. Поэтому сначала поднимается функция `getName`, но затем переменная `getName` перезаписывает её своим значением `undefined`.
**Output:**
```
Function declaration
```

### Q56
```javascript
function test() {
    console.log(a);
    console.log(foo());
    
    var a = 1;
    function foo() {
        return 2;
    }
}
test();
```
**Объяснение:** Функция `foo` полностью поднимается, поэтому её можно вызвать до объявления. Переменная `a` поднимается как `undefined`, прежде чем получить значение 1.
**Output:**
```
undefined
2
```

### Q57
```javascript
var myVar = 'my value';
(function() {
    console.log(myVar);
    var myVar = 'local value';
    console.log(myVar);
})();
```
**Объяснение:** Переменная `myVar` внутри IIFE поднимается, становясь локальной. Глобальная переменная не используется.
**Output:**
```
undefined
local value
```

### Q58
```javascript
console.log(foo);
console.log(bar);
var foo = 1;
let bar = 2;
```
**Объяснение:** Переменные `var` поднимаются и инициализируются как `undefined`. Переменные `let` и `const` поднимаются, но не инициализируются до точки объявления (временная мертвая зона).
**Output:**
```
undefined
Error: Cannot access 'bar' before initialization
```

### Q59
```javascript
const a = 1;
function f() {
    console.log(a);
    const a = 2;
}
f();
```
**Объяснение:** Переменная `a` находится в временной мертвой зоне до объявления `const a = 2`. Даже если снаружи существует переменная `a`, внутри функции происходит ошибка.
**Output:**
```
Error: Cannot access 'a' before initialization
```

### Q60
```javascript
var x = 1;
function foo() {
    console.log(x);
    var x = 2;
    console.log(x);
}
foo();
```
**Объяснение:** Переменная `x` внутри функции поднимается, становясь локальной и инициализируясь как `undefined`. Поэтому первый `console.log` выводит `undefined`.
**Output:**
```
undefined
2
```

---

## 7. Event Loop and Asynchronous Programming

### Q61
```javascript
console.log("Start");
setTimeout(() => console.log("Timeout"), 0);
Promise.resolve().then(() => console.log("Promise"));
console.log("End");
```
**Объяснение:** Макрозадачи (setTimeout) выполняются после микрозадач (Promise). Сначала выполняется синхронный код, затем микрозадачи, затем макрозадачи.
**Output:**
```
Start
End
Promise
Timeout
```

### Q62
```javascript
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 1);
}
```
**Объяснение:** Все таймеры используют одну и ту же переменную `i` из замыкания. К моменту выполнения таймеров цикл уже завершился, и `i` содержит значение 3.
**Output:**
```
3
3
3
```

### Q63
```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
Promise.resolve().then(() => console.log("4"));
console.log("5");
```
**Объяснение:** Сначала выполняется синхронный код (1, 3, 5), затем микрозадачи (Promise: 4), затем макрозадачи (setTimeout: 2).
**Output:**
```
1
3
5
4
2
```

### Q64
```javascript
const promise = new Promise((resolve, reject) => {
    console.log("Promise constructor");
    resolve();
});
promise.then(() => console.log("Resolved"));
console.log("After promise");
```
**Объяснение:** Конструктор промиса выполняется синхронно, затем весь синхронный код, а затем обработчики промисов.
**Output:**
```
Promise constructor
After promise
Resolved
```

### Q65
```javascript
setTimeout(() => console.log("A"), 0);
const b = new Promise((resolve, reject) => {
    resolve("B");
});
b.then(val => console.log(val));
setTimeout(() => console.log("C"), 0);
```
**Объяснение:** Сначала создается промис и сразу же разрешается. Затем создаются таймеры. Обработчики промисов (микрозадачи) выполняются перед таймерами (макрозадачи).
**Output:**
```
B
A
C
```

### Q66
```javascript
async function asyncFunc() {
    console.log("Start");
    await Promise.resolve("Resolved");
    console.log("End");
}
asyncFunc();
console.log("After async");
```
**Объяснение:** await приостанавливает выполнение функции до тех пор, пока промис не будет разрешен. Но это не блокирует выполнение остального кода.
**Output:**
```
Start
After async
End
```

### Q67
```javascript
console.log("Script start");

setTimeout(function() {
    console.log("setTimeout");
}, 0);

Promise.resolve().then(function() {
    console.log("promise1");
}).then(function() {
    console.log("promise2");
});
console.log("Script end");
```
**Объяснение:** Выполняется синхронный код (Script start, Script end), затем микрозадачи (promise1, promise2), затем макрозадачи (setTimeout).
**Output:**
```
Script start
Script end
promise1
promise2
setTimeout
```

### Q68
```javascript
function resolveAfter2Seconds() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('resolved');
        }, 2000);
    });
}

async function asyncCall() {
    console.log('calling');
    const result = await resolveAfter2Seconds();
    console.log(result);
}
asyncCall();
```
**Объяснение:** `asyncCall` возвращает управление сразу после первого `await`, позволяя другому коду выполниться. Результат будет доступен через 2 секунды.
**Output:**
```
calling
resolved  // after 2 seconds
```

### Q69
```javascript
const first = () => (new Promise((resolve, reject) => {
    console.log(3);
    let p = new Promise((resolve, reject) => {
        console.log(7);
        setTimeout(() => {
            console.log(5);
            resolve(6);
        }, 0);
        resolve(1);
    });
    resolve(2);
    p.then(arg => console.log(arg));
}));

first().then(arg => console.log(arg));
console.log(4);
```
**Объяснение:** Сначала выполняется синхронный код (3, 7, 4), затем микрозадачи (1, 2), затем макрозадачи (5). Промис `p` сразу разрешается значением 1.
**Output:**
```
3
7
4
1
2
5
```

### Q70
```javascript
console.log("Start");
Promise.resolve().then(() => {
    console.log("Promise 1");
    Promise.resolve().then(() => {
        console.log("Promise 2");
    });
});
console.log("End");
```
**Объяснение:** Сначала выполняется синхронный код (Start, End), затем первая микрозадача (Promise 1), затем вторая микрозадача (Promise 2).
**Output:**
```
Start
End
Promise 1
Promise 2
```

---

## 8. Promises and Async/Await

### Q71
```javascript
Promise.resolve(1)
    .then(value => value * 2)
    .then(value => value + 3)
    .then(value => console.log(value));
```
**Объяснение:** Цепочка промисов, где результат одного обработчика передается в следующий. 1 * 2 = 2, затем 2 + 3 = 5.
**Output:**
```
5
```

### Q72
```javascript
Promise.resolve()
    .then(() => {
        throw new Error("Error");
    })
    .catch(err => console.log(err.message));
```
**Объяснение:** Если в цепочке промисов происходит ошибка, она передается в ближайший блок catch.
**Output:**
```
Error
```

### Q73
```javascript
const promise1 = Promise.resolve('Promise 1');
const promise2 = Promise.resolve('Promise 2');
Promise.all([promise1, promise2]).then(values => console.log(values));
```
**Объяснение:** `Promise.all` ждет разрешения всех промисов и возвращает массив результатов. Если все промисы успешно разрешены.
**Output:**
```
['Promise 1', 'Promise 2']
```

### Q74
```javascript
async function test() {
    const result = await Promise.resolve('Hello');
    console.log(result);
}
test();
```
**Объяснение:** `await` ожидает разрешения промиса. В данном случае промис разрешается немедленно значением 'Hello'.
**Output:**
```
Hello
```

### Q75
```javascript
async function foo() {
    return 'Hello';
}
foo().then(result => console.log(result));
```
**Объяснение:** Функция, объявленная с `async`, всегда возвращает промис. Даже если возвращаемое значение не является промисом, оно оборачивается в промис.
**Output:**
```
Hello
```

### Q76
```javascript
async function test() {
    try {
        const result = await Promise.reject('Error');
        console.log(result);
    } catch (error) {
        console.log(error);
    }
}
test();
```
**Объяснение:** Если промис, переданный в `await`, отклоняется, возникает ошибка, которую можно перехватить с помощью `try...catch`.
**Output:**
```
Error
```

### Q77
```javascript
const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve("Resolved!"), 1000);
});
console.log("Before await");
console.log(await promise); // This won't work without async context
console.log("After await");
```
**Объяснение:** `await` можно использовать только внутри асинхронной функции (`async`).
**Output:**
```
Error: Unexpected await outside async function
```

### Q78
```javascript
async function asyncFunc() {
    await null;
    return "Done";
}
asyncFunc().then(result => console.log(result));
```
**Объяснение:** `await null` возвращает `null`. `await` также преобразует не-промисы в промисы с этим значением.
**Output:**
```
Done
```

### Q79
```javascript
Promise.race([
    Promise.resolve('first'),
    Promise.reject('error'),
    Promise.resolve('second')
]).then(result => console.log(result));
```
**Объяснение:** `Promise.race` возвращает промис, который разрешается или отклоняется с результатом/ошибкой первого завершившегося промиса.
**Output:**
```
first
```

### Q80
```javascript
const p1 = new Promise((resolve) => {
    setTimeout(() => resolve('first'), 1000);
});
const p2 = new Promise((resolve, reject) => {
    setTimeout(() => resolve('second'), 0);
});
Promise.all([p1, p2]).then(result => console.log(result));
```
**Объяснение:** `Promise.all` ждет, пока все промисы не будут разрешены. Даже если p2 разрешается быстрее, результат будет доступен только после разрешения p1.
**Output:**
```
['first', 'second']  // after 1 second
```

---

## 9. This Keyword

### Q81
```javascript
const obj = {
    name: 'John',
    greet: function() {
        console.log(this.name);
    }
};
obj.greet();
```
**Объяснение:** В методе объекта `this` ссылается на сам объект. Поэтому `this.name` возвращает 'John'.
**Output:**
```
John
```

### Q82
```javascript
const obj = {
    name: 'John',
    greet: () => {
        console.log(this.name);
    }
};
obj.greet();
```
**Объяснение:** У стрелочных функций нет собственного `this`. Они захватывают `this` из окружающего контекста (в данном случае глобальный объект).
**Output:**
```
undefined
```

### Q83
```javascript
function Person(name) {
    this.name = name;
}
Person.prototype.getName = function() {
    return this.name;
};
const person = new Person('Jane');
console.log(person.getName());
```
**Объяснение:** Конструктор `Person` создает объект с именем 'Jane'. Метод `getName` в прототипе возвращает `this.name`, где `this` ссылается на экземпляр объекта.
**Output:**
```
Jane
```

### Q84
```javascript
const obj = {
    name: 'John',
    friends: ['Jane', 'Bob'],
    printFriends: function() {
        this.friends.forEach(function(friend) {
            console.log(this.name + ' knows ' + friend);
        });
    }
};
obj.printFriends();
```
**Объяснение:** Внутри обычной функции `this` теряет связь с объектом и становится `undefined` в строгом режиме или глобальным объектом в нестрогом.
**Output:**
```
undefined knows Jane
undefined knows Bob
```

### Q85
```javascript
const obj = {
    name: 'John',
    friends: ['Jane', 'Bob'],
    printFriends: function() {
        this.friends.forEach((friend) => {
            console.log(this.name + ' knows ' + friend);
        });
    }
};
obj.printFriends();
```
**Объяснение:** Стрелочная функция сохраняет `this` из внешнего контекста, поэтому `this.name` правильно ссылается на 'John'.
**Output:**
```
John knows Jane
John knows Bob
```

### Q86
```javascript
const obj = {
    a: function() {
        console.log(this);
        const b = function() {
            console.log(this);
        }
        b();
    }
};
obj.a();
```
**Объяснение:** В функции `a()` `this` ссылается на объект `obj`. Внутри функции `b()` `this` равен `undefined` в строгом режиме или глобальному объекту в нестрогом.
**Output:**
```
{ a: [Function: a] }
undefined  // or global object in non-strict mode
```

### Q87
```javascript
function foo() {
    console.log(this);
}
const obj = { method: foo };
foo();
obj.method();
```
**Объяснение:** При прямом вызове `foo()` `this` равен `undefined` в строгом режиме. При вызове как метода `obj.method()` `this` ссылается на `obj`.
**Output:**
```
undefined  // strict mode
{ method: [Function: foo] }
```

### Q88
```javascript
const obj = {
    name: 'John',
    log: function() {
        console.log(this.name);
        function inner() {
            console.log(this.name);
        }
        inner();
    }
};
obj.log();
```
**Объяснение:** Внешняя функция правильно использует `this.name` ('John'), но внутренняя функция теряет контекст, и `this` не содержит свойства `name`.
**Output:**
```
John
undefined  // strict mode, or global object in non-strict mode
```

### Q89
```javascript
const obj = {
    name: 'John',
    getName: function() {
        return this.name;
    }
};
const getName = obj.getName;
console.log(getName());
console.log(obj.getName());
```
**Объяснение:** При присваивании метода переменной теряется связь с объектом. При вызове `getName()` `this` не ссылается на `obj`.
**Output:**
```
undefined
John
```

### Q90
```javascript
function Person(name) {
    this.name = name;
    setTimeout(function() {
        console.log(this.name);
    }, 0);
}
new Person('John');
```
**Объяснение:** Функция в `setTimeout` не сохраняет контекст `this` конструктора. В строгом режиме `this` будет `undefined`.
**Output:**
```
undefined  // or global object in non-strict mode
```

---

## 10. Classes and Inheritance

### Q91
```javascript
class Person {
    constructor(name) {
        this.name = name;
    }
    greet() {
        return `Hello, I'm ${this.name}`;
    }
}
const person = new Person('John');
console.log(person.greet());
```
**Объяснение:** ES6 классы работают похоже на функции-конструкторы, но с более чистым синтаксисом. `constructor` вызывается при создании экземпляра.
**Output:**
```
Hello, I'm John
```

### Q92
```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }
}
class Dog extends Animal {
    constructor(name, breed) {
        super(name);
        this.breed = breed;
    }
    getInfo() {
        return `${this.name} is a ${this.breed}`;
    }
}
const dog = new Dog('Buddy', 'Golden Retriever');
console.log(dog.getInfo());
```
**Объяснение:** Класс `Dog` наследует от `Animal` через `extends`. `super()` вызывает конструктор родительского класса.
**Output:**
```
Buddy is a Golden Retriever
```

### Q93
```javascript
class Rectangle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    get area() {
        return this.width * this.height;
    }
}
const rect = new Rectangle(5, 10);
console.log(rect.area);
```
**Объяснение:** Геттер (`get`) позволяет обращаться к вычисляемому свойству как к обычному свойству, без круглых скобок.
**Output:**
```
50
```

### Q94
```javascript
class Shape {
    static createCircle(radius) {
        return new Shape('circle', radius);
    }
    constructor(type, size) {
        this.type = type;
        this.size = size;
    }
    static get PI() {
        return 3.14159;
    }
}
console.log(Shape.PI);
const circle = Shape.createCircle(5);
console.log(circle.type);
```
**Объяснение:** Статические методы и свойства принадлежат классу, а не экземплярам. Они вызываются на классе, а не на экземплярах.
**Output:**
```
3.14159
circle
```

### Q95
```javascript
class Vehicle {
    constructor(brand) {
        this.brand = brand;
    }
    start() {
        return `${this.brand} vehicle started`;
    }
}
class Car extends Vehicle {
    start() {
        return super.start() + ' and car is ready';
    }
}
const car = new Car('Toyota');
console.log(car.start());
```
**Объяснение:** Метод `start` в классе `Car` переопределяет метод родительского класса. `super.start()` вызывает родительскую реализацию.
**Output:**
```
Toyota vehicle started and car is ready
```

### Q96
```javascript
class Parent {
    constructor() {
        this.name = 'parent';
    }
    static staticMethod() {
        return 'static';
    }
}
class Child extends Parent {
    constructor() {
        super();
        this.name = 'child';
    }
}
console.log(Child.staticMethod());
const child = new Child();
console.log(child.name);
```
**Объяснение:** Статические методы наследуются дочерними классами. `super()` вызывает конструктор родительского класса.
**Output:**
```
static
child
```

### Q97
```javascript
class MyClass {
    #privateField = 'private';
    getPrivateField() {
        return this.#privateField;
    }
}
const instance = new MyClass();
console.log(instance.getPrivateField());
// console.log(instance.#privateField); // This would cause an error
```
**Объяснение:** Поля, начинающиеся с `#`, являются приватными и доступны только внутри класса.
**Output:**
```
private
```

### Q98
```javascript
function createClass() {
    return class {
        constructor(value) {
            this.value = value;
        }
        getValue() {
            return this.value;
        }
    };
}
const DynamicClass = createClass();
const instance = new DynamicClass('Hello');
console.log(instance.getValue());
```
**Объяснение:** Классы могут быть анонимными и динамически создаваться внутри функций, как и функции-конструкторы.
**Output:**
```
Hello
```

### Q99
```javascript
class A {
    constructor() {
        this.x = 1;
    }
}
class B extends A {
    constructor() {
        super();
        this.y = 2;
    }
}
const b = new B();
console.log(b instanceof A);
console.log(b instanceof B);
```
**Объяснение:** Оператор `instanceof` проверяет, был ли объект создан с использованием указанного конструктора. Экземпляр дочернего класса также является экземпляром родительского.
**Output:**
```
true
true
```

### Q100
```javascript
class MyClass {
    constructor() {
        this.prop = 'value';
    }
    method() {
        return this.prop;
    }
}
MyClass.prototype.newMethod = function() {
    return 'new method';
};
const instance = new MyClass();
console.log(instance.newMethod());
```
**Объяснение:** Классы по сути являются функциями, и с их прототипами можно работать так же, как с функциями-конструкторами.
**Output:**
```
new method
```

---

## 11. Higher-Order Functions

### Q101
```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log(doubled);
```
**Объяснение:** `map()` — это метод высшего порядка, который принимает функцию и применяет её к каждому элементу массива, создавая новый массив.
**Output:**
```
[2, 4, 6, 8, 10]
```

### Q102
```javascript
const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens);
```
**Объяснение:** `filter()` — это метод высшего порядка, который создает новый массив с элементами, прошедшими проверку, заданную в функции.
**Output:**
```
[2, 4, 6]
```

### Q103
```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log(sum);
```
**Объяснение:** `reduce()` — это метод высшего порядка, который применяет функцию к аккумулятору и каждому значению массива, сводя его к одному значению.
**Output:**
```
15
```

### Q104
```javascript
const words = ['Hello', 'world'];
const sentence = words.reduce((acc, word) => acc + ' ' + word);
console.log(sentence);
```
**Объяснение:** `reduce()` без начального значения использует первый элемент в качестве начального аккумулятора, затем обрабатывает остальные элементы.
**Output:**
```
Hello world
```

### Q105
```javascript
const data = [1, 2, 3, 4, 5];
const result = data
    .filter(x => x % 2 === 1)
    .map(x => x * x)
    .reduce((acc, x) => acc + x, 0);
console.log(result);
```
**Объяснение:** Цепочка методов высшего порядка: сначала фильтруем нечетные числа (1, 3, 5), затем возводим их в квадрат (1, 9, 25), затем суммируем (35).
**Output:**
```
35  // 1^2 + 3^2 + 5^2 = 1 + 9 + 25 = 35
```

### Q106
```javascript
const nums = [1, 2, 3];
const result = nums.forEach(num => num * 2);
console.log(result);
```
**Объяснение:** `forEach()` не возвращает новый массив, а возвращает `undefined`. Он просто выполняет функцию для каждого элемента.
**Output:**
```
undefined
```

### Q107
```javascript
const animals = [
    { name: 'Fluffykins', species: 'cat' },
    { name: 'Caro', species: 'dog' }
];
const names = animals.map(animal => animal.name);
console.log(names);
```
**Объяснение:** Используем `map()` для извлечения определенного свойства из каждого объекта массива.
**Output:**
```
['Fluffykins', 'Caro']
```

### Q108
```javascript
const isDog = (animal) => animal.species === 'dog';
const animals = [
    { name: 'Fluffykins', species: 'cat' },
    { name: 'Caro', species: 'dog' }
];
const dogs = animals.filter(isDog);
console.log(dogs);
```
**Объяснение:** Функция `isDog` передается в `filter()` как аргумент. Функция высшего порядка принимает другую функцию в качестве параметра.
**Output:**
```
[{ name: 'Caro', species: 'dog' }]
```

### Q109
```javascript
const orders = [
    { amount: 250 },
    { amount: 400 },
    { amount: 100 },
    { amount: 325 }
];
const totalAmount = orders
    .map(order => order.amount)
    .reduce((sum, amount) => sum + amount, 0);
console.log(totalAmount);
```
**Объяснение:** Сначала извлекаем все суммы, затем складываем их. Комбинация методов высшего порядка для сложных преобразований данных.
**Output:**
```
1075
```

### Q110
```javascript
const people = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
];
const names = people
    .filter(person => person.age > 27)
    .map(person => person.name);
console.log(names);
```
**Объяснение:** Фильтруем людей старше 27 лет, затем извлекаем их имена. Показывает, как можно комбинировать методы высшего порядка.
**Output:**
```
['Bob', 'Charlie']
```

---

## 12. Destructuring

### Q111
```javascript
const person = { name: 'John', age: 30, city: 'New York' };
const { name, age } = person;
console.log(name, age);
```
**Объяснение:** Деструктуризация объекта позволяет извлекать свойства в переменные с тем же именем. Это более краткий способ получения значений из объекта.
**Output:**
```
John 30
```

### Q112
```javascript
const arr = [1, 2, 3];
const [a, b, c] = arr;
console.log(a, b, c);
```
**Объяснение:** Деструктуризация массива позволяет присваивать элементы массива переменным по позиции.
**Output:**
```
1 2 3
```

### Q113
```javascript
const person = { name: 'John', address: { city: 'New York', country: 'USA' } };
const { address: { city } } = person;
console.log(city);
```
**Объяснение:** Деструктуризация вложенных объектов позволяет извлекать вложенные свойства. `address: { city }` означает "извлеки свойство address, затем из него извлеки city".
**Output:**
```
New York
```

### Q114
```javascript
const arr = [1, 2, 3, 4, 5];
const [first, , third, ...rest] = arr;
console.log(first, third, rest);
```
**Объяснение:** Пропуск элемента через пустую запятую (,), оператор остатка `...rest` собирает оставшиеся элементы в массив.
**Output:**
```
1 3 [4, 5]
```

### Q115
```javascript
function displayUser({ name, age = 18 }) {
    console.log(`Name: ${name}, Age: ${age}`);
}
displayUser({ name: 'John' });
```
**Объяснение:** Деструктуризация параметров функции позволяет извлекать свойства переданного объекта. Параметр по умолчанию используется, если свойство отсутствует.
**Output:**
```
Name: John, Age: 18
```

### Q116
```javascript
const user = { name: 'John', age: 30, location: 'New York' };
const { name, ...rest } = user;
console.log(name);
console.log(rest);
```
**Объяснение:** Оператор остатка `...rest` собирает все остальные свойства в новый объект, кроме тех, что уже были деструктурированы.
**Output:**
```
John
{ age: 30, location: 'New York' }
```

### Q117
```javascript
const data = [1, [2, 3], 4];
const [a, [b, c], d] = data;
console.log(a, b, c, d);
```
**Объяснение:** Деструктуризация вложенных массивов позволяет извлекать элементы из вложенных массивов.
**Output:**
```
1 2 3 4
```

### Q118
```javascript
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b);
```
**Объяснение:** Использование деструктуризации массива для обмена значений переменных без временной переменной.
**Output:**
```
2 1
```

### Q119
```javascript
const obj = { a: 1, b: 2 };
const { a: x, b: y } = obj;
console.log(x, y);
```
**Объяснение:** Синтаксис `a: x` означает "извлеки свойство a и присвой его переменной x". Позволяет присваивать переменным другое имя.
**Output:**
```
1 2
```

### Q120
```javascript
const user = { name: 'John', details: { age: 30, city: 'New York' } };
const { details: { age, city: location } } = user;
console.log(age, location);
```
**Объяснение:** Комбинированная деструктуризация: извлекаем вложенные свойства и переименовываем одно из них.
**Output:**
```
30 New York
```

---

## 13. Spread and Rest Operators

### Q121
```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined);
```
**Объяснение:** Оператор spread (`...`) раскрывает элементы массива, позволяя объединять массивы или передавать элементы как отдельные аргументы.
**Output:**
```
[1, 2, 3, 4, 5, 6]
```

### Q122
```javascript
const original = { a: 1, b: 2 };
const copied = { ...original, c: 3 };
console.log(copied);
```
**Объяснение:** Оператор spread для объектов создает поверхностную копию, позволяет добавлять новые свойства или переопределять существующие.
**Output:**
```
{ a: 1, b: 2, c: 3 }
```

### Q123
```javascript
function sum(...numbers) {
    return numbers.reduce((acc, num) => acc + num, 0);
}
console.log(sum(1, 2, 3, 4));
```
**Объяснение:** Оператор rest (`...numbers`) собирает все аргументы в массив, когда количество аргументов неизвестно заранее.
**Output:**
```
10
```

### Q124
```javascript
const str = "hello";
const chars = [...str];
console.log(chars);
```
**Объяснение:** Строки являются итерируемыми, поэтому оператор spread может разбить строку на массив символов.
**Output:**
```
['h', 'e', 'l', 'l', 'o']
```

### Q125
```javascript
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const merged = { ...obj1, ...obj2 };
console.log(merged);
```
**Объяснение:** При объединении объектов с одинаковыми ключами последние значения перезаписывают предыдущие.
**Output:**
```
{ a: 1, b: 3, c: 4 }
```

### Q126
```javascript
const arr = [1, 2, 3];
const [first, ...rest] = arr;
console.log(first, rest);
```
**Объяснение:** В деструктуризации массива оператор rest собирает оставшиеся элементы в новый массив.
**Output:**
```
1 [2, 3]
```

### Q127
```javascript
function logParams(first, ...others) {
    console.log(first, others);
}
logParams('a', 'b', 'c', 'd');
```
**Объяснение:** Оператор rest в параметрах функции позволяет принимать переменное количество аргументов после определенных параметров.
**Output:**
```
a ['b', 'c', 'd']
```

### Q128
```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
const result = [0, ...arr1, ...arr2, 5];
console.log(result);
```
**Объяснение:** Spread-оператор позволяет вставлять содержимое массивов в другую структуру, создавая новый массив.
**Output:**
```
[0, 1, 2, 3, 4, 5]
```

### Q129
```javascript
const original = [1, 2, 3];
const duplicate = [...original];
duplicate.push(4);
console.log(original);
console.log(duplicate);
```
**Объяснение:** Spread-оператор создает поверхностную копию массива. Изменения в копии не влияют на оригинальный массив.
**Output:**
```
[1, 2, 3]
[1, 2, 3, 4]
```

### Q130
```javascript
const params = ['a', 'b', 'c'];
const result = params.join('-');
const [first, ...rest] = result.split('-');
console.log(first, rest);
```
**Объяснение:** Комбинация методов строк и деструктуризации массива. `split('-')` создает массив, который затем деструктурируется.
**Output:**
```
a ['b', 'c']
```

---

## 14. ES6+ Features

### Q131
```javascript
const template = `Hello, ${'World'}!`;
console.log(template);
```
**Объяснение:** Шаблонные строки (template literals) позволяют вставлять выражения внутрь строк с помощью `${expression}`.
**Output:**
```
Hello, World!
```

### Q132
```javascript
const obj = { x: 1, y: 2 };
const { x, y } = obj;
const newObject = { x, y };
console.log(newObject);
```
**Объяснение:** Сокращенная нотация свойств объекта позволяет использовать переменные как свойства с тем же именем.
**Output:**
```
{ x: 1, y: 2 }
```

### Q133
```javascript
const greet = (name = 'Anonymous') => `Hello, ${name}!`;
console.log(greet());
console.log(greet('John'));
```
**Объяснение:** Параметры по умолчанию позволяют задавать значения для параметров, если они не переданы при вызове функции.
**Output:**
```
Hello, Anonymous!
Hello, John!
```

### Q134
```javascript
const numbers = [1, 2, 3, 4, 5];
const [first, , third, ...remaining] = numbers;
console.log(first, third, remaining);
```
**Объяснение:** Смешанное использование деструктуризации, пропуска элементов и оператора rest для извлечения нужных значений.
**Output:**
```
1 3 [4, 5]
```

### Q135
```javascript
const person = { name: 'John', age: 30 };
const updatedPerson = { ...person, age: 31, city: 'New York' };
console.log(updatedPerson);
```
**Объяснение:** Spread-оператор для объектов позволяет создавать новые объекты, изменяя или добавляя свойства.
**Output:**
```
{ name: 'John', age: 31, city: 'New York' }
```

### Q136
```javascript
const map = new Map();
map.set('name', 'John');
map.set('age', 30);
console.log(map.get('name'));
console.log(map.has('age'));
```
**Объяснение:** Map - это коллекция пар ключ-значение, где ключом может быть любой тип данных, а не только строка.
**Output:**
```
John
true
```

### Q137
```javascript
const set = new Set([1, 2, 3, 2, 1]);
console.log(set.size);
console.log([...set]);
```
**Объяснение:** Set - это коллекция уникальных значений. Дубликаты автоматически удаляются.
**Output:**
```
3
[1, 2, 3]
```

### Q138
```javascript
const weakMap = new WeakMap();
const obj = {};
weakMap.set(obj, 'value');
console.log(weakMap.has(obj));
```
**Объяснение:** WeakMap - это Map, который позволяет использовать только объекты в качестве ключей и не препятствует сборке мусора.
**Output:**
```
true
```

### Q139
```javascript
const weakSet = new WeakSet();
const obj1 = {};
const obj2 = {};
weakSet.add(obj1);
weakSet.add(obj2);
console.log(weakSet.has(obj1));
```
**Объяснение:** WeakSet - это Set, который позволяет использовать только объекты и также не препятствует сборке мусора.
**Output:**
```
true
```

### Q140
```javascript
const sym1 = Symbol('description');
const sym2 = Symbol('description');
console.log(sym1 === sym2);
console.log(typeof sym1);
```
**Объяснение:** Symbol - это примитивный тип данных, каждый символ уникален, даже если у них одинаковое описание.
**Output:**
```
false
symbol
```

---

## 15. Error Handling

### Q141
```javascript
try {
    throw new Error("Something went wrong");
} catch (err) {
    console.log(err.message);
}
```
**Объяснение:** Блок `try...catch` позволяет перехватывать и обрабатывать ошибки, которые могут возникнуть в коде.
**Output:**
```
Something went wrong
```

### Q142
```javascript
try {
    console.log("Before error");
    throw "String error";
    console.log("After error");
} catch (err) {
    console.log("Caught:", err);
}
```
**Объяснение:** В `catch` можно получить любое значение, а не только объекты ошибок. Код после `throw` не выполняется.
**Output:**
```
Before error
Caught: String error
```

### Q143
```javascript
try {
    console.log("Try block");
} catch (err) {
    console.log("Catch block");
} finally {
    console.log("Finally block");
}
console.log("After try-catch-finally");
```
**Объяснение:** Блок `finally` выполняется всегда, независимо от того, была ли ошибка или нет.
**Output:**
```
Try block
Finally block
After try-catch-finally
```

### Q144
```javascript
function divide(a, b) {
    if (b === 0) {
        throw new Error("Division by zero");
    }
    return a / b;
}
try {
    console.log(divide(10, 0));
} catch (err) {
    console.log(err.message);
}
```
**Объяснение:** Функция выбрасывает ошибку при попытке деления на ноль. Ошибка перехватывается в блоке `catch`.
**Output:**
```
Division by zero
```

### Q145
```javascript
const promise = new Promise((resolve, reject) => {
    reject(new Error("Promise error"));
});
promise.catch(err => console.log(err.message));
```
**Объяснение:** Ошибки в промисах перехватываются с помощью метода `.catch()`.
**Output:**
```
Promise error
```

### Q146
```javascript
async function asyncError() {
    try {
        await Promise.reject(new Error("Async error"));
    } catch (err) {
        console.log(err.message);
    }
}
asyncError();
```
**Объяснение:** В асинхронных функциях ошибки можно перехватывать с помощью `try...catch` вместе с `await`.
**Output:**
```
Async error
```

### Q147
```javascript
try {
    JSON.parse("invalid json");
} catch (err) {
    console.log(err.name);
    console.log(err instanceof SyntaxError);
}
```
**Объяснение:** `JSON.parse()` выбрасывает ошибку SyntaxError при попытке разобрать некорректный JSON.
**Output:**
```
SyntaxError
true
```

### Q148
```javascript
const obj = { name: "Test" };
try {
    Object.freeze(obj);
    obj.name = "Changed";
    console.log(obj.name);
} catch (err) {
    console.log("Error:", err.message);
}
```
**Объяснение:** В строгом режиме при попытке изменить замороженный объект будет ошибка. В нестрогом режиме изменения просто игнорируются.
**Output:**
```
Test  // In non-strict mode, no error and property doesn't change
```

### Q149
```javascript
try {
    undeclaredVar = "value";
} catch (err) {
    console.log("Error:", err.message);
} finally {
    console.log("Value:", typeof undeclaredVar !== 'undefined' ? undeclaredVar : "not defined");
}
```
**Объяснение:** Присваивание необъявленной переменной создает глобальную переменную.
**Output:**
```
Value: value  // This creates a global variable
```

### Q150
```javascript
function* generator() {
    try {
        yield 1;
        yield 2;
    } finally {
        console.log("Generator cleanup");
    }
}
const gen = generator();
console.log(gen.next().value);
console.log(gen.next().value);
gen.return();  // This will trigger the finally block
```
**Объяснение:** Блок `finally` в генераторе выполняется при завершении генератора с помощью `return()`.
**Output:**
```
1
2
Generator cleanup
```

---

## 16. Bind, Call, Apply

### Q151
```javascript
const person = {
    name: 'John',
    greet: function() {
        return `Hello, ${this.name}`;
    }
};
const anotherPerson = { name: 'Jane' };
console.log(person.greet.call(anotherPerson));
```
**Объяснение:** Метод `call()` вызывает функцию с указанным значением `this` и отдельными аргументами.
**Output:**
```
Hello, Jane
```

### Q152
```javascript
const person = {
    name: 'John',
    greet: function(greeting, punctuation) {
        return `${greeting}, ${this.name}${punctuation}`;
    }
};
const boundGreet = person.greet.bind({ name: 'Bob' }, 'Hi');
console.log(boundGreet('!'));
```
**Объяснение:** Метод `bind()` создает новую функцию с привязанным значением `this` и частично примененными аргументами.
**Output:**
```
Hi, Bob!
```

### Q153
```javascript
function greet() {
    console.log(`Hello, ${this.name}`);
}
const obj = { name: 'Alice' };
greet.call(obj);
greet.apply(obj);
```
**Объяснение:** `call()` и `apply()` работают одинаково, но `apply()` принимает аргументы в виде массива.
**Output:**
```
Hello, Alice
Hello, Alice
```

### Q154
```javascript
function multiply(a, b) {
    return a * b * this.factor;
}
const obj = { factor: 5 };
console.log(multiply.call(obj, 2, 3));
console.log(multiply.apply(obj, [2, 3]));
```
**Объяснение:** `call()` принимает аргументы отдельно, `apply()` принимает аргументы в массиве. Оба устанавливают `this`.
**Output:**
```
30
30
```

### Q155
```javascript
function add(a, b, c) {
    return a + b + c + this.base;
}
const boundAdd = add.bind({ base: 10 });
// This won't work as expected because 'this' will be undefined
console.log(boundAdd(1, 2, 3));
```
**Объяснение:** В строгом режиме `this` будет `undefined` внутри привязанной функции, если не указан объект.
**Output:**
```
NaN  // (1 + 2 + 3 + undefined)
```

### Q156
```javascript
const obj1 = { name: 'Obj1', value: 10 };
const obj2 = { name: 'Obj2', value: 20 };
function display() {
    return `${this.name}: ${this.value}`;
}
console.log(display.call(obj1));
console.log(display.apply(obj2));
```
**Объяснение:** Изменение контекста `this` с помощью `call()` и `apply()` позволяет использовать одну функцию с разными объектами.
**Output:**
```
Obj1: 10
Obj2: 20
```

### Q157
```javascript
function Product(name, price) {
    this.name = name;
    this.price = price;
}
function Food(name, price) {
    Product.call(this, name, price);
    this.category = 'food';
}
const cheese = new Food('feta', 5);
console.log(cheese.name, cheese.price, cheese.category);
```
**Объяснение:** `call()` используется для вызова конструктора родительского класса с текущим контекстом `this`.
**Output:**
```
feta 5 food
```

### Q158
```javascript
const numbers = [1, 2, 3, 4, 5];
const max = Math.max.apply(null, numbers);
const min = Math.min.apply(null, numbers);
console.log(max, min);
```
**Объяснение:** `apply()` позволяет передать массив в качестве аргументов функции, которая ожидает отдельные значения.
**Output:**
```
5 1
```

### Q159
```javascript
const obj = { name: 'Test' };
function introduce(age) {
    return `I'm ${this.name} and I'm ${age} years old`;
}
const boundIntroduce = introduce.bind(obj);
console.log(boundIntroduce(25));
```
**Объяснение:** `bind()` создает новую функцию с привязанным `this`, которая может быть вызвана позже.
**Output:**
```
I'm Test and I'm 25 years old
```

### Q160
```javascript
const obj = { multiplier: 3 };
function calculate(a, b) {
    return (a + b) * this.multiplier;
}
const result1 = calculate.call(obj, 2, 4);
const result2 = calculate.apply(obj, [2, 4]);
console.log(result1, result2);
```
**Объяснение:** `call()` и `apply()` позволяют установить контекст `this` и передать аргументы в функцию.
**Output:**
```
18 18
```

---

## 17. Prototypal Inheritance

### Q161
```javascript
function Animal(name) {
    this.name = name;
}
Animal.prototype.speak = function() {
    return `${this.name} makes a noise.`;
};
const dog = new Animal('Dog');
console.log(dog.speak());
```
**Объяснение:** Прототипное наследование позволяет объектам наследовать свойства и методы от прототипа конструктора.
**Output:**
```
Dog makes a noise.
```

### Q162
```javascript
function Animal(name) {
    this.name = name;
}
Animal.prototype.speak = function() {
    return `${this.name} makes a noise.`;
};
function Dog(name) {
    Animal.call(this, name);
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.speak = function() {
    return `${this.name} barks.`;
};
const dog = new Dog('Rex');
console.log(dog.speak());
```
**Объяснение:** Наследование от другого конструктора с переопределением метода. `Object.create()` создает новый объект с указанным прототипом.
**Output:**
```
Rex barks.
```

### Q163
```javascript
const animal = {
    name: 'Animal',
    getName: function() {
        return this.name;
    }
};
const dog = Object.create(animal);
dog.name = 'Dog';
console.log(dog.getName());
```
**Объяснение:** `Object.create()` создает новый объект, используя существующий объект в качестве прототипа нового объекта.
**Output:**
```
Dog
```

### Q164
```javascript
function Parent() {
    this.name = 'Parent';
}
Parent.prototype.getName = function() {
    return this.name;
};
function Child() {
    Parent.call(this);
    this.name = 'Child';
}
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
const child = new Child();
console.log(child.getName());
console.log(child instanceof Child);
console.log(child instanceof Parent);
```
**Объяснение:** Правильная реализация наследования с использованием `Object.create()` для прототипа.
**Output:**
```
Child
true
true
```

### Q165
```javascript
const parent = {
    value: 10
};
const child = Object.create(parent);
child.value = 20;
console.log(parent.value);
console.log(child.value);
```
**Объяснение:** При присваивании значения свойства в наследуемом объекте создается собственное свойство, не изменяя родительское.
**Output:**
```
10
20
```

### Q166
```javascript
function Vehicle() {}
Vehicle.prototype.type = 'Generic Vehicle';
Vehicle.prototype.start = function() {
    return 'Vehicle started';
};
function Car() {}
Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;
Car.prototype.type = 'Car';
const car = new Car();
console.log(car.type);
console.log(car.start());
```
**Объяснение:** Наследование прототипа позволяет дочернему классу использовать методы родительского класса, а также переопределять свойства.
**Output:**
```
Car
Vehicle started
```

### Q167
```javascript
const obj1 = { a: 1 };
const obj2 = Object.create(obj1);
obj2.b = 2;
const obj3 = Object.create(obj2);
obj3.c = 3;
console.log(obj3.a, obj3.b, obj3.c);
console.log(obj3.hasOwnProperty('a'), obj3.hasOwnProperty('b'), obj3.hasOwnProperty('c'));
```
**Объяснение:** Проверка принадлежности свойств к объекту с помощью `hasOwnProperty()`. Свойства могут наследоваться по цепочке прототипов.
**Output:**
```
1 2 3
false false true
```

### Q168
```javascript
function MyConstructor() {}
MyConstructor.prototype.someMethod = function() {
    return 'Hello from prototype';
};
const instance = new MyConstructor();
console.log(instance.someMethod());
console.log(instance.__proto__ === MyConstructor.prototype);
```
**Объяснение:** `__proto__` указывает на прототип объекта. Свойства и методы из прототипа доступны через экземпляр.
**Output:**
```
Hello from prototype
true
```

### Q169
```javascript
const proto = {
    speak: function() {
        return 'Speaking';
    }
};
const obj = Object.create(proto);
Object.setPrototypeOf(obj, { move: function() {
    return 'Moving';
}});
console.log(obj.move());
// obj.speak() would throw an error as it's no longer in prototype chain
```
**Объяснение:** `Object.setPrototypeOf()` изменяет прототип объекта. После изменения старые методы становятся недоступны.
**Output:**
```
Moving
```

### Q170
```javascript
function Base() {
    this.baseValue = 'Base';
}
Base.prototype.getBaseValue = function() {
    return this.baseValue;
};
function Derived() {
    Base.call(this);
    this.derivedValue = 'Derived';
}
Derived.prototype = Object.create(Base.prototype);
const instance = new Derived();
console.log(instance.getBaseValue());
console.log(instance.baseValue);
console.log(instance.derivedValue);
```
**Объяснение:** Правильная реализация наследования, где экземпляр получает доступ к методам родительского прототипа.
**Output:**
```
Base
Base
Derived
```

---

## 18. Miscellaneous

### Q171
```javascript
const a = {};
const b = { name: 'b' };
const c = { name: 'c' };

a[b] = 200;
a[c] = 400;

console.log(a[b]);
```
**Объяснение:** При использовании объекта в качестве ключа он преобразуется в строку '[object Object]', поэтому b и c становятся одним и тем же ключом.
**Output:**
```
400
```

### Q172
```javascript
let c = { greeting: 'Hey!' };
let d;

d = c;
c.greeting = 'Hello';
console.log(d.greeting);
```
**Объяснение:** `c` и `d` ссылаются на один и тот же объект в памяти. Изменение свойства в одном объекте влияет на другой.
**Output:**
```
Hello
```

### Q173
```javascript
function Animal(x) {
    this.x = x;
    return { x: x + 1 };
}
const obj = new Animal(1);
console.log(obj.x);
```
**Объяснение:** Если конструктор возвращает объект, `new` возвращает этот объект, а не `this`.
**Output:**
```
2
```

### Q174
```javascript
function checkAge() {
    return this.age >= 18;
}
const person = { age: 20 };
console.log(checkAge.call(person));
```
**Объяснение:** `call()` позволяет установить контекст `this` для функции.
**Output:**
```
true
```

### Q175
```javascript
const numbers = [1, 2, 3];
const newNumbers = [...numbers, numbers];
console.log(newNumbers.length);
console.log(newNumbers);
```
**Объяснение:** Spread-оператор раскрывает первый массив, а второй массив добавляется как один элемент.
**Output:**
```
4
[1, 2, 3, [1, 2, 3]]
```

### Q176
```javascript
const fn = (a, x, y, ...numbers) => {
    return numbers;
};
console.log(fn(5, 6, 7, 8, 9, 10));
```
**Объяснение:** Оператор rest собирает все оставшиеся аргументы в массив.
**Output:**
```
[8, 9, 10]
```

### Q177
```javascript
function* generator() {
    yield 1;
    yield 2;
    return 3;
}
const gen = generator();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
```
**Объяснение:** Генераторы возвращают объект с полями value и done. `return` в генераторе устанавливает done = true.
**Output:**
```
{ value: 1, done: false }
{ value: 2, done: false }
{ value: 3, done: true }
```

### Q178
```javascript
const obj = {
    a: 'one',
    b: 'two',
    a: 'three'
};
console.log(obj);
```
**Объяснение:** В объекте дублирующиеся ключи перезаписывают предыдущие значения.
**Output:**
```
{ a: 'three', b: 'two' }
```

### Q179
```javascript
const value = { number: 10 };
const multiply = (x = { ...value }) => {
    console.log(x.number *= 2);
};
multiply();
multiply();
multiply(value);
multiply(value);
```
**Объяснение:** При деструктуризации с объектом по умолчанию создается новый объект, при передаче существующего объекта изменения сохраняются.
**Output:**
```
20
20
20
40
```

### Q180
```javascript
const result = [1, 2, 3].map(num => {
    if (typeof num === 'number') return;
    return num * 2;
});
console.log(result);
```
**Объяснение:** Если функция в `map()` возвращает `undefined`, соответствующий элемент в новом массиве будет `undefined`.
**Output:**
```
[undefined, undefined, undefined]
```

### Q181
```javascript
const obj = {
    a: 1,
    b: 2,
    c: {
        d: 3,
        e: 4
    }
};
const { a, c: { d } } = obj;
console.log(a, d);
```
**Объяснение:** Деструктуризация позволяет извлекать вложенные свойства и присваивать им новые имена.
**Output:**
```
1 3
```

### Q182
```javascript
function getPersonInfo(age) {
    const name = 'John';
    return { name, age };
}
console.log(getPersonInfo(25));
```
**Объяснение:** Сокращенная запись свойств объекта позволяет использовать переменные в качестве свойств с тем же именем.
**Output:**
```
{ name: 'John', age: 25 }
```

### Q183
```javascript
function compareAge(person1, person2) {
    if (person1.age === person2.age) {
        return true;
    } else {
        return false;
    }
}
const person1 = { name: 'John', age: 25 };
const person2 = { name: 'Jane', age: 25 };
console.log(compareAge(person1, person2));
```
**Объяснение:** Функция сравнивает возраст двух объектов и возвращает true, если они равны.
**Output:**
```
true
```

### Q184
```javascript
const person = { name: 'Lydia' };
Object.defineProperty(person, 'age', { value: 21 });
console.log(person.age);
console.log(Object.keys(person));
```
**Объяснение:** `Object.defineProperty()` позволяет создавать не перечисляемые свойства (по умолчанию enumerable: false).
**Output:**
```
21
['name']
```

### Q185
```javascript
let num = 10;
const increaseNumber = () => num++;
const increasePassedNumber = number => number++;
const num1 = increaseNumber();
const num2 = increasePassedNumber(num);
console.log(num1);
console.log(num2);
console.log(num);
```
**Объяснение:** Оператор `++` возвращает значение до инкремента, а `num++` увеличивает внешнюю переменную.
**Output:**
```
10
10
11
```

### Q186
```javascript
const add = () => {
    const cache = {};
    return num => {
        if (num in cache) {
            return `From cache! ${cache[num]}`;
        } else {
            const result = num + 10;
            cache[num] = result;
            return `Calculated! ${result}`;
        }
    };
};
const number = add();
console.log(number(10));
console.log(number(10));
```
**Объяснение:** Пример замыкания, где внутренняя функция сохраняет доступ к переменной cache из внешней функции.
**Output:**
```
Calculated! 20
From cache! 20
```

### Q187
```javascript
const msg = 'hello';
console.log(msg.toUpperCase());
console.log(typeof msg);
```
**Объяснение:** Примитивные строки имеют встроенные методы, потому что временно преобразуются в объекты String.
**Output:**
```
HELLO
string
```

### Q188
```javascript
const arr = [1, 2, 3];
const [x, y, ...rest] = arr;
console.log(x, y, rest);
```
**Объяснение:** Оператор rest в деструктуризации массива собирает оставшиеся элементы.
**Output:**
```
1 2 []
```

### Q189
```javascript
const map = new Map([[1, 2], [2, 4], [3, 6]]);
console.log([...map]);
console.log([...map.keys()]);
console.log([...map.values()]);
```
**Объяснение:** Map можно преобразовать в массив пар [ключ, значение], получать ключи и значения отдельно.
**Output:**
```
[[1, 2], [2, 4], [3, 6]]
[1, 2, 3]
[2, 4, 6]
```

### Q190
```javascript
const set = new Set([1, 1, 2, 3, 4, 4, 5]);
console.log([...set]);
console.log(set.size);
```
**Объяснение:** Set автоматически удаляет дубликаты, позволяя легко создавать массивы уникальных значений.
**Output:**
```
[1, 2, 3, 4, 5]
5
```

### Q191
```javascript
const user = { name: 'John', age: 30 };
const { name, ...other } = user;
console.log(name);
console.log(other);
```
**Объяснение:** Оператор rest в деструктуризации объекта позволяет извлекать определенные свойства и оставшиеся собирать в новый объект.
**Output:**
```
John
{ age: 30 }
```

### Q192
```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined);
```
**Объяснение:** Spread-оператор позволяет легко объединять массивы.
**Output:**
```
[1, 2, 3, 4, 5, 6]
```

### Q193
```javascript
const original = { a: 1, b: { c: 2 } };
const copy = { ...original };
original.b.c = 100;
console.log(copy.b.c);
```
**Объяснение:** Spread-оператор создает поверхностную копию, вложенные объекты копируются по ссылке.
**Output:**
```
100
```

### Q194
```javascript
const obj = { a: 1, b: 2, c: 3 };
const { a, c } = obj;
console.log({ a, c });
```
**Объяснение:** Сокращенная запись свойств объекта позволяет создавать новые объекты с выбранными свойствами.
**Output:**
```
{ a: 1, c: 3 }
```

### Q195
```javascript
function* generator() {
    yield 'Hello';
    yield 'World';
}
const gen = generator();
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().done);
```
**Объяснение:** Генераторы позволяют приостанавливать выполнение функции и возвращаться к ней позже.
**Output:**
```
Hello
World
true
```

### Q196
```javascript
const promise1 = new Promise((resolve, reject) => {
    setTimeout(resolve, 100, 'one');
});
const promise2 = new Promise((resolve, reject) => {
    setTimeout(resolve, 200, 'two');
});
Promise.all([promise1, promise2]).then(values => console.log(values));
```
**Объяснение:** `Promise.all` ждет разрешения всех промисов, затем возвращает массив результатов.
**Output:**
```
['one', 'two']  // after 200ms
```

### Q197
```javascript
const promise = new Promise(res => setTimeout(res, 100, 'Hi'));
promise.then(value => value).then(value => console.log(value));
```
**Объяснение:** Цепочка промисов, где результат передается от одного обработчика к другому.
**Output:**
```
Hi  // after 100ms
```

### Q198
```javascript
async function getData() {
    const response = await new Promise(res => setTimeout(() => res('Data'), 100));
    return response;
}
getData().then(data => console.log(data));
```
**Объяснение:** `async/await` - это синтаксический сахар для работы с промисами, который делает асинхронный код более похожим на синхронный.
**Output:**
```
Data  // after 100ms
```

### Q199
```javascript
const obj = { a: 1, b: 2, c: 3 };
const keys = Object.keys(obj);
const values = Object.values(obj);
const entries = Object.entries(obj);
console.log(keys, values, entries);
```
**Объяснение:** `Object.keys()`, `Object.values()` и `Object.entries()` позволяют получать массивы ключей, значений и пар [ключ, значение].
**Output:**
```
['a', 'b', 'c'] [1, 2, 3] [['a', 1], ['b', 2], ['c', 3]]
```

### Q200
```javascript
const arr = [1, 2, 3, [4, 5]];
const flattened = [].concat(...arr);
console.log(flattened);
```
**Объяснение:** Spread-оператор раскрывает подмассивы, а `concat()` объединяет их в один плоский массив.
**Output:**
```
[1, 2, 3, 4, 5]
```

### Q201
```javascript
const person = {
    name: 'John',
    details: {
        age: 30,
        address: {
            city: 'New York',
            country: 'USA'
        }
    }
};
const {
    details: {
        address: { city }
    }
} = person;
console.log(city);
```
**Объяснение:** Глубокая деструктуризация позволяет извлекать вложенные свойства на любом уровне вложенности.
**Output:**
```
New York
```

### Q202
```javascript
const arr = [1, 2, 3];
arr.forEach((item, index) => {
    arr[index] = item * 2;
});
console.log(arr);
```
**Объяснение:** `forEach()` позволяет перебирать элементы массива и изменять их по индексу.
**Output:**
```
[2, 4, 6]
```

### Q203
```javascript
const user = {
    firstName: 'John',
    lastName: 'Doe',
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
};
const { getFullName } = user;
console.log(getFullName());
```
**Объяснение:** При извлечении метода из объекта теряется контекст `this`, поэтому `this.firstName` и `this.lastName` будут `undefined`.
**Output:**
```
undefined undefined
```

### Q204
```javascript
const obj1 = { a: 1, b: 2 };
const obj2 = { a: 3, c: 4 };
const merged = { ...obj1, ...obj2 };
console.log(merged);
```
**Объяснение:** При объединении объектов свойства из последующих объектов перезаписывают предыдущие.
**Output:**
```
{ a: 3, b: 2, c: 4 }
```

### Q205
```javascript
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}
const gen = counter();
console.log([...gen]);
```
**Объяснение:** Spread-оператор может использоваться для преобразования итерируемого объекта (включая генераторы) в массив.
**Output:**
```
[1, 2, 3]
```

### Q206
```javascript
const nums = [1, 2, 3, 4, 5];
const result = nums.reduce((acc, curr) => {
    return [...acc, curr * 2];
}, []);
console.log(result);
```
**Объяснение:** Использование `reduce()` для создания нового массива с преобразованными значениями.
**Output:**
```
[2, 4, 6, 8, 10]
```

### Q207
```javascript
const obj = { a: 1, b: 2 };
Object.freeze(obj);
obj.c = 3;
obj.a = 10;
console.log(obj);
```
**Объяснение:** `Object.freeze()` делает объект неизменяемым. В строгом режиме попытка изменить объект вызывает ошибку.
**Output:**
```
{ a: 1, b: 2 }  // In non-strict mode, assignments fail silently
```

### Q208
```javascript
const arr = [1, 2, 3];
arr.length = 1;
console.log(arr);
```
**Объяснение:** Изменение свойства `length` массива удаляет элементы с более высокими индексами.
**Output:**
```
[1]
```

### Q209
```javascript
const obj = {
    *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
    }
};
console.log([...obj]);
```
**Объяснение:** Использование символа `Symbol.iterator` позволяет сделать объект итерируемым.
**Output:**
```
[1, 2, 3]
```

### Q210
```javascript
const double = ([first, ...rest]) => [first * 2, ...rest.map(n => n * 2)];
console.log(double([1, 2, 3, 4]));
```
**Объяснение:** Комбинированное использование деструктуризации массива, rest-оператора и map для преобразования элементов.
**Output:**
```
[2, 4, 6, 8]
```

---

## 🎯 Interview Tips

### Key Concepts to Remember:
1. **Hoisting**: Variables and functions are moved to the top of their scope during compilation
2. **Closures**: Inner functions have access to outer function's variables
3. **Event Loop**: JavaScript is single-threaded with an event loop for async operations
4. **Scope**: Local, global, and block scope behaviors
5. **this keyword**: Context depends on how functions are called
6. **Prototypal Inheritance**: Objects inherit properties from other objects
7. **Asynchronous JavaScript**: Promises, async/await, and callback patterns

### Common Interview Patterns:
- Closure-based counter functions
- Function currying implementations
- Debounce and throttle functions
- Promise implementations
- Array manipulation methods
- Object manipulation patterns
- ES6+ syntax transformations

### Performance Considerations:
- Prefer `const` and `let` over `var`
- Use array methods like `map`, `filter`, `reduce` for transformations
- Be aware of shallow vs deep copying
- Understand when to use `for` loops vs array methods
- Consider memory implications of closures