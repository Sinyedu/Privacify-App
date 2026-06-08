const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function readAuthResponse(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;

    throw new Error(message || "Authentication failed");
  }

  return data;
}

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    let res: Response;

    try {
      res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error(`Cannot reach API at ${API_URL}`);
    }

    return readAuthResponse(res);
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    let res: Response;

    try {
      res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error(`Cannot reach API at ${API_URL}`);
    }

    return readAuthResponse(res);
  },
};
