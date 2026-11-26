
import { apiFetch } from "./api";

// Representa una incapacidad
export interface Incapacidad {
  id_incapacidad: number;
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
  estado: "pendiente" | "aprobada" | "rechazada" | "finalizada";
  id_usuario: number;
  observacion_revision?: string | null;
  apelacion?: ApelacionResumen | null;
}

// Representa el resumen de una apelación
export interface ApelacionResumen {
  id_apelacion: number;
  fecha_apelacion: string;
  motivo: string;
  respuesta: string | null;
  estado: string;
}

// Datos necesarios para crear una incapacidad
export interface CrearIncapacidadDatos {
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: File;
  motivo: string;
}

// Datos necesarios para actualizar una incapacidad
export interface ActualizarIncapacidadDatos {
  fecha_inicio: string;
  fecha_fin: string;
  archivo?: File | null;
  motivo: string;
  estado: Incapacidad["estado"];
  motivo_cambio: string;
  observacion_revision?: string;
}

// Obtiene las incapacidades del usuario autenticado.
// El backend devuelve las propias al estudiante y las
// de todo su colegio al coordinador.
export async function obtenerIncapacidades(): Promise<
  Incapacidad[]
> {
  const respuesta = await apiFetch("/incapacidades");

  return respuesta.data ?? [];
}

// Obtiene una incapacidad específica
export async function obtenerIncapacidad(
  id: number,
): Promise<Incapacidad> {
  const respuesta = await apiFetch(
    `/incapacidades/${id}`,
  );

  return respuesta.data;
}

// Crea una incapacidad enviando el documento real.
// El backend obtiene el usuario desde el token.
export async function crearIncapacidad(
  datos: CrearIncapacidadDatos,
): Promise<Incapacidad> {
  const formulario = new FormData();

  formulario.append(
    "numero_radicado",
    datos.numero_radicado,
  );

  formulario.append(
    "fecha_inicio",
    datos.fecha_inicio,
  );

  formulario.append(
    "fecha_fin",
    datos.fecha_fin,
  );

  formulario.append(
    "motivo",
    datos.motivo,
  );

  formulario.append(
    "archivo",
    datos.archivo,
  );

  const respuesta = await apiFetch(
    "/incapacidades",
    {
      method: "POST",
      body: formulario,
    },
  );

  return respuesta.data;
}

// Actualiza una incapacidad.
// El backend exige multipart/form-data.
export async function actualizarIncapacidad(
  id: number,
  datos: ActualizarIncapacidadDatos,
): Promise<Incapacidad> {
  const formulario = new FormData();

  formulario.append(
    "fecha_inicio",
    datos.fecha_inicio,
  );

  formulario.append(
    "fecha_fin",
    datos.fecha_fin,
  );

  formulario.append(
    "motivo",
    datos.motivo,
  );

  formulario.append(
    "estado",
    datos.estado,
  );

  formulario.append(
    "motivo_cambio",
    datos.motivo_cambio,
  );

  if (datos.observacion_revision?.trim()) {
    formulario.append(
      "observacion_revision",
      datos.observacion_revision.trim(),
    );
  }

  if (datos.archivo) {
    formulario.append(
      "archivo",
      datos.archivo,
    );
  }

  const respuesta = await apiFetch(
    `/incapacidades/${id}`,
    {
      method: "PUT",
      body: formulario,
    },
  );

  return respuesta.data;
}

// Cambia el estado utilizando el endpoint PUT existente.
// Se conserva esta función para mantener compatibilidad
// con otros componentes que pudieran utilizarla.
export async function cambiarEstadoIncapacidad(
  id: number,
  estado: Incapacidad["estado"],
): Promise<Incapacidad> {
  const incapacidad = await obtenerIncapacidad(id);

  return actualizarIncapacidad(id, {
    fecha_inicio: incapacidad.fecha_inicio.split("T")[0],
    fecha_fin: incapacidad.fecha_fin.split("T")[0],
    motivo: incapacidad.motivo,
    estado,
    motivo_cambio: "Actualización del estado de la incapacidad.",
    observacion_revision:
      estado === "aprobada" || estado === "rechazada"
        ? "Revisión realizada por el coordinador."
        : undefined,
  });
}
