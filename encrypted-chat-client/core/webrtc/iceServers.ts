const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"];

function readUrls(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

export function getIceServers(): RTCIceServer[] {
  const stunUrls = readUrls(process.env.NEXT_PUBLIC_STUN_URLS);
  const turnUrls = readUrls(process.env.NEXT_PUBLIC_TURN_URLS);

  const servers: RTCIceServer[] = [
    {
      urls: stunUrls.length > 0 ? stunUrls : DEFAULT_STUN_URLS,
    },
  ];

  if (turnUrls.length > 0) {
    servers.push({
      urls: turnUrls,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  return servers;
}
