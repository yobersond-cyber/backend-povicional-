import type { FormEvent } from "react";
import { FiX } from "react-icons/fi";

import type { Incapacidad } from "../../services/incapacidad";

export interface FormularioIncapacidad {
  numero_radicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  motivo: string;
}

interface IncapacidadFormProps {
  mostrar: boolean;
  guardando: boolean;
  incapacidadEditando: Incapacidad | null;
  formulario: FormularioIncapacidad;
  motivoCambio: string;

  onSubmit: (
    evento: FormEvent<HTMLFormElement>,
  ) => void;

  onClose: () => void;

  onChange: (
    campo: keyof FormularioIncapacidad,
    valor: string,
  ) => void;

  onMotivoCambio: (valor: string) => void;
}

export default function IncapacidadForm({
  mostrar,
  guardando,
  incapacidadEditando,
  formulario,
  motivoCambio,
  onSubmit,
  onClose,
  onChange,
  onMotivoCambio,
}: IncapacidadFormProps) {
  if (!mostrar) {
    return null;
  }

  return (
    <div className="incapacidades-overlay">
      <div className="incapacidades-modal">
        <div className="incapacidades-modal-header">
          <div>
            <h2>
              {incapacidadEditando
                ? "Editar incapacidad"
                : "Radicar incapacidad"}
            </h2>

            <p>
              {incapacidadEditando
                ? "Modifica la información y registra el motivo del cambio."
                : "Completa la información de tu incapacidad."}
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
        >
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
              disabled={
                Boolean(incapacidadEditando) ||
                guardando
              }
              placeholder="Ej. INC-2026-001"
              maxLength={30}
            />
          </div>

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
              />
            </div>
          </div>

          <div className="incapacidades-form-group">
            <label htmlFor="archivo">
              Archivo o referencia del soporte
            </label>

            <input
              id="archivo"
              type="text"
              value={formulario.archivo}
              onChange={(evento) =>
                onChange(
                  "archivo",
                  evento.target.value,
                )
              }
              disabled={guardando}
              placeholder="Nombre o URL del archivo"
              maxLength={255}
            />
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
            />
          </div>

          {incapacidadEditando && (
            <div className="incapacidades-form-group">
              <label htmlFor="motivo-cambio">
                Motivo del cambio
              </label>

              <textarea
                id="motivo-cambio"
                value={motivoCambio}
                onChange={(evento) =>
                  onMotivoCambio(
                    evento.target.value,
                  )
                }
                disabled={guardando}
                placeholder="Explica por qué se modifica esta incapacidad..."
              />
            </div>
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
                  ? "Guardar cambios"
                  : "Radicar incapacidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}