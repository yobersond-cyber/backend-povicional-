
import { apiFetch } from "./api";
import type { TipoUsuario } from "./usuario";

interface LoginData {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  id_usuario: number;
  tipo_de_usuario: TipoUsuario;
}

export async function login(
  datos: LoginData,
): Promise<LoginResponse> {
  const response = await apiFetch("/usuarios/login", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  if (!response?.data?.access_token) {
    throw new Error(
      "El servidor no devolvió los datos de autenticación.",
    );
  }

  return response.data as LoginResponse;
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
}
