// Importa la función central para comunicarnos con FastAPI
import { apiFetch } from "./api";

// Representa una incapacidad
export interface Incapacidad {
  id_incapacidad: number;
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
  estado: "pendiente" | "aprobada" | "rechazada" | "finalizada";
  id_usuario: number;
  apelacion?: ApelacionResumen | null;
}

// Representa el resumen de una apelación
export interface ApelacionResumen {
  id_apelacion: number;
  fecha_apelacion: string;
  motivo: string;
  respuesta: string | null;
  estado: string;
}

// Datos necesarios para crear una incapacidad
export interface CrearIncapacidadDatos {
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
  id_usuario: number;
}

// Datos necesarios para actualizar una incapacidad
export interface ActualizarIncapacidadDatos {
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
  estado: string;
  motivo_cambio: string;
  id_usuario_cambio: number;
}

// Obtiene todas las incapacidades
// Solo funciona para administrador según el backend
export async function obtenerIncapacidades(): Promise<
  Incapacidad[]
> {
  // Consulta todas las incapacidades
  const respuesta = await apiFetch("/incapacidades");

  // Devuelve los datos recibidos
  return respuesta.data;
}

// Obtiene una incapacidad específica
// Un estudiante solo puede consultar una propia
export async function obtenerIncapacidad(
  id: number,
): Promise<Incapacidad> {
  // Consulta la incapacidad indicada
  const respuesta = await apiFetch(
    `/incapacidades/${id}`,
  );

  // Devuelve la incapacidad
  return respuesta.data;
}

// Crea una incapacidad
export async function crearIncapacidad(
  datos: CrearIncapacidadDatos,
): Promise<Incapacidad> {
  // Envía la información al backend
  const respuesta = await apiFetch(
    "/incapacidades",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve la incapacidad creada
  return respuesta.data;
}

// Actualiza completamente una incapacidad
// Solo administrador
export async function actualizarIncapacidad(
  id: number,
  datos: ActualizarIncapacidadDatos,
): Promise<Incapacidad> {
  // Envía la actualización al backend
  const respuesta = await apiFetch(
    `/incapacidades/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve la incapacidad actualizada
  return respuesta.data;
}

// Cambia únicamente el estado
// Solo administrador
export async function cambiarEstadoIncapacidad(
  id: number,
  estado: Incapacidad["estado"],
): Promise<Incapacidad> {
  // Envía el nuevo estado como query parameter
  const respuesta = await apiFetch(
    `/incapacidades/${id}/estado?estado=${encodeURIComponent(
      estado,
    )}`,
    {
      method: "PUT",
    },
  );

  // Devuelve la incapacidad actualizada
  return respuesta.data;
}