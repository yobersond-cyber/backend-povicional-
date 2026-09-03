// Importa la función para comunicarse con FastAPI
import { apiFetch } from "./api";

// Representa un material académico
export interface Material {
  id_material: number;
  id_usuario: number;
  id_materia: number;
  titulo: string;
  descripcion: string | null;
  archivo: string | null;
  fecha_publicacion: string;
}

// Obtiene los materiales
export async function obtenerMateriales(): Promise<Material[]> {
  // Consulta los materiales al backend
  const respuesta = await apiFetch("/materiales");

  // Devuelve la información recibida
  return respuesta.data ?? respuesta;
}

// Obtiene un material específico
export async function obtenerMaterial(
  id: number,
): Promise<Material> {
  // Consulta el material indicado
  const respuesta = await apiFetch(`/materiales/${id}`);

  // Devuelve el material
  return respuesta.data ?? respuesta;
}

// Crea un material
export async function crearMaterial(
  datos: Omit<Material, "id_material">,
): Promise<Material> {
  // Envía el material al backend
  const respuesta = await apiFetch("/materiales", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  // Devuelve el material creado
  return respuesta.data ?? respuesta;
}

// Modifica un material
export async function actualizarMaterial(
  id: number,
  datos: Partial<Material>,
): Promise<Material> {
  // Envía los cambios al backend
  const respuesta = await apiFetch(
    `/materiales/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  // Devuelve el material actualizado
  return respuesta.data ?? respuesta;
}

// Elimina un material
export async function eliminarMaterial(
  id: number,
): Promise<void> {
  // Elimina el material
  await apiFetch(`/materiales/${id}`, {
    method: "DELETE",
  });
}