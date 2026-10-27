import { apiFetch } from "./api";

// Roles válidos de usuarios en Aprenzy.
export type TipoUsuario =
  | "administrador"
  | "coordinador"
  | "docente"
  | "estudiante";

// Información básica de un usuario.
export interface Usuario {
  id_usuario: number;
  id_colegio: number | null;
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;

  // Ahora TypeScript reconoce los roles permitidos.
  tipo_de_usuario: TipoUsuario;

  jornada: string | null;
}

// Datos permitidos para crear estudiantes y docentes.
// No incluimos administrador ni coordinador aquí,
// porque deben crearse mediante operaciones específicas.
export interface UsuarioCreate {
  id_colegio: number;
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;

  tipo_de_usuario: "estudiante" | "docente";

  jornada: string | null;
  contrasena: string;
  id_curso?: number | null;
}

// Resumen de una incapacidad asociada al estudiante.
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

// Representa un estudiante con sus incapacidades.
export interface Estudiante extends Usuario {
  incapacidades: IncapacidadResumen[];
}

// Obtiene el usuario autenticado.
export async function obtenerUsuario(): Promise<Usuario> {
  const respuesta = await apiFetch("/usuarios/me");

  return respuesta.data;
}

// Obtiene todos los estudiantes del colegio.
export async function obtenerEstudiantes(): Promise<Estudiante[]> {
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

// Obtiene un usuario por su ID.
export async function obtenerUsuarioPorId(
  id: number,
): Promise<Usuario> {
  const respuesta = await apiFetch(
    `/usuarios/${id}`,
  );

  return respuesta.data;
}

// Actualiza un usuario.
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

// Elimina un estudiante o docente.
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

// Obtiene los docentes del colegio.
export async function obtenerDocentes(): Promise<Usuario[]> {
  const respuesta = await apiFetch(
    "/usuarios/docentes",
  );

  return respuesta.data;
}