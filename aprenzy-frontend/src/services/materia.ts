import { apiFetch } from "./api";

export interface Materia {
  id_materia: number;
  codigo_materia: string;
  nombre_materia: string;
  descripcion: string | null;
  id_curso: number;
}

export async function obtenerMaterias(): Promise<Materia[]> {
  const respuesta = await apiFetch("/materias/");

  return respuesta.data;
}

export async function obtenerMateria(
  idMateria: number,
): Promise<Materia> {
  const respuesta = await apiFetch(`/materias/${idMateria}`);

  return respuesta.data;
}