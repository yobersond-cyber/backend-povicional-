
// URL del backend según el entorno.
// En producción utiliza Railway y en desarrollo localhost.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

// Realiza peticiones HTTP hacia nuestro backend.
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  // Obtiene el JWT guardado en el navegador.
  const token = localStorage.getItem("token");

  // Prepara los encabezados.
  const headers = new Headers(options.headers);

  // Detecta si se está enviando un archivo.
  const esFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  // Para FormData el navegador debe establecer
  // automáticamente el Content-Type con su boundary.
  if (esFormData) {
    headers.delete("Content-Type");
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Agrega el JWT si existe una sesión.
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  // Envía la petición al backend.
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  // Permite respuestas sin contenido.
  if (response.status === 204) {
    return null;
  }

  // Lee la respuesta sin asumir que siempre es JSON.
  const responseText = await response.text();

  let data: any = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  // Detecta errores enviados por FastAPI.
  if (!response.ok) {
    const detalle =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail
              .map((error: any) => error.msg || "Error de validación")
              .join(", ")
          : "Ocurrió un error en la petición";

    throw new Error(detalle);
  }

  return data;
}
