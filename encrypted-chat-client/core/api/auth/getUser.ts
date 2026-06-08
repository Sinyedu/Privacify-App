export function getUsername(): string {
  if (typeof window === "undefined") return "Unknown";

  const token = localStorage.getItem("token");
  if (!token) return "Unknown";

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username;
  } catch {
    return "Unknown";
  }
}
