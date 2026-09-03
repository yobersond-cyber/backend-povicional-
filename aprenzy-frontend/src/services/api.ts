// URL base donde está funcionando nuestro backend FastAPI
const API_URL = "http://localhost:8000";

// Realiza peticiones HTTP hacia nuestro backend
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  // Obtiene el JWT guardado en el navegador
  const token = localStorage.getItem("token");

  // Crea los encabezados de la petición
  const headers = new Headers(options.headers);

  // Indica que trabajaremos con información JSON
  headers.set("Content-Type", "application/json");

  // Agrega el JWT si existe una sesión
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  // Envía la petición al backend
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  // Convierte la respuesta del backend en JSON
  const data = await response.json();

  // Detecta errores enviados por FastAPI
  if (!response.ok) {
    throw new Error(
      data.detail || "Ocurrió un error en la petición",
    );
  }

  // Devuelve la respuesta del backend
  return data;
}