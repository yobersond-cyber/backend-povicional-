import { useEffect, useState, type FormEvent } from "react";

import {
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import {
  crearActividad,
  obtenerActividades,
  type Actividad,
} from "../services/actividad";

import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

import { useAuth } from "../context/AuthContext";

function fechaHoyLocal(): string {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(valor: string): string {
  const fecha = new Date(`${valor.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

export default function Actividades() {
  const { usuario } = useAuth();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [cargandoMaterias, setCargandoMaterias] = useState(true);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [idMateria, setIdMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaPublicacion, setFechaPublicacion] =
    useState(fechaHoyLocal);
  const [fechaLimite, setFechaLimite] = useState(fechaHoyLocal);

  const [error, setError] = useState("");
  const [errorMaterias, setErrorMaterias] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarActividades() {
    setLoading(true);
    setError("");

    try {
      // El backend devuelve las actividades de las materias
      // asignadas al docente autenticado.
      const datos = await obtenerActividades();
      setActividades(datos);
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function cargarMaterias() {
    setCargandoMaterias(true);
    setErrorMaterias("");

    try {
      const datos = await obtenerMaterias();
      setMaterias(datos);
    } catch (err) {
      setErrorMaterias(obtenerMensajeError(err));
    } finally {
      setCargandoMaterias(false);
    }
  }

  useEffect(() => {
    void cargarActividades();
    void cargarMaterias();
  }, []);

  function limpiarFormulario() {
    setIdMateria("");
    setTitulo("");
    setDescripcion("");
    setFechaPublicacion(fechaHoyLocal());
    setFechaLimite(fechaHoyLocal());
    setErrorFormulario("");
  }

  async function guardarActividad(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setErrorFormulario("");
    setMensaje("");

    if (!usuario) {
      setErrorFormulario(
        "No se encontró tu sesión. Cierra sesión e inicia nuevamente.",
      );
      return;
    }

    const idMateriaNumerico = Number(idMateria);

    if (
      !Number.isInteger(idMateriaNumerico) ||
      idMateriaNumerico <= 0
    ) {
      setErrorFormulario("Selecciona una materia válida.");
      return;
    }

    const materiaSeleccionada = materias.find(
      (materia) => materia.id_materia === idMateriaNumerico,
    );

    if (!materiaSeleccionada) {
      setErrorFormulario(
        "La materia seleccionada no está disponible entre tus asignaciones.",
      );
      return;
    }

    if (!titulo.trim()) {
      setErrorFormulario("El título es obligatorio.");
      return;
    }

    if (titulo.trim().length > 120) {
      setErrorFormulario(
        "El título no puede superar los 120 caracteres.",
      );
      return;
    }

    if (!descripcion.trim()) {
      setErrorFormulario("La descripción es obligatoria.");
      return;
    }

    if (!fechaPublicacion || !fechaLimite) {
      setErrorFormulario(
        "Debes seleccionar ambas fechas.",
      );
      return;
    }

    if (fechaLimite < fechaPublicacion) {
      setErrorFormulario(
        "La fecha límite no puede ser anterior a la fecha de publicación.",
      );
      return;
    }

    setGuardando(true);

    try {
      await crearActividad({
        id_usuario: usuario.id_usuario,
        id_materia: materiaSeleccionada.id_materia,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha_publicacion: fechaPublicacion,
        fecha_limite: fechaLimite,
      });

      limpiarFormulario();
      setMostrarFormulario(false);

      setMensaje(
        "La actividad académica se creó correctamente.",
      );

      await cargarActividades();
    } catch (err) {
      setErrorFormulario(obtenerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const actividadesFiltradas = actividades.filter((actividad) => {
    const materia = materias.find(
      (item) => item.id_materia === actividad.id_materia,
    );

    const texto = [
      actividad.titulo,
      actividad.descripcion,
      materia?.nombre_materia ?? "",
      String(actividad.id_materia),
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(busqueda.trim().toLowerCase());
  });

  return (
    <section className="page-section">
      <style>{`
        .act-create-panel {
          margin: 18px 0;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
        }

        .act-create-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .act-create-header h3 {
          margin: 0 0 6px;
          color: #0f172a;
        }

        .act-create-help {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .act-create-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border: 0;
          border-radius: 8px;
          background: #4f46e5;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .act-create-toggle:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .act-create-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .act-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .act-field.full {
          grid-column: 1 / -1;
        }

        .act-field label {
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .act-field input,
        .act-field textarea,
        .act-field select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #0f172a;
          font: inherit;
          font-size: 14px;
        }

        .act-field textarea {
          min-height: 110px;
          resize: vertical;
        }

        .act-field input:focus,
        .act-field textarea:focus,
        .act-field select:focus {
          outline: 2px solid #c7d2fe;
          border-color: #6366f1;
        }

        .act-form-error,
        .act-form-success {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .act-form-error {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .act-form-success {
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          margin: 14px 0;
        }

        .act-form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .act-form-actions button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #334155;
          font-weight: 700;
          cursor: pointer;
        }

        .act-form-actions .act-save {
          border-color: #4f46e5;
          background: #4f46e5;
          color: white;
        }

        .act-form-actions button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .act-card-materia {
          display: block;
          margin-top: 8px;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 650px) {
          .act-create-grid {
            grid-template-columns: 1fr;
          }

          .act-field.full,
          .act-form-actions {
            grid-column: 1;
          }

          .act-form-actions button {
            flex: 1;
          }

          .act-create-panel {
            padding: 15px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>Actividades académicas</h2>
          <p>
            Crea actividades en tus materias asignadas
            y consulta las que ya has publicado.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void cargarActividades();
            void cargarMaterias();
          }}
          disabled={loading || cargandoMaterias}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </div>

      {mensaje && (
        <div className="act-form-success" role="status">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="act-create-panel">
        <div className="act-create-header">
          <div>
            <h3>Crear actividad</h3>
            <p className="act-create-help">
              Selecciona una de tus materias y define las fechas.
            </p>
          </div>

          <button
            type="button"
            className="act-create-toggle"
            onClick={() => {
              setMostrarFormulario((actual) => !actual);
              setErrorFormulario("");
            }}
          >
            {mostrarFormulario ? <FiX /> : <FiPlus />}
            {mostrarFormulario ? "Cancelar" : "Nueva actividad"}
          </button>
        </div>

        {mostrarFormulario && (
          <form
            className="act-create-grid"
            onSubmit={guardarActividad}
          >
            <div className="act-field full">
              <label htmlFor="act-materia">
                Materia asignada *
              </label>

              <select
                id="act-materia"
                required
                value={idMateria}
                onChange={(evento) =>
                  setIdMateria(evento.target.value)
                }
                disabled={
                  guardando ||
                  cargandoMaterias ||
                  materias.length === 0
                }
              >
                <option value="">
                  {cargandoMaterias
                    ? "Cargando materias..."
                    : "Selecciona una materia"}
                </option>

                {materias.map((materia) => (
                  <option
                    key={materia.id_materia}
                    value={materia.id_materia}
                  >
                    {materia.nombre_materia}
                    {" — Curso "}
                    {materia.id_curso}
                  </option>
                ))}
              </select>

              {errorMaterias && (
                <div className="act-form-error" role="alert">
                  No fue posible cargar las materias:{" "}
                  {errorMaterias}
                </div>
              )}

              {!cargandoMaterias &&
                !errorMaterias &&
                materias.length === 0 && (
                  <p className="act-create-help">
                    No tienes materias asignadas. Solicita al
                    coordinador que revise tus asignaciones.
                  </p>
                )}
            </div>

            <div className="act-field full">
              <label htmlFor="act-titulo">
                Título *
              </label>

              <input
                id="act-titulo"
                required
                maxLength={120}
                value={titulo}
                onChange={(evento) =>
                  setTitulo(evento.target.value)
                }
                placeholder="Ej. Taller de matemáticas"
                disabled={guardando}
              />
            </div>

            <div className="act-field full">
              <label htmlFor="act-descripcion">
                Descripción e instrucciones *
              </label>

              <textarea
                id="act-descripcion"
                required
                value={descripcion}
                onChange={(evento) =>
                  setDescripcion(evento.target.value)
                }
                placeholder="Explica qué debe hacer el estudiante y cómo debe entregar la actividad."
                disabled={guardando}
              />
            </div>

            <div className="act-field">
              <label htmlFor="act-fecha-publicacion">
                Fecha de publicación *
              </label>

              <input
                id="act-fecha-publicacion"
                type="date"
                required
                value={fechaPublicacion}
                onChange={(evento) =>
                  setFechaPublicacion(evento.target.value)
                }
                disabled={guardando}
              />
            </div>

            <div className="act-field">
              <label htmlFor="act-fecha-limite">
                Fecha límite de entrega *
              </label>

              <input
                id="act-fecha-limite"
                type="date"
                required
                min={fechaPublicacion}
                value={fechaLimite}
                onChange={(evento) =>
                  setFechaLimite(evento.target.value)
                }
                disabled={guardando}
              />
            </div>

            {errorFormulario && (
              <div
                className="act-form-error"
                role="alert"
                style={{ gridColumn: "1 / -1" }}
              >
                {errorFormulario}
              </div>
            )}

            <div className="act-form-actions">
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setErrorFormulario("");
                }}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="act-save"
                disabled={
                  guardando ||
                  cargandoMaterias ||
                  materias.length === 0
                }
              >
                <FiPlus />
                {guardando ? "Guardando..." : "Publicar actividad"}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="search-box">
        <FiSearch />

        <input
          type="search"
          placeholder="Buscar actividad por título, descripción o materia..."
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
        />
      </div>

      {loading && (
        <div className="empty-section">
          <FiClock />
          <p>Cargando actividades...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="activities-list">
          {actividadesFiltradas.map((actividad) => {
            const materia = materias.find(
              (item) => item.id_materia === actividad.id_materia,
            );

            const vencida = actividad.fecha_limite < fechaHoyLocal();

            return (
              <article
                className="activity-card"
                key={actividad.id_actividad}
              >
                <div className="activity-card-icon">
                  <FiClipboard />
                </div>

                <div className="activity-card-content">
                  <div className="activity-card-top">
                    <div>
                      <span className="activity-label">
                        Actividad académica
                      </span>

                      <h3>{actividad.titulo}</h3>

                      <span className="act-card-materia">
                        {materia?.nombre_materia ??
                          `Materia #${actividad.id_materia}`}
                      </span>
                    </div>

                    <span
                      className={
                        vencida
                          ? "activity-status expired"
                          : "activity-status active"
                      }
                    >
                      {vencida ? "Vencida" : "Vigente"}
                    </span>
                  </div>

                  <p>
                    {actividad.descripcion ||
                      "Sin descripción disponible."}
                  </p>

                  <div className="activity-meta">
                    <span>
                      <FiCalendar />
                      Publicada:{" "}
                      {formatearFecha(actividad.fecha_publicacion)}
                    </span>

                    <span>
                      <FiClock />
                      Fecha límite:{" "}
                      {formatearFecha(actividad.fecha_limite)}
                    </span>
                  </div>

                  <span className="act-create-help">
                    Actividad ID: {actividad.id_actividad}
                  </span>
                </div>
              </article>
            );
          })}

          {actividadesFiltradas.length === 0 && (
            <div className="empty-section">
              <FiClipboard />
              <h3>No hay actividades</h3>
              <p>
                {actividades.length === 0
                  ? "Todavía no hay actividades en tus materias asignadas."
                  : "No se encontraron actividades para esta búsqueda."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}