import { apiFetch } from "./api";

// Representa un curso académico
export interface Curso {
  id_curso: number;
  id_colegio: number;
  numero_curso: string;
  grado: string;
  jornada: string;
}

// Representa los datos para crear o actualizar
export type CursoDatos = Omit<
  Curso,
  "id_curso"
>;

// Obtiene todos los cursos
export async function obtenerCursos(): Promise<Curso[]> {
  // Consulta los cursos
  const respuesta = await apiFetch("/cursos");

  // Devuelve los datos
  return respuesta.data;
}

// Obtiene un curso
export async function obtenerCurso(
  id: number,
): Promise<Curso> {
  // Consulta el curso
  const respuesta = await apiFetch(
    `/cursos/${id}`,
  );

  // Devuelve los datos
  return respuesta.data;
}

// Crea un curso
export async function crearCurso(
  datos: CursoDatos,
): Promise<Curso> {
  // Envía el curso al backend
  const respuesta = await apiFetch("/cursos", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Devuelve el curso creado
  return respuesta.data;
}

// Actualiza un curso
export async function actualizarCurso(
  id: number,
  datos: CursoDatos,
): Promise<Curso> {
  // Envía todos los datos requeridos
  const respuesta = await apiFetch(
    `/cursos/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve el curso actualizado
  return respuesta.data;
}