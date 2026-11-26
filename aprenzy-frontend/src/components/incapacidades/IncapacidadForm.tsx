
import type { FormEvent } from "react";
import { FiX, FiFileText } from "react-icons/fi";

import type { Incapacidad } from "../../services/incapacidad";

export interface FormularioIncapacidad {
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: File | null;
  motivo: string;
  estado: Incapacidad["estado"];
  observacion_revision: string;
}

interface IncapacidadFormProps {
  mostrar: boolean;
  guardando: boolean;
  incapacidadEditando: Incapacidad | null;
  formulario: FormularioIncapacidad;
  motivoCambio: string;
  esCoordinador: boolean;

  onSubmit: (
    evento: FormEvent<HTMLFormElement>,
  ) => void;

  onClose: () => void;

  onChange: (
    campo: keyof FormularioIncapacidad,
    valor: string | File | null,
  ) => void;

  onMotivoCambio: (valor: string) => void;
}

export default function IncapacidadForm({
  mostrar,
  guardando,
  incapacidadEditando,
  formulario,
  motivoCambio,
  esCoordinador,
  onSubmit,
  onClose,
  onChange,
  onMotivoCambio,
}: IncapacidadFormProps) {
  if (!mostrar) {
    return null;
  }

  const requiereObservacion =
    formulario.estado === "aprobada" ||
    formulario.estado === "rechazada";

  return (
    <div className="incapacidades-overlay">
      <div className="incapacidades-modal">
        <div className="incapacidades-modal-header">
          <div>
            <h2>
              {incapacidadEditando
                ? "Revisar incapacidad"
                : "Radicar incapacidad"}
            </h2>

            <p>
              {incapacidadEditando
                ? "Revisa la información y registra el resultado de la solicitud."
                : "Completa la información y adjunta el documento que respalda tu incapacidad."}
            </p>
          </div>

          <button
            type="button"
            className="incapacidades-close"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            <FiX />
          </button>
        </div>

        <form
          className="incapacidades-form"
          onSubmit={onSubmit}
          encType="multipart/form-data"
        >
          {!incapacidadEditando && (
            <div className="incapacidades-form-group">
              <label htmlFor="numero-radicado">
                Número de radicado
              </label>

              <input
                id="numero-radicado"
                type="text"
                value={formulario.numero_radicado}
                onChange={(evento) =>
                  onChange(
                    "numero_radicado",
                    evento.target.value,
                  )
                }
                disabled={guardando}
                placeholder="Ej. INC-2026-001"
                maxLength={30}
                required
              />
            </div>
          )}

          {incapacidadEditando && (
            <div className="incapacidades-form-group">
              <label>Número de radicado</label>
              <input
                type="text"
                value={incapacidadEditando.numero_radicado}
                disabled
              />
            </div>
          )}

          <div className="incapacidades-form-row">
            <div className="incapacidades-form-group">
              <label htmlFor="fecha-inicio">
                Fecha de inicio
              </label>

              <input
                id="fecha-inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={(evento) =>
                  onChange(
                    "fecha_inicio",
                    evento.target.value,
                  )
                }
                disabled={guardando}
                required
              />
            </div>

            <div className="incapacidades-form-group">
              <label htmlFor="fecha-fin">
                Fecha de finalización
              </label>

              <input
                id="fecha-fin"
                type="date"
                value={formulario.fecha_fin}
                onChange={(evento) =>
                  onChange(
                    "fecha_fin",
                    evento.target.value,
                  )
                }
                disabled={guardando}
                required
              />
            </div>
          </div>

          <div className="incapacidades-form-group">
            <label htmlFor="archivo">
              Documento de incapacidad
            </label>

            <label
              htmlFor="archivo"
              className="incapacidades-file-label"
            >
              <FiFileText />
              <span>
                {formulario.archivo
                  ? formulario.archivo.name
                  : incapacidadEditando
                    ? "Seleccionar un nuevo documento (opcional)"
                    : "Seleccionar documento"}
              </span>
            </label>

            <input
              id="archivo"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(evento) =>
                onChange(
                  "archivo",
                  evento.target.files?.[0] ?? null,
                )
              }
              disabled={guardando}
              required={!incapacidadEditando}
            />

            {incapacidadEditando?.archivo && (
              <a
                href={incapacidadEditando.archivo}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver documento actual
              </a>
            )}

            <small>
              Formatos permitidos: PDF e imágenes.
            </small>
          </div>

          <div className="incapacidades-form-group">
            <label htmlFor="motivo">
              Motivo
            </label>

            <textarea
              id="motivo"
              value={formulario.motivo}
              onChange={(evento) =>
                onChange(
                  "motivo",
                  evento.target.value,
                )
              }
              disabled={guardando}
              placeholder="Describe el motivo de la incapacidad..."
              required
            />
          </div>

          {incapacidadEditando && esCoordinador && (
            <>
              <div className="incapacidades-form-group">
                <label htmlFor="estado-incapacidad">
                  Resultado de la revisión
                </label>

                <select
                  id="estado-incapacidad"
                  value={formulario.estado}
                  onChange={(evento) =>
                    onChange(
                      "estado",
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                >
                  <option value="pendiente">
                    Pendiente
                  </option>

                  <option value="aprobada">
                    Aprobar
                  </option>

                  <option value="rechazada">
                    Rechazar
                  </option>

                  <option value="finalizada">
                    Finalizar
                  </option>
                </select>
              </div>

              {requiereObservacion && (
                <div className="incapacidades-form-group">
                  <label htmlFor="observacion-revision">
                    Observación de la revisión
                  </label>

                  <textarea
                    id="observacion-revision"
                    value={formulario.observacion_revision}
                    onChange={(evento) =>
                      onChange(
                        "observacion_revision",
                        evento.target.value,
                      )
                    }
                    disabled={guardando}
                    placeholder="Explica el motivo de la aprobación o del rechazo..."
                    required
                  />
                </div>
              )}

              <div className="incapacidades-form-group">
                <label htmlFor="motivo-cambio">
                  Motivo del cambio
                </label>

                <textarea
                  id="motivo-cambio"
                  value={motivoCambio}
                  onChange={(evento) =>
                    onMotivoCambio(evento.target.value)
                  }
                  disabled={guardando}
                  placeholder="Describe el motivo de esta actualización..."
                  required
                />
              </div>
            </>
          )}

          <div className="incapacidades-form-actions">
            <button
              type="button"
              className="incapacidades-button secondary"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="incapacidades-button primary"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : incapacidadEditando
                  ? "Guardar revisión"
                  : "Radicar incapacidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
