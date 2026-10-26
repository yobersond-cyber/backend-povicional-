import {
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiX,
} from "react-icons/fi";

import type { Incapacidad } from "../../services/incapacidad";

interface IncapacidadListProps {
  incapacidades: Incapacidad[];
  esAdministrador: boolean;

  onEditar: (incapacidad: Incapacidad) => void;

  onCambiarEstado: (
    incapacidad: Incapacidad,
    estado: Incapacidad["estado"],
  ) => void;
}

function obtenerTextoEstado(
  estado: Incapacidad["estado"],
): string {
  if (estado === "pendiente") {
    return "Pendiente";
  }

  if (estado === "aprobada") {
    return "Aprobada";
  }

  if (estado === "rechazada") {
    return "Rechazada";
  }

  return "Finalizada";
}

function obtenerClaseEstado(
  estado: Incapacidad["estado"],
): string {
  if (estado === "aprobada") {
    return "incapacidad-estado aprobada";
  }

  if (estado === "rechazada") {
    return "incapacidad-estado rechazada";
  }

  if (estado === "finalizada") {
    return "incapacidad-estado finalizada";
  }

  return "incapacidad-estado pendiente";
}

function formatearFecha(
  fecha: string,
): string {
  if (!fecha) {
    return "-";
  }

  const fechaNormalizada =
    fecha.includes("T")
      ? fecha.split("T")[0]
      : fecha;

  const partes =
    fechaNormalizada.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function IncapacidadList({
  incapacidades,
  esAdministrador,
  onEditar,
  onCambiarEstado,
}: IncapacidadListProps) {
  if (incapacidades.length === 0) {
    return (
      <div className="incapacidades-empty">
        <FiFileText />

        <h3>
          No hay incapacidades para mostrar
        </h3>

        <p>
          {esAdministrador
            ? "Todavía no existen incapacidades registradas."
            : "Cuando radiques una incapacidad aparecerá aquí."}
        </p>
      </div>
    );
  }

  return (
    <div className="incapacidades-list">
      {incapacidades.map((incapacidad) => (
        <article
          className="incapacidad-card"
          key={incapacidad.id_incapacidad}
        >
          <div className="incapacidad-card-header">
            <div>
              <h2 className="incapacidad-card-title">
                Radicado{" "}
                {incapacidad.numero_radicado}
              </h2>

              <div className="incapacidad-card-id">
                ID incapacidad:{" "}
                {incapacidad.id_incapacidad}

                {esAdministrador &&
                  ` · Estudiante ID: ${incapacidad.id_usuario}`}
              </div>
            </div>

            <span
              className={obtenerClaseEstado(
                incapacidad.estado,
              )}
            >
              {obtenerTextoEstado(
                incapacidad.estado,
              )}
            </span>
          </div>

          <div className="incapacidad-info-grid">
            <div className="incapacidad-info-item">
              <span>Fecha de inicio</span>

              <strong>
                {formatearFecha(
                  incapacidad.fecha_inicio,
                )}
              </strong>
            </div>

            <div className="incapacidad-info-item">
              <span>
                Fecha de finalización
              </span>

              <strong>
                {formatearFecha(
                  incapacidad.fecha_fin,
                )}
              </strong>
            </div>

            <div className="incapacidad-info-item">
              <span>
                Documento / archivo
              </span>

              <strong>
                {incapacidad.archivo}
              </strong>
            </div>
          </div>

          <div className="incapacidad-motivo">
            <strong>Motivo</strong>

            <p>{incapacidad.motivo}</p>
          </div>

          {incapacidad.apelacion && (
            <div className="incapacidad-apelacion">
              <strong>Apelación</strong>

              <p>
                Estado:{" "}
                {
                  incapacidad.apelacion
                    .estado
                }
              </p>

              <p>
                Motivo:{" "}
                {
                  incapacidad.apelacion
                    .motivo
                }
              </p>

              {incapacidad.apelacion
                .respuesta && (
                <p>
                  Respuesta:{" "}
                  {
                    incapacidad.apelacion
                      .respuesta
                  }
                </p>
              )}
            </div>
          )}

          {esAdministrador && (
            <div className="incapacidad-actions">
              <button
                type="button"
                className="incapacidades-button secondary"
                onClick={() =>
                  onEditar(incapacidad)
                }
              >
                <FiEdit2 />
                Editar
              </button>

              {incapacidad.estado ===
                "pendiente" && (
                <>
                  <button
                    type="button"
                    className="incapacidades-button success"
                    onClick={() =>
                      onCambiarEstado(
                        incapacidad,
                        "aprobada",
                      )
                    }
                  >
                    <FiCheckCircle />
                    Aprobar
                  </button>

                  <button
                    type="button"
                    className="incapacidades-button danger"
                    onClick={() =>
                      onCambiarEstado(
                        incapacidad,
                        "rechazada",
                      )
                    }
                  >
                    <FiX />
                    Rechazar
                  </button>
                </>
              )}

              {incapacidad.estado ===
                "aprobada" && (
                <button
                  type="button"
                  className="incapacidades-button warning"
                  onClick={() =>
                    onCambiarEstado(
                      incapacidad,
                      "finalizada",
                    )
                  }
                >
                  Finalizar
                </button>
              )}

              {incapacidad.estado ===
                "rechazada" && (
                <button
                  type="button"
                  className="incapacidades-button success"
                  onClick={() =>
                    onCambiarEstado(
                      incapacidad,
                      "aprobada",
                    )
                  }
                >
                  Reconsiderar
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}