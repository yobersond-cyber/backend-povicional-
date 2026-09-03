// Importa la función para comunicarnos con FastAPI
import { apiFetch } from "./api";

// Estados permitidos por el backend
export type EstadoAcceso =
  | "activo"
  | "suspendido"
  | "finalizado";

// Representa un acceso académico
export interface AccesoAcademico {
  id_acceso: number;
  id_usuario: number;
  id_incapacidad: number;
  estado: EstadoAcceso;
}

// Obtiene todos los accesos
// Solo está permitido para administrador
export async function obtenerAccesos(): Promise<
  AccesoAcademico[]
> {
  // Consulta todos los accesos
  const respuesta = await apiFetch("/accesos");

  // Devuelve los datos
  return respuesta;
}

// Obtiene un acceso específico
// El estudiante solo puede consultar el suyo
export async function obtenerAcceso(
  id: number,
): Promise<AccesoAcademico> {
  // Consulta el acceso indicado
  const respuesta = await apiFetch(
    `/accesos/${id}`,
  );

  // Devuelve el acceso
  return respuesta;
}

// Crea un acceso académico
// Esta operación está permitida para administrador
export async function crearAcceso(
  datos: Omit<AccesoAcademico, "id_acceso">,
): Promise<AccesoAcademico> {
  // Envía los datos al backend
  const respuesta = await apiFetch("/accesos", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Devuelve el acceso creado
  return respuesta;
}