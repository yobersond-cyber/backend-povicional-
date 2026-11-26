
import { apiFetch } from "./api";

export type EstadoAprobacion =
  | "pendiente"
  | "aprobada"
  | "rechazada";

export interface SolicitudEstudiante {
  id_usuario: number;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  correo: string;
  telefono?: string | null;
  estado_aprobacion: EstadoAprobacion;
}

export async function obtenerSolicitudesEstudiantes(): Promise<
  SolicitudEstudiante[]
> {
  const respuesta = await apiFetch(
    "/usuarios/solicitudes-estudiantes"
  );

  return respuesta.data ?? [];
}

export async function actualizarAprobacionEstudiante(
  idUsuario: number,
  estado: "aprobada" | "rechazada"
): Promise<SolicitudEstudiante> {
  const respuesta = await apiFetch(
    `/usuarios/${idUsuario}/aprobacion`,
    {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }
  );

  return respuesta.data;
}
