
import { apiFetch } from "./api";

export interface Material {
  id_material: number;
  id_usuario: number;
  id_materia: number;
  id_curso?: number;
  titulo: string;
  descripcion: string | null;
  archivo: string | null;
  fecha_publicacion: string;
}

export interface AsignacionDocenteMaterial {
  id_asignacion: number;
  id_materia: number;
  id_curso: number;
  nombre_materia: string;
  numero_curso: string | number;
}

export interface CrearMaterialDatos {
  id_materia: number;
  id_curso: number;
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  archivo: File;
}

export async function obtenerMateriales(): Promise<Material[]> {
  const respuesta = await apiFetch("/materiales");
  return respuesta.data ?? respuesta;
}

export async function obtenerMaterial(id: number): Promise<Material> {
  const respuesta = await apiFetch(`/materiales/${id}`);
  return respuesta.data ?? respuesta;
}

export async function obtenerMisAsignaciones(): Promise<AsignacionDocenteMaterial[]> {
  const respuesta = await apiFetch("/docente-materia/mis-asignaciones");
  return respuesta.data ?? respuesta;
}

export async function crearMaterial(
  datos: CrearMaterialDatos
): Promise<Material> {
  const formulario = new FormData();

  formulario.append("id_materia", String(datos.id_materia));
  formulario.append("id_curso", String(datos.id_curso));
  formulario.append("titulo", datos.titulo);
  formulario.append("descripcion", datos.descripcion);
  formulario.append("fecha_publicacion", datos.fecha_publicacion);
  formulario.append("archivo", datos.archivo);

  const respuesta = await apiFetch("/materiales", {
    method: "POST",
    body: formulario,
  });

  return respuesta.data ?? respuesta;
}

export async function actualizarMaterial(
  id: number,
  datos: Partial<Material>
): Promise<Material> {
  const respuesta = await apiFetch(`/materiales/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });

  return respuesta.data ?? respuesta;
}

export async function eliminarMaterial(id: number): Promise<void> {
  await apiFetch(`/materiales/${id}`, {
    method: "DELETE",
  });
}
