export function encrypt(text: string): string {
  return btoa(text); // base64 encode
}

export function decrypt(text: string): string {
  return atob(text); // base64 decode
}
