import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiDownload,
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiUsers,
  FiBookOpen,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  calificarEntrega,
  obtenerEntregas,
  type Entrega,
} from "../services/entrega";

import {
  obtenerActividades,
  type Actividad,
} from "../services/actividad";

import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

import {
  obtenerEstudiantes,
  type Estudiante,
} from "../services/usuario";

// ============================================
// TIPOS
// ============================================

interface EntregaVista extends Entrega {
  actividad?: Actividad;
  materia?: Materia;
  estudiante?: Estudiante;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha: string): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor = new Date(
    fecha.includes("T") ? fecha : `${fecha}T00:00:00`,
  );

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function textoNota(nota: number | null): string {
  if (nota === null || nota === undefined) {
    return "Sin calificar";
  }

  return `${nota}/100`;
}

function nombreEstudiante(
  estudiante?: Estudiante,
): string {
  if (!estudiante) {
    return "Estudiante no encontrado";
  }

  return [
    estudiante.nombres_compl,
    estudiante.apellidos_compl,
  ]
    .filter(Boolean)
    .join(" ");
}

function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Calificaciones() {
  const { usuario } = useAuth();

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);

  // Búsqueda y filtros.
  const [busqueda, setBusqueda] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [filtroEstudiante, setFiltroEstudiante] = useState("");

  // Estado de carga.
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Formulario para calificar.
  const [entregaSeleccionada, setEntregaSeleccionada] =
    useState<EntregaVista | null>(null);

  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const esDocente =
    usuario?.tipo_de_usuario === "docente";

  // ============================================
  // CARGAR DATOS
  // ============================================

  async function cargarDatos() {
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      const [
        entregasData,
        actividadesData,
        materiasData,
        estudiantesData,
      ] = await Promise.all([
        obtenerEntregas(),
        obtenerActividades(),
        obtenerMaterias(),
        obtenerEstudiantes(),
      ]);

      setEntregas(entregasData ?? []);
      setActividades(actividadesData ?? []);
      setMaterias(materiasData ?? []);
      setEstudiantes(estudiantesData ?? []);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  // ============================================
  // RELACIONAR ENTREGA, ACTIVIDAD,
  // MATERIA Y ESTUDIANTE
  // ============================================

  const entregasVista = useMemo<EntregaVista[]>(() => {
    return entregas.map((entrega) => {
      const actividad = actividades.find(
        (item) =>
          item.id_actividad === entrega.id_actividad,
      );

      const materia = materias.find(
        (item) =>
          item.id_materia === actividad?.id_materia,
      );

      const estudiante = estudiantes.find(
        (item) =>
          item.id_usuario === entrega.id_usuario,
      );

      return {
        ...entrega,
        actividad,
        materia,
        estudiante,
      };
    });
  }, [entregas, actividades, materias, estudiantes]);

  // ============================================
  // FILTRAR POR ESTUDIANTE, MATERIA Y TEXTO
  // ============================================

  const entregasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return entregasVista.filter((entrega) => {
      // Filtro por materia.
      if (
        filtroMateria &&
        String(entrega.materia?.id_materia) !== filtroMateria
      ) {
        return false;
      }

      // Filtro por estudiante.
      if (
        filtroEstudiante &&
        String(entrega.id_usuario) !== filtroEstudiante
      ) {
        return false;
      }

      const actividad =
        entrega.actividad?.titulo ?? "";

      const materia =
        entrega.materia?.nombre_materia ?? "";

      const estudiante = nombreEstudiante(
        entrega.estudiante,
      );

      const documento =
        entrega.estudiante?.documento ?? "";

      const codigo =
        entrega.estudiante?.codigo_usuario ?? "";

      const descripcion =
        entrega.descripcion ?? "";

      const textoCompleto = [
        actividad,
        materia,
        estudiante,
        documento,
        codigo,
        descripcion,
        String(entrega.id_entrega),
      ]
        .join(" ")
        .toLowerCase();

      return textoCompleto.includes(termino);
    });
  }, [
    entregasVista,
    busqueda,
    filtroMateria,
    filtroEstudiante,
  ]);

  // ============================================
  // ESTADÍSTICAS DEL RESULTADO FILTRADO
  // ============================================

  const cantidadCalificadas = useMemo(() => {
    return entregasFiltradas.filter(
      (entrega) =>
        entrega.nota !== null &&
        entrega.nota !== undefined,
    ).length;
  }, [entregasFiltradas]);

  const promedio = useMemo(() => {
    const notas = entregasFiltradas
      .map((entrega) => entrega.nota)
      .filter(
        (valor): valor is number =>
          valor !== null &&
          valor !== undefined,
      );

    if (notas.length === 0) {
      return null;
    }

    const suma = notas.reduce(
      (total, valor) => total + valor,
      0,
    );

    return Math.round((suma / notas.length) * 10) / 10;
  }, [entregasFiltradas]);

  // ============================================
  // CALIFICAR ENTREGA
  // ============================================

  function abrirCalificacion(entrega: EntregaVista) {
    setEntregaSeleccionada(entrega);

    setNota(
      entrega.nota !== null &&
        entrega.nota !== undefined
        ? String(entrega.nota)
        : "",
    );

    setMensaje("");
  }

  function cerrarCalificacion() {
    if (guardando) {
      return;
    }

    setEntregaSeleccionada(null);
    setNota("");
    setMensaje("");
  }

  async function guardarCalificacion() {
    if (!entregaSeleccionada) {
      return;
    }

    const valor = Number(nota);

    if (
      nota.trim() === "" ||
      !Number.isInteger(valor)
    ) {
      setMensaje(
        "Ingresa una calificación entera válida.",
      );
      return;
    }

    if (valor < 0 || valor > 100) {
      setMensaje(
        "La calificación debe estar entre 0 y 100.",
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const entregaActualizada = await calificarEntrega(
        entregaSeleccionada.id_entrega,
        valor,
      );

      setEntregas((actuales) =>
        actuales.map((entrega) =>
          entrega.id_entrega ===
          entregaSeleccionada.id_entrega
            ? {
                ...entrega,
                ...entregaActualizada,
                nota: valor,
              }
            : entrega,
        ),
      );

      setMensaje("Calificación guardada correctamente.");

      setEntregaSeleccionada(null);
      setNota("");
    } catch (err) {
      setMensaje(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  // ============================================
  // ABRIR ARCHIVO DE ENTREGA
  // ============================================

  function abrirArchivo(archivo: string | null) {
    if (!archivo) {
      setMensaje(
        "Esta entrega no tiene un archivo disponible.",
      );
      return;
    }

    window.open(
      archivo,
      "_blank",
      "noopener,noreferrer",
    );
  }

  // ============================================
  // LIMPIAR FILTROS
  // ============================================

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroMateria("");
    setFiltroEstudiante("");
  }

  // ============================================
  // INTERFAZ
  // ============================================

  return (
    <div className="grades-page">
      <style>{`
        .grades-page {
          width: 100%;
          color: #1e293b;
        }

        .grades-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .grades-header h1 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 28px;
        }

        .grades-header p {
          margin: 0;
          color: #64748b;
          line-height: 1.5;
        }

        .grades-refresh {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          padding: 10px 14px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .grades-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .grades-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .grades-stat {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 18px;
          min-width: 0;
        }

        .grades-stat span {
          color: #667085;
          font-size: 13px;
        }

        .grades-stat strong {
          display: block;
          margin-top: 5px;
          color: #172033;
          font-size: 24px;
        }

        .grades-toolbar {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .grades-search {
          position: relative;
          margin-bottom: 16px;
        }

        .grades-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #98a2b3;
        }

        .grades-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 11px 14px 11px 38px;
          outline: none;
          font-size: 14px;
        }

        .grades-search input:focus {
          border-color: #6366f1;
        }

        .grades-filter-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .grades-filter-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .grades-filter-field label {
          color: #475467;
          font-size: 12px;
          font-weight: 700;
        }

        .grades-filter-field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 9px;
          padding: 11px 12px;
          color: #344054;
          font-size: 14px;
        }

        .grades-filter-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .grades-results-count {
          color: #667085;
          font-size: 13px;
        }

        .grades-clear {
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          padding: 9px 12px;
          background: #fff;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .grades-list {
          display: grid;
          gap: 14px;
        }

        .grade-card {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 18px;
        }

        .grade-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .grade-card-title {
          display: flex;
          gap: 12px;
          min-width: 0;
        }

        .grade-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 20px;
        }

        .grade-card h3 {
          margin: 0;
          color: #172033;
          font-size: 17px;
        }

        .grade-card-subject {
          margin-top: 5px;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 700;
        }

        .grade-student-info {
          margin-top: 9px;
          color: #344054;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .grade-student-info span {
          display: block;
          color: #667085;
          font-size: 12px;
        }

        .grade-value {
          font-size: 20px;
          font-weight: 800;
          color: #172033;
          white-space: nowrap;
        }

        .grade-card-description {
          margin: 16px 0;
          color: #475467;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .grade-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          color: #667085;
          font-size: 13px;
        }

        .grade-card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        .grade-action {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          padding: 9px 13px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
        }

        .grade-action.primary {
          background: #4f46e5;
          color: #fff;
          border-color: #4f46e5;
        }

        .grade-empty,
        .grade-error,
        .grade-loading {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 30px;
          text-align: center;
          color: #667085;
          line-height: 1.5;
        }

        .grade-error {
          color: #b42318;
        }

        .grade-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16, 24, 40, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 2000;
        }

        .grade-modal {
          width: 100%;
          max-width: 460px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-sizing: border-box;
        }

        .grade-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .grade-modal-header h2 {
          margin: 0;
          color: #172033;
          font-size: 20px;
        }

        .grade-modal-close {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 20px;
          color: #344054;
        }

        .grade-modal-info {
          margin: 18px 0;
          color: #667085;
          line-height: 1.6;
        }

        .grade-modal-label {
          display: block;
          margin-bottom: 7px;
          color: #344054;
          font-size: 14px;
          font-weight: 700;
        }

        .grade-modal-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 12px;
          font-size: 18px;
          outline: none;
        }

        .grade-modal-input:focus {
          border-color: #6366f1;
        }

        .grade-modal-message {
          margin-top: 12px;
          color: #b42318;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .grade-modal-success {
          margin-top: 12px;
          color: #15803d;
          font-size: 14px;
        }

        .grade-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .grade-modal-actions button {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .grade-modal-actions .save {
          background: #4f46e5;
          color: #fff;
          border-color: #4f46e5;
        }

        .grade-modal-actions button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        @media (max-width: 800px) {
          .grades-stats {
            grid-template-columns: 1fr;
          }

          .grades-header {
            flex-direction: column;
          }

          .grade-card-top {
            flex-direction: column;
          }

          .grades-filter-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .grade-card-actions {
            flex-direction: column;
          }

          .grade-card-actions button {
            justify-content: center;
          }
        }
      `}</style>

      <div className="grades-header">
        <div>
          <h1>Calificaciones</h1>

          <p>
            Consulta las notas por estudiante, materia
            y actividad. También puedes calificar entregas.
          </p>
        </div>

        <button
          type="button"
          className="grades-refresh"
          onClick={() => void cargarDatos()}
          disabled={cargando}
        >
          <FiRefreshCw />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="grades-stats">
        <div className="grades-stat">
          <span>Entregas filtradas</span>
          <strong>{entregasFiltradas.length}</strong>
        </div>

        <div className="grades-stat">
          <span>Entregas calificadas</span>
          <strong>{cantidadCalificadas}</strong>
        </div>

        <div className="grades-stat">
          <span>Promedio de las notas visibles</span>
          <strong>
            {promedio === null ? "--" : `${promedio}/100`}
          </strong>
        </div>
      </div>

      <div className="grades-toolbar">
        <div className="grades-search">
          <FiSearch />

          <input
            type="search"
            placeholder="Buscar por nombre, documento, actividad o materia..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>

        <div className="grades-filter-grid">
          <div className="grades-filter-field">
            <label htmlFor="filtro-materia">
              <FiBookOpen
                style={{
                  display: "inline",
                  marginRight: 5,
                }}
              />
              Filtrar por materia
            </label>

            <select
              id="filtro-materia"
              value={filtroMateria}
              onChange={(event) =>
                setFiltroMateria(event.target.value)
              }
            >
              <option value="">Todas mis materias</option>

              {materias.map((materia) => (
                <option
                  key={materia.id_materia}
                  value={materia.id_materia}
                >
                  {materia.nombre_materia}
                </option>
              ))}
            </select>
          </div>

          <div className="grades-filter-field">
            <label htmlFor="filtro-estudiante">
              <FiUsers
                style={{
                  display: "inline",
                  marginRight: 5,
                }}
              />
              Filtrar por estudiante
            </label>

            <select
              id="filtro-estudiante"
              value={filtroEstudiante}
              onChange={(event) =>
                setFiltroEstudiante(event.target.value)
              }
            >
              <option value="">Todos mis estudiantes</option>

              {estudiantes.map((estudiante) => (
                <option
                  key={estudiante.id_usuario}
                  value={estudiante.id_usuario}
                >
                  {nombreEstudiante(estudiante)}
                  {" — "}
                  {estudiante.documento}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grades-filter-footer">
          <span className="grades-results-count">
            Mostrando {entregasFiltradas.length} de{" "}
            {entregasVista.length} entregas.
          </span>

          <button
            type="button"
            className="grades-clear"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {mensaje && !entregaSeleccionada && (
        <div className="grade-empty" role="status">
          {mensaje}
        </div>
      )}

      {cargando && (
        <div className="grade-loading">
          Cargando entregas y calificaciones...
        </div>
      )}

      {!cargando && error && (
        <div className="grade-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="grade-action"
            onClick={() => void cargarDatos()}
          >
            <FiRefreshCw />
            Intentar nuevamente
          </button>
        </div>
      )}

      {!cargando && !error && entregasFiltradas.length === 0 && (
        <div className="grade-empty">
          <FiFileText size={30} />

          <p>
            No hay entregas que coincidan con los filtros.
          </p>

          <p>
            Prueba otra materia, otro estudiante o limpia
            los filtros para ver todas las entregas.
          </p>
        </div>
      )}

      {!cargando && !error && entregasFiltradas.length > 0 && (
        <div className="grades-list">
          {entregasFiltradas.map((entrega) => (
            <article
              key={entrega.id_entrega}
              className="grade-card"
            >
              <div className="grade-card-top">
                <div className="grade-card-title">
                  <div className="grade-card-icon">
                    <FiFileText />
                  </div>

                  <div>
                    <h3>
                      {entrega.actividad?.titulo ?? "Actividad"}
                    </h3>

                    <div className="grade-card-subject">
                      {entrega.materia?.nombre_materia ??
                        "Materia no disponible"}
                    </div>

                    <div className="grade-student-info">
                      <strong>
                        {nombreEstudiante(entrega.estudiante)}
                      </strong>

                      {entrega.estudiante && (
                        <span>
                          Documento: {entrega.estudiante.documento}
                          {" · "}
                          Código: {entrega.estudiante.codigo_usuario}
                        </span>
                      )}

                      {!entrega.estudiante && (
                        <span>
                          ID del estudiante: {entrega.id_usuario}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grade-value">
                  {textoNota(entrega.nota)}
                </div>
              </div>

              <p className="grade-card-description">
                {entrega.descripcion || "Sin descripción."}
              </p>

              <div className="grade-card-meta">
                <span>
                  Entrega: {formatearFecha(entrega.fecha_entrega)}
                </span>

                <span>Estado: {entrega.estado}</span>

                <span>
                  Entrega ID: {entrega.id_entrega}
                </span>
              </div>

              <div className="grade-card-actions">
                {entrega.archivo && (
                  <button
                    type="button"
                    className="grade-action"
                    onClick={() => abrirArchivo(entrega.archivo)}
                  >
                    <FiDownload />
                    Ver archivo
                  </button>
                )}

                {esDocente && (
                  <button
                    type="button"
                    className="grade-action primary"
                    onClick={() => abrirCalificacion(entrega)}
                  >
                    <FiEdit3 />
                    {entrega.nota === null ||
                    entrega.nota === undefined
                      ? "Calificar"
                      : "Editar calificación"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {entregaSeleccionada && (
        <div
          className="grade-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarCalificacion();
            }
          }}
        >
          <div className="grade-modal">
            <div className="grade-modal-header">
              <h2>Registrar calificación</h2>

              <button
                type="button"
                className="grade-modal-close"
                onClick={cerrarCalificacion}
                disabled={guardando}
                aria-label="Cerrar"
              >
                <FiX />
              </button>
            </div>

            <div className="grade-modal-info">
              <strong>Estudiante:</strong>{" "}
              {nombreEstudiante(
                entregaSeleccionada.estudiante,
              )}

              <br />

              <strong>Actividad:</strong>{" "}
              {entregaSeleccionada.actividad?.titulo ??
                "Actividad"}

              <br />

              <strong>Materia:</strong>{" "}
              {entregaSeleccionada.materia?.nombre_materia ??
                "Materia no disponible"}
            </div>

            <label
              className="grade-modal-label"
              htmlFor="nota-entrega"
            >
              Calificación (0 a 100)
            </label>

            <input
              id="nota-entrega"
              className="grade-modal-input"
              type="number"
              min="0"
              max="100"
              step="1"
              value={nota}
              onChange={(event) =>
                setNota(event.target.value)
              }
              placeholder="Escribe la nota"
              disabled={guardando}
            />

            {mensaje && (
              <div
                className="grade-modal-message"
                role="alert"
              >
                {mensaje}
              </div>
            )}

            <div className="grade-modal-actions">
              <button
                type="button"
                onClick={cerrarCalificacion}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="save"
                onClick={() => void guardarCalificacion()}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar nota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}