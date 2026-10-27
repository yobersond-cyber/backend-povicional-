import { apiFetch } from "./api";

// Estados posibles de una entrega.
export type EstadoEntrega =
  | "Pendiente"
  | "Aprobado"
  | "Reprobado";

// Información completa de una entrega.
export interface Entrega {
  id_entrega: number;
  id_actividad: number;
  id_usuario: number;
  fecha_entrega: string;
  estado: EstadoEntrega;
  descripcion: string;
  comentario_docente: string | null;
  archivo: string | null;
  nota: number | null;
}

// Datos que puede enviar el estudiante.
// El estado, la nota y el comentario del docente
// son responsabilidad del backend.
export interface CrearEntregaDatos {
  id_actividad: number;
  id_usuario: number;
  fecha_entrega: string;
  descripcion: string;
  archivo?: string | null;
}

// Consulta las entregas permitidas para el usuario.
export async function obtenerEntregas(): Promise<Entrega[]> {
  const respuesta = await apiFetch("/entregas");

  return respuesta.data ?? respuesta;
}

// Consulta una entrega específica.
export async function obtenerEntrega(
  id: number,
): Promise<Entrega> {
  const respuesta = await apiFetch(
    `/entregas/${id}`,
  );

  return respuesta.data ?? respuesta;
}

// Registra una entrega.
// El backend establece el estado inicial Pendiente.
export async function crearEntrega(
  datos: CrearEntregaDatos,
): Promise<Entrega> {
  const respuesta = await apiFetch(
    "/entregas",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );

  return respuesta.data ?? respuesta;
}

// Registra la calificación del docente.
export async function calificarEntrega(
  id: number,
  nota: number,
): Promise<Entrega> {
  const respuesta = await apiFetch(
    `/entregas/${id}/calificacion`,
    {
      method: "PUT",
      body: JSON.stringify({ nota }),
    },
  );

  return respuesta.data ?? respuesta;
}