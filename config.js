/*
 * Настройки Monkey Kingdom. Эти данные публичны: файл виден любому посетителю.
 * НИКОГДА не помещайте сюда токен Discord-бота, GitHub PAT или Supabase service_role key.
 */
window.MONKEY_CONFIG = {
  discordServerId: "1286370837074804799",

  // Если Discord возвращает ссылку instant_invite, сайт использует её автоматически.
  // Иначе можно вручную указать публичную ссылку-приглашение вида:
  // discordInvite: "https://discord.gg/ВАШ_КОД",
  discordInvite: "https://discord.com/invite/3WcxZqhS",

  // Администраторы: указывайте Discord username (не display name), регистр не важен.
  // При совпадении с публичным списком виджета будет показан статус.
  // Пример (уберите // и замените на настоящие никнеймы):
  // admins: [
  //   { username: "your_admin", role: "Король джунглей" },
  //   { username: "your_mod", role: "Главный страж" }
  // ],
  admins: [],

  // По умолчанию голосование сохраняется ТОЛЬКО в браузере посетителя (демо).
  // Для общего голосования используйте бесплатный Supabase и supabase-setup.sql.
  supabase: {
    url: "",           // Например https://xyzcompany.supabase.co
    anonKey: "",       // Публичный anon / publishable key, НЕ service_role
    pollId: "season-1" // Измените для начала нового голосования
  }
};
