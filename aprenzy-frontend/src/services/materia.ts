// Importa la función para comunicarse con FastAPI
import { apiFetch } from "./api";

// Representa una materia académica
export interface Materia {
  id_materia: number;
  codigo_materia: string;
  nombre_materia: string;
  descripcion: string | null;
  id_curso: number;
}

// Obtiene todas las materias
export async function obtenerMaterias(): Promise<Materia[]> {
  // Consulta las materias
  const respuesta = await apiFetch("/materias/");

  // Devuelve la información de data
  return respuesta.data ?? respuesta;
}

// Obtiene una materia
export async function obtenerMateria(
  id: number,
): Promise<Materia> {
  // Consulta la materia
  const respuesta = await apiFetch(
    `/materias/${id}`,
  );

  // Devuelve la materia
  return respuesta.data ?? respuesta;
}

// Crea una materia
export async function crearMateria(
  datos: Omit<Materia, "id_materia">,
): Promise<Materia> {
  // Envía la materia al backend
  const respuesta = await apiFetch("/materias/", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Devuelve la materia creada
  return respuesta.data ?? respuesta;
}

// Actualiza una materia
export async function actualizarMateria(
  id: number,
  datos: Partial<Materia>,
): Promise<Materia> {
  // Envía los cambios
  const respuesta = await apiFetch(
    `/materias/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve la materia actualizada
  return respuesta.data ?? respuesta;
}

// Elimina una materia
export async function eliminarMateria(
  id: number,
): Promise<void> {
  // Elimina la materia
  await apiFetch(`/materias/${id}`, {
    method: "DELETE",
  });
}