# 🍌 MONKEY KINGDOM — сайт Discord-сообщества

Готовый адаптивный сайт в жёлто-фиолетовом стиле: число участников Discord онлайн, список доступных участников, голосование за игры, администрация и официальный Discord-виджет. Никаких Node.js-серверов для самого сайта не требуется.

## 1. Запуск локально

Откройте `index.html` в браузере. Большая часть сайта будет работать сразу. Для нормальной проверки запросов к API лучше запустить локальный веб-сервер: `python -m http.server 8000` и открыть `http://localhost:8000`.

## 2. Онлайн Discord

В `config.js` уже указан Discord server ID `1286370837074804799`, взятый из вашего iframe.

1. В Discord откройте **Server Settings → Widget**.
2. Включите **Enable Server Widget**.
3. Укажите **Invite Channel**, если Discord его предлагает. В этом случае кнопки присоединения будут использовать `instant_invite` из API.
4. Если API не предоставил приглашение, вручную укажите `discordInvite: "https://discord.gg/ВАШ_КОД"` в `config.js`.

Сайт каждые 60 секунд запрашивает `https://discord.com/api/guilds/1286370837074804799/widget.json`. Показатель `presence_count` — количество участников Discord **онлайн**, не игроков Minecraft/CS2. `members` — ограниченный публичный список (до 100 имён), поэтому он может быть неполным. Если Discord не отдаёт данные, сайт показывает «—», а не выдуманную цифру; официальный iframe остаётся внизу страницы. Доступ из браузера также зависит от CORS-заголовков Discord.

## 3. Настройка администрации

В файле `config.js` измените `admins`:

```js
admins: [
  { username: "NICK_1", role: "Король джунглей", emoji: "👑" },
  { username: "NICK_2", role: "Главный страж", emoji: "🛡️" },
  { username: "NICK_3", role: "Модератор", emoji: "⚡", aliases: ["alt_name"] }
],
```

Здесь нужно указать настоящие **username**, а не Discord ID. Discord Widget API **не возвращает роли участников**, поэтому администрацию назначаем вручную. Если настроенный пользователь виден в публичном списке — сайт отобразит его текущий статус; если нет — «Нет в публичном списке» (это **не доказательство офлайна**).

## 4. Голосование (два режима)

**По умолчанию: локальное демо.** Игрок может выбрать одну из 12 игр, посмотреть процент, и его выбор сохраняется в `localStorage`. Это НЕ общий опрос — голоса разных посетителей не суммируются. Интерфейс прямо сообщает об этом.

**Чтобы результаты были общими для всех — Supabase Free:**

1. Создайте бесплатный проект на [supabase.com](https://supabase.com).
2. В Supabase откройте **SQL Editor**, вставьте содержимое `supabase-setup.sql` и выполните запрос.
3. В Supabase → **Project Settings → API** найдите Project URL и **anon** / **publishable** API key.
4. В `config.js` заполните:

```js
supabase: {
  url: "https://YOURPROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY",
  pollId: "season-1"
}
```

5. Загрузите обновлённый `config.js` в GitHub — результаты станут общими для всех посетителей. Голоса сохраняются через RPC `cast_monkey_vote`, статистика считывается через `get_monkey_vote_totals`.

**Безопасность:** публичный `anon` / `publishable` ключ предназначен для клиента. Никогда не помещайте сюда Supabase `service_role` key, токен Discord-бота или GitHub PAT. SQL закрывает прямое чтение таблицы и выдаёт только агрегированные результаты. Для дружеских опросов достаточно; от накрутки/ботов голосование **не защищено**. Для строгой защиты нужна авторизация и серверный rate limiting. Новый раунд запускается сменой `pollId`.

## 5. Бесплатная публикация на GitHub Pages

Для этого проекта уже создан публичный репозиторий: https://github.com/bbzteamsuport-glitch/monkey-kingdom.
После включения Pages из ветки `main`, папки `/(root)` адрес сайта будет:
https://bbzteamsuport-glitch.github.io/monkey-kingdom/.
Публикацию настраивает владелец или пользователь с правом управления GitHub Pages.
Последующие изменения в `main` публикуются автоматически.

1. Перейдите на https://github.com/new и создайте **Public** репозиторий, например `monkey-kingdom`.
2. В новом репозитории нажмите **Add file → Upload files**. Загрузите **все файлы из папки проекта** (не сам архив и не внешнюю папку). `index.html` должен оказаться **в корне репозитория**.
3. Нажмите **Commit changes**.
4. Перейдите **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
5. Выберите **main → /(root) → Save**.
6. Сайт будет доступен по адресу `https://ВАШ_ЛОГИН.github.io/monkey-kingdom/`. Публикация может занять несколько минут.

Официальная документация: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Структура

```text
monkey-kingdom/
├── index.html            # Разметка
├── styles.css            # Вся стилизация + мобильная версия
├── script.js             # Discord, администрация, опрос
├── config.js             # Публичные настройки сервера и Supabase
├── supabase-setup.sql    # Необязательная база для общих голосов
├── assets/
│   ├── favicon.svg
│   └── monkey-king.svg
├── .nojekyll
└── README.md
```

Чтобы поменять варианты игр, редактируйте список `games` в начале `script.js`. Если Supabase уже используется, также добавьте новые `id` игр в оба списка разрешённых названий в `supabase-setup.sql` и заново выполните SQL.
