
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

export interface Rector {
  id_usuario: number;
  id_colegio: number;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  tipo_de_usuario: "rector";
}

export interface DatosRector {
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
}

export interface CrearColegioPayload {
  colegio: DatosColegio;
  rector: DatosRector;
}

export interface ColegioConRector {
  colegio: Colegio;
  rector: Rector;
}

export interface ResumenInstitucional {
  totalColegios: number;
  colegiosActivos: number;
  colegiosInactivos: number;
}

interface RespuestaAPI<T> {
  success: boolean;
  mensaje: string;
  data: T | null;
}

async function obtenerData<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const respuesta = await apiFetch(
    endpoint,
    options,
  ) as RespuestaAPI<T>;

  if (!respuesta.success || respuesta.data === null) {
    throw new Error(
      respuesta.mensaje ||
        "El servidor no devolvió los datos esperados.",
    );
  }

  return respuesta.data;
}

// ============================================
// COLEGIOS
// ============================================

export async function listarColegios(): Promise<Colegio[]> {
  return obtenerData<Colegio[]>("/colegios");
}

export async function obtenerColegio(
  idColegio: number,
): Promise<Colegio> {
  return obtenerData<Colegio>(
    `/colegios/${idColegio}`,
  );
}

export async function crearColegio(
  datos: CrearColegioPayload,
): Promise<ColegioConRector> {
  return obtenerData<ColegioConRector>(
    "/colegios",
    {
      method: "POST",
      body: JSON.stringify(datos),
    },
  );
}

export async function actualizarEstadoColegio(
  idColegio: number,
  estado: EstadoColegio,
): Promise<Colegio> {
  return obtenerData<Colegio>(
    `/colegios/${idColegio}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    },
  );
}

// ============================================
// RESUMEN ESTADÍSTICO INSTITUCIONAL
// ============================================

export async function obtenerResumenInstitucional(): Promise<ResumenInstitucional> {
  const colegios = await listarColegios();

  return {
    totalColegios: colegios.length,
    colegiosActivos: colegios.filter(
      (colegio) => colegio.estado === "activo",
    ).length,
    colegiosInactivos: colegios.filter(
      (colegio) => colegio.estado === "inactivo",
    ).length,
  };
}
