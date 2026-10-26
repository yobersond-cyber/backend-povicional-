import { apiFetch } from "./api";

export interface UsuarioCurso {
  id_usuario_curso: number;
  id_usuario: number;
  id_curso: number;
}

export interface DocenteMateria {
  id_docente_materia: number;
  id_usuario: number;
  id_materia: number;
}

// ===============================
// ESTUDIANTE → CURSO
// ===============================

export async function asignarUsuarioCurso(
  datos: Omit<UsuarioCurso, "id_usuario_curso">,
): Promise<UsuarioCurso> {
  const respuesta = await apiFetch("/usuario-curso", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}

export async function eliminarUsuarioCurso(
  idUsuarioCurso: number,
): Promise<void> {
  await apiFetch(`/usuario-curso/${idUsuarioCurso}`, {
    method: "DELETE",
  });
}

// ===============================
// DOCENTE → MATERIA
// ===============================

export async function asignarDocenteMateria(
  datos: Omit<DocenteMateria, "id_docente_materia">,
): Promise<DocenteMateria> {
  const respuesta = await apiFetch("/docente-materia", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}

export async function obtenerAsignacionesDocenteMateria(): Promise<
  DocenteMateria[]
> {
  const respuesta = await apiFetch("/docente-materia");

  return respuesta.data;
}

export async function eliminarDocenteMateria(
  idDocenteMateria: number,
): Promise<void> {
  await apiFetch(`/docente-materia/${idDocenteMateria}`, {
    method: "DELETE",
  });
}