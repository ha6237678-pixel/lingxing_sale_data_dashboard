export function displayError(error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";

  if (message.includes("DATABASE_URL is not configured")) {
    return "未配置 DATABASE_URL，请在 .env 中配置 PostgreSQL/Supabase 连接串。";
  }

  if (message.includes("ENOTFOUND") || message.includes("ECONNREFUSED") || message.includes("timeout")) {
    return "数据库连接失败，请检查 DATABASE_URL 的主机、端口、密码和网络访问权限。";
  }

  if (message.includes("password authentication failed")) {
    return "数据库认证失败，请检查 DATABASE_URL 中的用户名或密码。";
  }

  if (message.includes("does not exist")) {
    return "数据库表或字段与看板规格不一致，请检查核心表是否已创建完成。";
  }

  return message;
}
