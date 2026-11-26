
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

// Obtiene los accesos académicos del usuario autenticado.
// El coordinador consulta los de su colegio.
// El estudiante consulta los propios.
export async function obtenerAccesos(): Promise<
  AccesoAcademico[]
> {
  const respuesta = await apiFetch("/accesos");

  return respuesta.data ?? [];
}

// Obtiene un acceso académico específico
export async function obtenerAcceso(
  id: number,
): Promise<AccesoAcademico> {
  const respuesta = await apiFetch(
    `/accesos/${id}`,
  );

  return respuesta.data;
}

// Crea un acceso académico a partir del radicado
// de una incapacidad aprobada.
export async function crearAcceso(
  datos: { numero_radicado: string },
): Promise<AccesoAcademico> {
  const respuesta = await apiFetch("/accesos", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}
