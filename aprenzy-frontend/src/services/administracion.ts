import { apiFetch } from "./api";

// ============================================
// TIPOS DE DATOS
// ============================================

export type EstadoColegio = "activo" | "inactivo";

export interface Colegio {
  id_colegio: number;
  nombre_colegio: string;
  codigo_dane: string | null;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  correo_institucional: string | null;
  municipio: string | null;
  departamento: string | null;
  estado: EstadoColegio;
  fecha_creacion: string;
}

export interface Coordinador {
  id_usuario: number;
  id_colegio: number;
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: "coordinador";
}

export interface DatosCoordinador {
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

export interface DatosColegio {
  nombre_colegio: string;
  codigo_dane?: string | null;
  nit?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo_institucional?: string | null;
  municipio?: string | null;
  departamento?: string | null;
  estado: EstadoColegio;
}

export interface CrearColegioPayload {
  colegio: DatosColegio;
  coordinador: DatosCoordinador;
}

export interface CrearCoordinadorPayload
  extends DatosCoordinador {
  id_colegio: number;
}

export interface ColegioConCoordinador {
  colegio: Colegio;
  coordinador: Coordinador;
}

// ============================================
// RESPUESTA ESTÁNDAR DEL BACKEND
// ============================================

interface RespuestaAPI<T> {
  success: boolean;
  mensaje: string;
  data: T | null;
}

async function obtenerData<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const respuesta =
    (await apiFetch(
      endpoint,
      options,
    )) as RespuestaAPI<T>;

  if (!respuesta.success || respuesta.data === null) {
    throw new Error(
      respuesta.mensaje ||
        "El servidor no devolvió los datos esperados.",
    );
  }

  return respuesta.data;
}

// ============================================
// CONSULTAR COLEGIOS
// ============================================

export async function listarColegios(): Promise<Colegio[]> {
  return obtenerData<Colegio[]>("/colegios");
}

// ============================================
// CONSULTAR UN COLEGIO
// ============================================

export async function obtenerColegio(
  idColegio: number,
): Promise<Colegio> {
  return obtenerData<Colegio>(
    `/colegios/${idColegio}`,
  );
}

// ============================================
// CREAR COLEGIO Y SU COORDINADOR INICIAL
// ============================================

export async function crearColegio(
  datos: CrearColegioPayload,
): Promise<ColegioConCoordinador> {
  return obtenerData<ColegioConCoordinador>(
    "/colegios",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );
}

// ============================================
// CONSULTAR COORDINADORES
// ============================================

export async function listarCoordinadores(): Promise<
  Coordinador[]
> {
  return obtenerData<Coordinador[]>(
    "/usuarios/coordinadores",
  );
}

// ============================================
// CREAR COORDINADOR EN UN COLEGIO EXISTENTE
// ============================================

export async function crearCoordinador(
  datos: CrearCoordinadorPayload,
): Promise<Coordinador> {
  return obtenerData<Coordinador>(
    "/usuarios/coordinadores",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );
}