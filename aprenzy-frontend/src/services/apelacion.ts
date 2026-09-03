// Importa el cliente central de la API
import { apiFetch } from "./api";

// Representa una apelación
export interface Apelacion {
  id_apelacion: number;
  id_incapacidad: number;
  fecha_apelacion: string;
  motivo: string;
  respuesta: string | null;
  estado: "pendiente" | "aprobada" | "rechazada";
  id_revisor: number | null;
}

// Datos para crear o actualizar una apelación
export interface ApelacionDatos {
  id_incapacidad: number;
  fecha_apelacion: string;
  motivo: string;
  respuesta?: string | null;
  estado?:
    | "pendiente"
    | "aprobada"
    | "rechazada";
  id_revisor?: number | null;
}

// Obtiene todas las apelaciones
export async function obtenerApelaciones(): Promise<
  Apelacion[]
> {
  // Consulta el listado del backend
  const respuesta =
    await apiFetch("/apelaciones");

  // Devuelve los datos
  return respuesta.data;
}

// Obtiene una apelación específica
export async function obtenerApelacion(
  id: number,
): Promise<Apelacion> {
  // Consulta la apelación
  const respuesta =
    await apiFetch(`/apelaciones/${id}`);

  // Devuelve la apelación
  return respuesta.data;
}

// Crea una nueva apelación
export async function crearApelacion(
  datos: ApelacionDatos,
): Promise<Apelacion> {
  // Envía la apelación al backend
  const respuesta =
    await apiFetch("/apelaciones", {
      method: "POST",
      body: JSON.stringify({
        id_incapacidad:
          datos.id_incapacidad,
        fecha_apelacion:
          datos.fecha_apelacion,
        motivo: datos.motivo,
        respuesta:
          datos.respuesta ?? null,
        estado:
          datos.estado ?? "pendiente",
        id_revisor:
          datos.id_revisor ?? null,
      }),
    });

  // Devuelve la apelación creada
  return respuesta.data;
}

// Actualiza una apelación
export async function actualizarApelacion(
  id: number,
  datos: ApelacionDatos,
): Promise<Apelacion> {
  // Envía los cambios al backend
  const respuesta =
    await apiFetch(`/apelaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        id_incapacidad:
          datos.id_incapacidad,
        fecha_apelacion:
          datos.fecha_apelacion,
        motivo: datos.motivo,
        respuesta:
          datos.respuesta ?? null,
        estado:
          datos.estado ?? "pendiente",
        id_revisor:
          datos.id_revisor ?? null,
      }),
    });

  // Devuelve la apelación actualizada
  return respuesta.data;
}