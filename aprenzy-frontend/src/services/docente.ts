import { apiFetch } from "./api";

// Resume una materia asignada al docente
export interface MateriaResumen {
  id_materia: number;
  codigo_materia: string;
  nombre_materia: string;
}

// Resume un curso asignado al docente
export interface CursoResumen {
  id_curso: number;
  numero_curso: string;
  grado: string;
  jornada: string;
}

// Representa un docente con sus asignaciones
export interface Docente {
  id_usuario: number;
  id_colegio: number;
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: string;
  jornada: string | null;
  materias_asignadas: MateriaResumen[];
  cursos_asignados: CursoResumen[];
}

// Obtiene todos los docentes del colegio
export async function obtenerDocentes(): Promise<Docente[]> {
  // Consulta los docentes al backend
  const respuesta = await apiFetch("/usuarios/docentes");

  // Devuelve solamente la información
  return respuesta.data;
}