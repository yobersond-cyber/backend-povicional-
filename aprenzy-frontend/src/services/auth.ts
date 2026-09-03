// Importa nuestra función para comunicarnos con FastAPI
import { apiFetch } from "./api";

// Datos necesarios para iniciar sesión
interface LoginData {
  correo: string;
  contrasena: string;
}

// Información que devuelve el login
interface LoginResponse {
  access_token: string;
  token_type: string;
  id_usuario: number;
  tipo_de_usuario: string;
}

// Realiza el inicio de sesión contra FastAPI
export async function login(
  datos: LoginData,
): Promise<LoginResponse> {
  // Envía las credenciales al endpoint de login
  const response = await apiFetch("/usuarios/login", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Guarda los datos de autenticación
  localStorage.setItem(
    "token",
    response.data.access_token,
  );

  // Guarda el rol del usuario
  localStorage.setItem(
    "rol",
    response.data.tipo_de_usuario,
  );

  // Devuelve la información del usuario autenticado
  return response.data;
}

// Cierra la sesión actual
export function logout() {
  // Elimina el token almacenado
  localStorage.removeItem("token");

  // Elimina el rol almacenado
  localStorage.removeItem("rol");
}