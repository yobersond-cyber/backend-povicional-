import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiPlus,
  FiX,
} from "react-icons/fi";

import {
  crearMaterial,
  obtenerMateriales,
  type Material,
} from "../services/material";

import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

import { useAuth } from "../context/AuthContext";

// Obtiene la fecha y hora local para datetime-local.
function obtenerFechaLocal(): string {
  const ahora = new Date();

  const fechaLocal = new Date(
    ahora.getTime() -
      ahora.getTimezoneOffset() * 60000,
  );

  return fechaLocal.toISOString().slice(0, 16);
}

function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function Materiales() {
  const { usuario } = useAuth();

  // Datos de materiales.
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  // Búsqueda y carga.
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [cargandoMaterias, setCargandoMaterias] =
    useState(true);

  // Formulario.
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [idMateria, setIdMateria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState("");
  const [fechaPublicacion, setFechaPublicacion] =
    useState(obtenerFechaLocal);

  // Mensajes y guardado.
  const [error, setError] = useState("");
  const [errorMaterias, setErrorMaterias] = useState("");
  const [errorFormulario, setErrorFormulario] =
    useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Consulta los materiales.
  async function cargarMateriales() {
    setLoading(true);
    setError("");

    try {
      const datos = await obtenerMateriales();
      setMateriales(datos);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  // Consulta solamente las materias que el docente
  // puede consultar mediante el endpoint del backend.
  async function cargarMaterias() {
    setCargandoMaterias(true);
    setErrorMaterias("");

    try {
      const datos = await obtenerMaterias();
      setMaterias(datos);
    } catch (err) {
      setErrorMaterias(mensajeError(err));
    } finally {
      setCargandoMaterias(false);
    }
  }

  useEffect(() => {
    void cargarMateriales();
    void cargarMaterias();
  }, []);

  // Limpia el formulario.
  function limpiarFormulario() {
    setIdMateria("");
    setTitulo("");
    setDescripcion("");
    setArchivo("");
    setFechaPublicacion(obtenerFechaLocal());
    setErrorFormulario("");
  }

  // Abre o cierra el formulario.
  function cambiarFormulario() {
    setMostrarFormulario((actual) => !actual);
    setErrorFormulario("");
    setMensaje("");
  }

  // Crea un material académico.
  async function guardarMaterial(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setErrorFormulario("");
    setMensaje("");

    // La identidad del docente proviene de la sesión.
    if (!usuario) {
      setErrorFormulario(
        "No se encontró la sesión del usuario. " +
          "Cierra sesión e inicia nuevamente.",
      );
      return;
    }

    const materiaSeleccionada = Number(idMateria);

    if (
      !Number.isInteger(materiaSeleccionada) ||
      materiaSeleccionada <= 0
    ) {
      setErrorFormulario(
        "Selecciona una materia válida.",
      );
      return;
    }

    // Verifica que la materia esté entre las asignadas
    // que devolvió el backend.
    const materiaPermitida = materias.some(
      (materia) =>
        materia.id_materia === materiaSeleccionada,
    );

    if (!materiaPermitida) {
      setErrorFormulario(
        "La materia seleccionada no está disponible " +
          "entre tus asignaciones.",
      );
      return;
    }

    if (!titulo.trim()) {
      setErrorFormulario(
        "El título del material es obligatorio.",
      );
      return;
    }

    if (!descripcion.trim()) {
      setErrorFormulario(
        "La descripción del material es obligatoria.",
      );
      return;
    }

    if (!archivo.trim()) {
      setErrorFormulario(
        "Ingresa el enlace del material académico.",
      );
      return;
    }

    const fecha = new Date(fechaPublicacion);

    if (
      !fechaPublicacion ||
      Number.isNaN(fecha.getTime())
    ) {
      setErrorFormulario(
        "Selecciona una fecha de publicación válida.",
      );
      return;
    }

    setGuardando(true);

    try {
      await crearMaterial({
        id_usuario: usuario.id_usuario,
        id_materia: materiaSeleccionada,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        archivo: archivo.trim(),
        fecha_publicacion: fecha.toISOString(),
      });

      limpiarFormulario();
      setMostrarFormulario(false);

      setMensaje(
        "El material académico se publicó correctamente.",
      );

      await cargarMateriales();
    } catch (err) {
      setErrorFormulario(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  // Filtra los materiales.
  const materialesFiltrados = materiales.filter(
    (material) => {
      const materia = materias.find(
        (item) =>
          item.id_materia === material.id_materia,
      );

      const texto = `
        ${material.titulo}
        ${material.descripcion ?? ""}
        ${materia?.nombre_materia ?? ""}
      `.toLowerCase();

      return texto.includes(
        busqueda.trim().toLowerCase(),
      );
    },
  );

  // Formatea la fecha.
  function formatearFecha(fecha: string): string {
    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return "Fecha no disponible";
    }

    return fechaObjeto.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <section className="page-section">
      <style>{`
        .material-create-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 18px 0;
        }

        .material-create-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .material-create-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .material-create-field.full {
          grid-column: 1 / -1;
        }

        .material-create-field label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .material-create-field input,
        .material-create-field textarea,
        .material-create-field select {
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

        .material-create-field textarea {
          min-height: 100px;
          resize: vertical;
        }

        .material-create-field input:focus,
        .material-create-field textarea:focus,
        .material-create-field select:focus {
          outline: 2px solid #c7d2fe;
          border-color: #6366f1;
        }

        .material-create-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .material-create-actions button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
          font-weight: 700;
          cursor: pointer;
        }

        .material-create-actions .material-save {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .material-create-actions button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .material-create-error {
          margin-top: 14px;
          padding: 12px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .material-create-success {
          margin: 14px 0;
          padding: 12px;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          background: #f0fdf4;
          color: #166534;
          font-size: 13px;
        }

        .material-create-help {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .material-create-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .material-create-top h3 {
          margin: 0 0 5px;
          color: #0f172a;
        }

        .material-create-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 14px;
          border: 0;
          border-radius: 8px;
          background: #4f46e5;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .material-create-toggle:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .material-create-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 12px;
          color: #4338ca;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          overflow-wrap: anywhere;
        }

        .material-create-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 650px) {
          .material-create-grid {
            grid-template-columns: 1fr;
          }

          .material-create-field.full,
          .material-create-actions {
            grid-column: 1;
          }

          .material-create-actions button {
            flex: 1;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>Materiales académicos</h2>

          <p>
            Consulta y publica materiales en las materias
            que tienes asignadas.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void cargarMateriales();
            void cargarMaterias();
          }}
          disabled={loading || cargandoMaterias}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </div>

      {mensaje && (
        <div
          className="material-create-success"
          role="status"
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="material-create-panel">
        <div className="material-create-top">
          <div>
            <h3>Publicar un material</h3>
            <p className="material-create-help">
              Comparte recursos académicos con tus estudiantes.
            </p>
          </div>

          <button
            type="button"
            className="material-create-toggle"
            onClick={cambiarFormulario}
          >
            {mostrarFormulario ? <FiX /> : <FiPlus />}
            {mostrarFormulario
              ? "Cancelar"
              : "Crear material"}
          </button>
        </div>

        {mostrarFormulario && (
          <form
            className="material-create-grid"
            onSubmit={guardarMaterial}
          >
            <div className="material-create-field full">
              <label htmlFor="material-materia">
                Materia asignada *
              </label>

              <select
                id="material-materia"
                required
                value={idMateria}
                onChange={(evento) =>
                  setIdMateria(evento.target.value)
                }
                disabled={
                  cargandoMaterias ||
                  materias.length === 0 ||
                  guardando
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
                <div
                  className="material-create-error"
                  role="alert"
                >
                  No se pudieron cargar tus materias:{" "}
                  {errorMaterias}
                </div>
              )}

              {!cargandoMaterias &&
                !errorMaterias &&
                materias.length === 0 && (
                  <p className="material-create-help">
                    No tienes materias disponibles. Comprueba
                    con el coordinador que estén asignadas a
                    tu cuenta.
                  </p>
                )}
            </div>

            <div className="material-create-field full">
              <label htmlFor="material-titulo">
                Título *
              </label>

              <input
                id="material-titulo"
                required
                maxLength={150}
                value={titulo}
                onChange={(evento) =>
                  setTitulo(evento.target.value)
                }
                placeholder="Ej. Guía de ejercicios"
                disabled={guardando}
              />
            </div>

            <div className="material-create-field full">
              <label htmlFor="material-descripcion">
                Descripción *
              </label>

              <textarea
                id="material-descripcion"
                required
                value={descripcion}
                onChange={(evento) =>
                  setDescripcion(evento.target.value)
                }
                placeholder="Describe qué contiene el material y cómo deben utilizarlo los estudiantes."
                disabled={guardando}
              />
            </div>

            <div className="material-create-field full">
              <label htmlFor="material-archivo">
                Enlace al material *
              </label>

              <input
                id="material-archivo"
                type="url"
                required
                maxLength={255}
                value={archivo}
                onChange={(evento) =>
                  setArchivo(evento.target.value)
                }
                placeholder="https://..."
                disabled={guardando}
              />

              <p className="material-create-help">
                Pega un enlace accesible al PDF, documento,
                presentación o recurso que deseas compartir.
              </p>
            </div>

            <div className="material-create-field">
              <label htmlFor="material-fecha">
                Fecha de publicación *
              </label>

              <input
                id="material-fecha"
                type="datetime-local"
                required
                value={fechaPublicacion}
                onChange={(evento) =>
                  setFechaPublicacion(evento.target.value)
                }
                disabled={guardando}
              />
            </div>

            {errorFormulario && (
              <div
                className="material-create-error"
                role="alert"
                style={{ gridColumn: "1 / -1" }}
              >
                {errorFormulario}
              </div>
            )}

            <div className="material-create-actions">
              <button
                type="button"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                }}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="material-save"
                disabled={
                  guardando ||
                  cargandoMaterias ||
                  materias.length === 0
                }
              >
                <FiPlus />
                {guardando
                  ? "Publicando..."
                  : "Publicar material"}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="search-box">
        <FiSearch />

        <input
          type="text"
          placeholder="Buscar material por título, descripción o materia..."
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
        />
      </div>

      {loading && (
        <div className="empty-section">
          <FiFileText />
          <p>Cargando materiales...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="materials-grid">
          {materialesFiltrados.map((material) => {
            const materia = materias.find(
              (item) =>
                item.id_materia === material.id_materia,
            );

            return (
              <article
                className="material-card"
                key={material.id_material}
              >
                <div className="material-icon">
                  <FiFileText />
                </div>

                <div className="material-content">
                  <span className="material-label">
                    Material académico
                  </span>

                  <h3>{material.titulo}</h3>

                  <p>
                    {material.descripcion ||
                      "Sin descripción disponible."}
                  </p>

                  <div className="material-meta">
                    <span>
                      Publicado:{" "}
                      {formatearFecha(
                        material.fecha_publicacion,
                      )}
                    </span>

                    <span>
                      Materia:{" "}
                      {materia?.nombre_materia ??
                        `#${material.id_materia}`}
                    </span>
                  </div>

                  {material.archivo && (
                    <a
                      className="material-create-link"
                      href={material.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiDownload />
                      Abrir material
                    </a>
                  )}
                </div>
              </article>
            );
          })}

          {materialesFiltrados.length === 0 && (
            <div className="empty-section">
              <FiFileText />

              <h3>No hay materiales</h3>

              <p>
                {materiales.length === 0
                  ? "Todavía no hay materiales publicados en tus materias."
                  : "No se encontraron materiales para esta búsqueda."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Materiales;