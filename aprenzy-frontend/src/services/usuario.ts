import { apiFetch } from "./api";

// Representa la información básica de un usuario
export interface Usuario {
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
}

export interface UsuarioCreate {
  id_colegio: number;
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario:
    | "estudiante"
    | "docente";
  jornada: string | null;
  contrasena: string;
  id_curso?: number | null;
}

// Representa una incapacidad asociada al estudiante
export interface IncapacidadResumen {
  id_incapacidad: number;
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
  estado: string;
  id_usuario: number;
}

// Representa un estudiante con sus incapacidades
export interface Estudiante extends Usuario {
  incapacidades: IncapacidadResumen[];
}

// Obtiene el usuario autenticado
export async function obtenerUsuario(): Promise<Usuario> {
  const respuesta = await apiFetch("/usuarios/me");

  return respuesta.data;
}

// Obtiene todos los estudiantes
export async function obtenerEstudiantes(): Promise<
  Estudiante[]
> {
  const respuesta = await apiFetch(
    "/usuarios/estudiantes",
  );

  return respuesta.data;
}

// Crea un estudiante o docente.
export async function crearUsuario(
  datos: UsuarioCreate,
): Promise<Usuario> {
  const respuesta = await apiFetch(
    "/usuarios",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );

  return respuesta.data;
}

// Obtiene un usuario por su ID
export async function obtenerUsuarioPorId(
  id: number,
): Promise<Usuario> {
  const respuesta = await apiFetch(
    `/usuarios/${id}`,
  );

  return respuesta.data;
}

// Actualiza un usuario
export async function actualizarUsuario(
  idUsuario: number,
  datos: Partial<UsuarioCreate>,
): Promise<Usuario> {
  const respuesta = await apiFetch(
    `/usuarios/${idUsuario}`,
    {
      method: "PUT",
      body: JSON.stringify(datos),
    },
  );

  return respuesta.data;
}

// Elimina un estudiante o docente
export async function eliminarUsuario(
  id: number,
): Promise<{
  id_usuario: number;
  nombre: string;
}> {
  const respuesta = await apiFetch(
    `/usuarios/${id}`,
    {
      method: "DELETE",
    },
  );

  return respuesta.data;
}

export async function obtenerDocentes(): Promise<Usuario[]> {
  const respuesta = await apiFetch(
    "/usuarios/docentes",
  );

  return respuesta.data;
}

