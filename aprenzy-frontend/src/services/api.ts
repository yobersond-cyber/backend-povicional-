
// URL del backend según el entorno.
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

  // Configura el tipo de contenido.
  if (esFormData) {
    headers.delete("Content-Type");
  } else if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
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
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      },
    );
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  }

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
    let detalle = "Ocurrió un error en la petición.";

    if (typeof data?.detail === "string") {
      detalle = data.detail;
    } else if (Array.isArray(data?.detail)) {
      detalle = data.detail
        .map((error: any) => {
          const campo = Array.isArray(error.loc)
            ? error.loc.filter(
                (parte: unknown) => parte !== "body",
              ).join(".")
            : "";

          return campo
            ? `${campo}: ${error.msg || "Dato inválido"}`
            : error.msg || "Error de validación";
        })
        .join(", ");
    } else if (typeof data?.message === "string") {
      detalle = data.message;
    } else if (typeof data === "string" && data) {
      detalle = data;
    }

    throw new Error(detalle);
  }

  return data;
}
