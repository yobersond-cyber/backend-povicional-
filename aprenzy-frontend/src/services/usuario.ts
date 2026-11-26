
import { apiFetch } from "./api";

// Roles válidos de usuarios en Aprenzy.
export type TipoUsuario =
  | "administrador"
  | "rector"
  | "coordinador"
  | "docente"
  | "estudiante";

// Información básica de un usuario.
export interface Usuario {
  id_usuario: number;
  id_colegio: number | null;
  codigo_usuario?: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: TipoUsuario;
  jornada: string | null;
  estado_aprobacion?: string | null;
}

// Datos para crear estudiantes y docentes desde paneles internos.
// El colegio se asigna automáticamente desde el backend.
export interface UsuarioCreate {
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: "estudiante" | "docente";
  contrasena: string;
  jornada?: string | null;
  id_curso?: number | null;
}

// Datos para crear coordinadores desde el panel del rector.
export interface CoordinadorCreate {
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  contrasena: string;
  tipo_de_usuario: "coordinador";
}

// Colegio disponible para el registro público.
export interface ColegioDisponible {
  id_colegio: number;
  nombre_colegio: string;
}

// Curso disponible para el registro público.
export interface CursoDisponible {
  id_curso: number;
  numero_curso: string | number;
  grado: string | number;
  jornada: string;
}

// Datos del registro público de estudiantes.
export interface RegistroEstudianteCreate {
  id_colegio: number;
  id_curso: number;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  contrasena: string;
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

// ============================================================
// REGISTRO PÚBLICO
// ============================================================

// Obtiene los colegios activos disponibles para registrarse.
export async function obtenerColegiosDisponibles(): Promise<
  ColegioDisponible[]
> {
  const respuesta = await apiFetch(
    "/usuarios/colegios-disponibles",
  );

  return respuesta.data ?? [];
}

// Obtiene los cursos pertenecientes al colegio seleccionado.
export async function obtenerCursosDisponibles(
  idColegio: number,
): Promise<CursoDisponible[]> {
  const respuesta = await apiFetch(
    `/usuarios/colegios/${idColegio}/cursos-disponibles`,
  );

  return respuesta.data ?? [];
}

// Registra un estudiante mediante el endpoint público.
// La cuenta queda pendiente de aprobación.
export async function registrarEstudiante(
  datos: RegistroEstudianteCreate,
): Promise<Usuario> {
  const respuesta = await apiFetch(
    "/usuarios/registro-estudiante",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );

  return respuesta.data;
}

// ============================================================
// USUARIO AUTENTICADO
// ============================================================

// Obtiene el usuario autenticado.
export async function obtenerUsuario(): Promise<Usuario> {
  const respuesta = await apiFetch("/usuarios/me");

  return respuesta.data;
}

// ============================================================
// ESTUDIANTES
// ============================================================

// Obtiene todos los estudiantes del colegio.
export async function obtenerEstudiantes(): Promise<Estudiante[]> {
  const respuesta = await apiFetch("/usuarios/estudiantes");

  return respuesta.data;
}

// Crea un estudiante o docente desde un panel autorizado.
export async function crearUsuario(
  datos: UsuarioCreate,
): Promise<Usuario> {
  const respuesta = await apiFetch("/usuarios", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}

// ============================================================
// CONSULTA Y ACTUALIZACIÓN DE USUARIOS
// ============================================================

// Obtiene un usuario por su ID.
export async function obtenerUsuarioPorId(
  id: number,
): Promise<Usuario> {
  const respuesta = await apiFetch(`/usuarios/${id}`);

  return respuesta.data;
}

// Actualiza un usuario.
export async function actualizarUsuario(
  idUsuario: number,
  datos: Partial<UsuarioCreate>,
): Promise<Usuario> {
  const respuesta = await apiFetch(`/usuarios/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}

// Elimina un estudiante o docente.
export async function eliminarUsuario(
  id: number,
): Promise<{
  id_usuario: number;
  nombre: string;
}> {
  const respuesta = await apiFetch(`/usuarios/${id}`, {
    method: "DELETE",
  });

  return respuesta.data;
}

// Obtiene los docentes del colegio.
export async function obtenerDocentes(): Promise<Usuario[]> {
  const respuesta = await apiFetch("/usuarios/docentes");

  return respuesta.data;
}

// ============================================================
// GESTIÓN DE COORDINADORES POR EL RECTOR
// ============================================================

// Obtiene los coordinadores del colegio del rector autenticado.
export async function obtenerCoordinadores(): Promise<Usuario[]> {
  const respuesta = await apiFetch("/usuarios/coordinadores");

  return respuesta.data;
}

// Crea un coordinador en el colegio del rector autenticado.
export async function crearCoordinador(
  datos: CoordinadorCreate,
): Promise<Usuario> {
  const respuesta = await apiFetch("/usuarios", {
    method: "POST",
    body: JSON.stringify(datos),
  });

  return respuesta.data;
}
