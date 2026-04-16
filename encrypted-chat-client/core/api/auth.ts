const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AuthResponse = {
  access_token: string;
};

const headers = {
  "Content-Type": "application/json",
};

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    return res.json() as Promise<AuthResponse>;
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Register failed");
    }

    return res.json() as Promise<AuthResponse>;
  },
};
