import { apiFetch } from "./api";

// Representa un cambio registrado sobre una incapacidad
export interface HistorialIncapacidad {
  id_historial: number;
  id_incapacidad: number;
  fecha_anterior_inicio: string;
  fecha_anterior_fin: string;
  fecha_nueva_inicio: string;
  fecha_nueva_fin: string;
  motivo_cambio: string;
  fecha_cambio: string;
  id_usuario_cambio: number;
}

// Obtiene todo el historial
export async function obtenerHistorial(): Promise<HistorialIncapacidad[]> {
  const respuesta = await apiFetch("/historial");
  return respuesta.data;
}

// Obtiene el historial de una incapacidad
export async function obtenerHistorialPorIncapacidad(
  idIncapacidad: number,
): Promise<HistorialIncapacidad[]> {
  const respuesta = await apiFetch(
    `/historial/incapacidad/${idIncapacidad}`,
  );

  return respuesta.data;
}