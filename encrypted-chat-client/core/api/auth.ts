const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Login failed");

    return res.json();
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Register failed");

    return res.json();
  },
};
