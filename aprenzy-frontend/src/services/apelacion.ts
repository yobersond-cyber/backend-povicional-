
import { apiFetch } from "./api";

// ============================================================
// TIPOS
// ============================================================

export type EstadoApelacion =
  | "pendiente"
  | "aprobada"
  | "rechazada";

export interface Apelacion {
  id_apelacion: number;
  id_incapacidad: number;
  fecha_apelacion: string;
  motivo: string;
  archivo: string | null;
  respuesta: string | null;
  estado: EstadoApelacion;
  id_revisor: number | null;
}

export interface ApelacionCrearDatos {
  numero_radicado: string;
  motivo: string;
  archivo?: File | null;
}

export interface ApelacionActualizarDatos {
  respuesta: string;
  estado: "aprobada" | "rechazada";
}

// ============================================================
// OBTENER TODAS LAS APELACIONES DEL USUARIO
// ============================================================

export async function obtenerApelaciones(): Promise<Apelacion[]> {
  const respuesta = await apiFetch("/apelaciones");

  return respuesta.data ?? [];
}

// ============================================================
// OBTENER UNA APELACIÓN
// ============================================================

export async function obtenerApelacion(
  id: number,
): Promise<Apelacion> {
  const respuesta = await apiFetch(`/apelaciones/${id}`);

  return respuesta.data;
}

// ============================================================
// CREAR UNA APELACIÓN
// El backend recibe multipart/form-data.
// No recibe IDs internos ni fechas desde el frontend.
// ============================================================

export async function crearApelacion(
  datos: ApelacionCrearDatos,
): Promise<Apelacion> {
  const formulario = new FormData();

  formulario.append(
    "numero_radicado",
    datos.numero_radicado.trim(),
  );

  formulario.append(
    "motivo",
    datos.motivo.trim(),
  );

  if (datos.archivo) {
    formulario.append(
      "archivo",
      datos.archivo,
    );
  }

  const respuesta = await apiFetch("/apelaciones", {
    method: "POST",
    body: formulario,
  });

  return respuesta.data;
}

// ============================================================
// ACTUALIZAR UNA APELACIÓN
// Solo el coordinador puede aprobar o rechazar.
// ============================================================

export async function actualizarApelacion(
  id: number,
  datos: ApelacionActualizarDatos,
): Promise<Apelacion> {
  const respuesta = await apiFetch(
    `/apelaciones/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        respuesta: datos.respuesta.trim(),
        estado: datos.estado,
      }),
    },
  );

  return respuesta.data;
}
