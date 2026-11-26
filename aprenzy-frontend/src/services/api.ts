
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://backend-povicional-production.up.railway.app"
).replace(/\/+$/, "");

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  const esFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (esFormData) {
    headers.delete("Content-Type");
  } else if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const ruta = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${ruta}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  let data: any = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    let detalle = "Ocurrió un error en la petición.";

    if (typeof data?.detail === "string") {
      detalle = data.detail;
    } else if (Array.isArray(data?.detail)) {
      detalle = data.detail
        .map((error: any) => {
          const campo = Array.isArray(error.loc)
            ? error.loc
                .filter((parte: unknown) => parte !== "body")
                .join(".")
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
