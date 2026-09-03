// Importa la función para comunicarse con FastAPI
import { apiFetch } from "./api";

// Representa una entrega académica
export interface Entrega {
  id_entrega: number;
  id_actividad: number;
  id_usuario: number;
  fecha_entrega: string;
  estado: "Aprobado" | "Reprobado";
  descripcion: string;
  comentario_docente: string | null;
  archivo: string | null;
  nota: number | null;
}

// Obtiene las entregas permitidas para el usuario
export async function obtenerEntregas(): Promise<
  Entrega[]
> {
  const respuesta = await apiFetch("/entregas");

  return respuesta.data ?? respuesta;
}

// Obtiene una entrega específica
export async function obtenerEntrega(
  id: number,
): Promise<Entrega> {
  const respuesta = await apiFetch(
    `/entregas/${id}`,
  );

  return respuesta.data ?? respuesta;
}

// Crea una entrega
export async function crearEntrega(
  datos: Omit<Entrega, "id_entrega">,
): Promise<Entrega> {
  const respuesta = await apiFetch("/entregas", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data ?? respuesta;
}

// Registra una calificación
export async function calificarEntrega(
  id: number,
  nota: number,
): Promise<Entrega> {
  const respuesta = await apiFetch(
    `/entregas/${id}/calificacion`,
    {
      method: "PUT",
      body: JSON.stringify({
        nota,
      }),
    },
  );

  return respuesta.data ?? respuesta;
}