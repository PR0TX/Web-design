# Лабораторна робота №3 — Розробка Web-додатка засобами Javascript/VueJS

[![HTML5](https://img.shields.io/badge/HTML5-5-E34F26.svg?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-3-1572B6.svg?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-42B883.svg?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.2-7952B3.svg?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Google%20Fonts](https://img.shields.io/badge/Google%20Fonts-Manrope-4285F4.svg?logo=google&logoColor=white)](https://fonts.google.com/specimen/Manrope)

**Варіант:** Облік робочого часу (запуск таймера, призупинення/продовження, зупинка, збереження назви, часу початку і завершення сеансу роботи)

**Назва Web-додатка:** ChronoTrack

## Зміст
* [Мета](#мета)
* [Завдання лабораторної](#завдання-лабораторної)
* [Опис проєкту](#опис-проєкту)
* [Архітектура та структура проєкту](#архітектура-та-структура-проєкту)
* [Сторінки та їх призначення](#сторінки-та-їх-призначення)
* [Схема навігації](#схема-навігації)
* [Взаємодія компонентів у сторінках](#взаємодія-компонентів-у-сторінках)
* [Потік даних і подій](#потік-даних-і-подій)
* [Логіка Javascript-коду](#логіка-javascript-коду)
* [Використані технології](#використані-технології)
* [Запуск проєкту](#запуск-проєкту)
* [Контакти](#контакти)

## Мета
Ознайомитись із засобами фреймворка VueJS та навчитись створювати асинхронні запити до Web-сервера.

## Завдання лабораторної
Адаптувати програмний код ЛР№2 до вимог фреймворка VueJS та забезпечити завантаження необхідних даних з Web-сервера 

## Опис проєкту
ChronoTrack — це SPA Web-додаток для обліку робочого часу. У ньому можна запускати таймер для задачі, призупиняти та продовжувати роботу, завершувати сесію із збереженням часу початку, часу завершення та тривалості, а також переглядати профіль користувача і статистику накопичених сесій.

Клієнтська частина побудована на VueJS 3 з використанням Vue Router і працює в межах одного `index.html` без перезавантаження сторінки. Сервер зберігає користувачів, активні сесії та історію роботи в SQLite-базі.

## Архітектура та структура проєкту

**Структура репозиторію:**
- `Site/` — SPA-клієнт і ресурси Web-додатка
- `Site/index.html` — єдина HTML-точка входу
- `Site/styles.css` — стилі інтерфейсу
- `Site/logo.png` — емблема додатка
- `Site/vendor/vue-router.esm-browser.prod.js` — локальна браузерна збірка Vue Router
- `Site/js/main.js` — запуск Vue-додатка
- `Site/js/router.js` — конфігурація маршрутів SPA
- `Site/js/app-shell.js` — спільний layout із header, footer і `router-view`
- `Site/js/shared.js` — API-запити, auth-state та форматування
- `Site/js/components/mechanical-timer.js` — анімований компонент таймера
- `Site/js/views/*.js` — окремі view-компоненти для маршрутизованих екранів
- `server.js` — сервер Express, REST API та робота з SQLite
- `package.json` — конфігурація npm-скриптів і залежностей
- `package-lock.json` — зафіксовані версії залежностей
- `README.md` — опис проєкту

## Сторінки та їх призначення
- **Робоча область (`/workspace`)**: запуск таймера, призупинення/продовження, зупинка сесії, відображення поточного стану сесії та історії збережених записів.
- **Профіль (`/profile`)**: табличне подання даних користувача, кнопка виходу та автоматичний підрахунок статистики на основі завершених робочих сесій.
- **Про додаток (`/about`)**: статичний опис додатка, його призначення та ключових можливостей.
- **Вхід (`/login`)**: форма входу, яка надсилає email і пароль на сервер та отримує серверну сесію.
- **Реєстрація (`/register`)**: форма реєстрації з валідацією полів і автоматичним входом після успішного створення облікового запису.

## Схема навігації
```mermaid
---
config:
  layout: elk
---
flowchart LR
 subgraph Pages["Маршрути ChronoTrack"]
        W["Робоча область<br>/workspace"]
        P["Профіль<br>/profile"]
        A["Про додаток<br>/about"]
        L["Вхід<br>/login"]
        R["Реєстрація<br>/register"]
  end
    W --> A & P
    P --> W
    L --> P
    R --> P
    M(("RouterLink у header")) -.-> W & P & A & L & R
```

## Взаємодія компонентів у SPA

```mermaid
flowchart LR
    Main["main.js"] --> Router["router.js"]
    Main --> Shell["AppShell"]
    Shell --> View["router-view"]
    Router --> View

    View --> Auth["LoginView / RegisterView"]
    View --> About["AboutView"]
    View --> Profile["ProfileView"]
    View --> Workspace["WorkspaceView"]

    Auth --> Shared["shared.js"]
    Profile --> Shared
    Workspace --> Shared

    Workspace --> Timer["MechanicalTimer"]
    Timer --> Flip["FlipDigit"]
```

## Потік даних і подій

```mermaid
sequenceDiagram
    participant B as Браузер
    participant R as Vue Router
    participant V as View component
    participant H as shared.js
    participant A as Express API
    participant D as SQLite

    B->>R: Відкриття SPA
    R->>H: syncSession()
    H->>A: GET /api/session
    A->>D: Читання cookie-сесії та користувача
    D-->>A: Дані користувача або null
    A-->>H: Статус автентифікації
    H-->>R: auth state
    R-->>V: Активний маршрут

    V->>H: fetch data or submit form
    H->>A: API request
    A->>D: Читання або запис
    D-->>A: Результат
    A-->>H: JSON payload
    H-->>V: Оновлення стану
    V-->>B: Перерендер інтерфейсу
```


## Логіка Javascript-коду
Код проєкту побудовано як SPA на VueJS з маршрутизацією через Vue Router, використано компактну структуру:
- `Site/js/main.js` запускає Vue-додаток і підключає Router;
- `Site/js/router.js` описує маршрути `/workspace`, `/profile`, `/about`, `/login`, `/register` та route-guards для авторизації;
- `Site/js/app-shell.js` містить спільний layout із header, footer, меню та `router-view`;
- `Site/js/shared.js` містить `fetch`-запити, auth-state і допоміжні функції форматування;
- `Site/js/views/*.js` реалізують окремі SPA-екрани;
- `Site/js/components/mechanical-timer.js` реалізує анімований лічильник часу;
- `server.js` реалізує Express-сервер, перевірку автентифікації, обробку форм входу і реєстрації, а також CRUD-операції для робочих сесій;
- SQLite використовується як постійне сховище для користувачів, сесій входу та історії робочого часу.

На клієнті Vue Router керує переходами між view-компонентами, а `router-view` відображає активний екран усередині спільного layout. Для авторизації використано серверну cookie-сесію.

### Робоча область
На маршруті `/workspace` Vue-клієнт завантажує стан поточного користувача та список сесій з `/api/workspace`. Після цього доступні дії:
- `startSession()` запускає нову сесію;
- `toggleSession()` призупиняє або продовжує активну сесію;
- `stopSession()` завершує сесію та переносить її до історії;
- `deleteSession()` видаляє запис із таблиці історії.

Щосекунди оновлюється відображення таймера, але фактичні дані зберігаються на сервері.

### Профіль користувача
На маршруті `/profile` завантажуються дані профілю та статистика з `/api/profile`. Після отримання відповіді від сервера відображаються:
- основні дані користувача;
- загальна тривалість роботи;
- середня тривалість сесії;
- кількість завершених сесій.

### Вхід і реєстрація
Форми маршрутів `/login` і `/register` відправляють дані через `fetch` на серверні маршрути `/api/login` та `/api/register`. Після успішної операції сервер встановлює cookie, а клієнт переходить на маршрут профілю.

### Сервер
`server.js`:
- створює таблиці `users`, `auth_sessions`, `active_sessions` і `work_sessions`;
- заповнює базу демо-даними при першому запуску;
- перевіряє пароль та створює серверну сесію;
- зберігає та оновлює активну робочу сесію;
- формує дані для профілю та історії.

## Використані технології
- `HTML5`, `CSS3`
- `Bootstrap 5.3.2`
- `JavaScript ES6`
- `VueJS 3`
- `Vue Router 4`
- `NodeJS`
- `Express`
- `SQLite`
- `fetch API`
- `npm`
- шрифт `Manrope`

## Запуск проєкту
1. Встановити залежності:
```bash
npm install
```

2. Запустити сервер:
```bash
npm start
```

3. Відкрити сайт у браузері:
```bash
http://localhost:3000
```

Для швидкої перевірки доступний демо-акаунт:
- `demo@chronotrack.local`
- `Demo12345!`

## Контакти
* **Автор:** Протченко П.О., група **КВ-34**
* **Лабораторна робота:** №3, Web-дизайн
* **Завдання:** Розробка Web-додатка засобами Javascript/VueJS
* **URL звіту (Google Drive):** [Звіт](https://docs.google.com/document/d/18HFXQSwxrTMs08vbavuD73HtkpM9TyB-/edit?usp=sharing&ouid=109306955313039128869&rtpof=true&sd=true)
