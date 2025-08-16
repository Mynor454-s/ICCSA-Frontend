import axios from "axios";

export interface LoginResponse {
    token: string;
    user: {
        name: string;
        email: string;
        role: string;
    }
}

export async function loginApi(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await axios.post("http://localhost:3000/api/auth/login", {
    email,
    password,
  });
  return response.data;
}
