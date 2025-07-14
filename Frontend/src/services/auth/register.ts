import { RegisterRequest } from "../../interfaces/auth/RegisterRequest";
import { RegisterResponse } from "../../interfaces/auth/RegisterResponse";
import usuariosApi from "./apiUsuarios.ts";

export async function register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
  const api = usuariosApi(); // usa instancia con baseURL del microservicio de usuarios

  const response = await api.post<RegisterRequest, RegisterResponse>(registerRequest, {
    url: "/signup",
  });

  return response.data;
}
