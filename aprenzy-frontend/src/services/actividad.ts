// Importa la función para realizar peticiones al backend
import { apiFetch } from "./api";

// Representa una actividad académica
export interface Actividad {
  id_actividad: number;
  id_usuario: number;
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  fecha_limite: string;
  id_materia: number;
}

// Representa una actividad vista por un estudiante
export interface ActividadEstudiante extends Actividad {
  estado: string;
}

// Obtiene las actividades del estudiante autenticado
export async function obtenerMisActividades(): Promise<
  ActividadEstudiante[]
> {
  // Consulta las actividades del usuario
  const respuesta = await apiFetch(
    "/usuarios/mis-actividades",
  );

  // Devuelve únicamente la información de data
  return respuesta.data;
}

// Obtiene todas las actividades
export async function obtenerActividades(): Promise<
  Actividad[]
> {
  // Consulta todas las actividades
  const respuesta = await apiFetch("/actividades");

  // Devuelve los datos recibidos
  return respuesta.data ?? respuesta;
}

// Obtiene una actividad específica
export async function obtenerActividad(
  id: number,
): Promise<Actividad> {
  // Consulta la actividad
  const respuesta = await apiFetch(
    `/actividades/${id}`,
  );

  // Devuelve la actividad
  return respuesta.data ?? respuesta;
}

// Crea una actividad
export async function crearActividad(
  datos: Omit<Actividad, "id_actividad">,
): Promise<Actividad> {
  // Envía la nueva actividad
  const respuesta = await apiFetch("/actividades", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Devuelve la actividad creada
  return respuesta.data ?? respuesta;
}

// Actualiza una actividad
export async function actualizarActividad(
  id: number,
  datos: Partial<Actividad>,
): Promise<Actividad> {
  // Envía los cambios al backend
  const respuesta = await apiFetch(
    `/actividades/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve la actividad actualizada
  return respuesta.data ?? respuesta;
}