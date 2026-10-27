import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  crearEntrega,
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

import "./Entregas.css";

interface EntregaVista extends Entrega {
  actividad?: Actividad;
  materia?: Materia;
}

function formatearFechaHora(fecha: string): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible completar la operación.";
}

function esUrlValida(valor: string): boolean {
  try {
    const url = new URL(valor);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

export default function Entregas() {
  const { usuario } = useAuth();

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [idActividad, setIdActividad] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esErrorMensaje, setEsErrorMensaje] =
    useState(false);

  const esEstudiante =
    usuario?.tipo_de_usuario === "estudiante";

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [
        entregasData,
        actividadesData,
        materiasData,
      ] = await Promise.all([
        obtenerEntregas(),
        obtenerActividades(),
        obtenerMaterias(),
      ]);

      setEntregas(entregasData ?? []);
      setActividades(actividadesData ?? []);
      setMaterias(materiasData ?? []);
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

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

      return {
        ...entrega,
        actividad,
        materia,
      };
    });
  }, [entregas, actividades, materias]);

  const entregasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) {
      return entregasVista;
    }

    return entregasVista.filter((entrega) => {
      const texto = [
        entrega.actividad?.titulo ?? "",
        entrega.materia?.nombre_materia ?? "",
        entrega.descripcion ?? "",
        String(entrega.id_entrega),
        String(entrega.id_actividad),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termino);
    });
  }, [busqueda, entregasVista]);

  const actividadesDisponibles = useMemo(() => {
    const idsEntregados = new Set(
      entregas.map((entrega) => entrega.id_actividad),
    );

    return actividades.filter(
      (actividad) =>
        !idsEntregados.has(actividad.id_actividad),
    );
  }, [actividades, entregas]);

  function limpiarFormulario() {
    setIdActividad("");
    setFechaEntrega("");
    setDescripcion("");
    setArchivo("");
  }

  function abrirFormulario() {
    limpiarFormulario();
    setMensaje("");
    setEsErrorMensaje(false);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    limpiarFormulario();
    setMensaje("");
    setEsErrorMensaje(false);
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setMensaje("");
    setEsErrorMensaje(false);

    if (!esEstudiante) {
      setMensaje(
        "Solo los estudiantes pueden registrar entregas.",
      );
      setEsErrorMensaje(true);
      return;
    }

    if (!usuario?.id_usuario) {
      setMensaje(
        "No se encontró el usuario autenticado.",
      );
      setEsErrorMensaje(true);
      return;
    }

    const idActividadNumerico = Number(idActividad);

    const actividadSeleccionada = actividades.find(
      (actividad) =>
        actividad.id_actividad === idActividadNumerico,
    );

    if (!actividadSeleccionada) {
      setMensaje("Selecciona una actividad válida.");
      setEsErrorMensaje(true);
      return;
    }

    if (!fechaEntrega) {
      setMensaje("Selecciona la fecha de entrega.");
      setEsErrorMensaje(true);
      return;
    }

    const fecha = new Date(fechaEntrega);

    if (Number.isNaN(fecha.getTime())) {
      setMensaje("La fecha de entrega no es válida.");
      setEsErrorMensaje(true);
      return;
    }

    if (!descripcion.trim()) {
      setMensaje("Escribe una descripción de la entrega.");
      setEsErrorMensaje(true);
      return;
    }

    const archivoLimpio = archivo.trim();

    if (archivoLimpio && !esUrlValida(archivoLimpio)) {
      setMensaje(
        "El enlace debe comenzar con http:// o https://.",
      );
      setEsErrorMensaje(true);
      return;
    }

    const yaEntregada = entregas.some(
      (entrega) =>
        entrega.id_actividad === idActividadNumerico,
    );

    if (yaEntregada) {
      setMensaje(
        "Ya existe una entrega registrada para esta actividad.",
      );
      setEsErrorMensaje(true);
      return;
    }

    setGuardando(true);

    try {
      await crearEntrega({
        id_actividad: actividadSeleccionada.id_actividad,
        id_usuario: usuario.id_usuario,
        fecha_entrega: fecha.toISOString(),
        descripcion: descripcion.trim(),
        archivo: archivoLimpio || null,
      });

      limpiarFormulario();
      setMostrarFormulario(false);

      setMensaje(
        "Entrega registrada correctamente. Estado: Pendiente.",
      );
      setEsErrorMensaje(false);

      await cargarDatos();
    } catch (err) {
      setMensaje(obtenerMensajeError(err));
      setEsErrorMensaje(true);
    } finally {
      setGuardando(false);
    }
  }

  function abrirArchivo(archivoUrl: string | null) {
    if (!archivoUrl) {
      return;
    }

    if (!esUrlValida(archivoUrl)) {
      setMensaje("El enlace del archivo no es válido.");
      setEsErrorMensaje(true);
      return;
    }

    window.open(
      archivoUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="deliveries-page">
      <header className="deliveries-header">
        <div className="deliveries-heading">
          <h1>
            {esEstudiante ? "Mis entregas" : "Entregas de mis materias"}
          </h1>

          <p>
            {esEstudiante
              ? "Consulta el estado de tus entregas y registra las actividades que has realizado."
              : "Consulta las entregas de las actividades de tus materias asignadas."}
          </p>
        </div>

        <div className="delivery-header-actions">
          <button
            type="button"
            className="delivery-refresh"
            onClick={() => void cargarDatos()}
            disabled={cargando}
          >
            <FiRefreshCw />
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>

          {esEstudiante && (
            <button
              type="button"
              className="delivery-new-button"
              onClick={abrirFormulario}
            >
              <FiPlus />
              Nueva entrega
            </button>
          )}
        </div>
      </header>

      {mensaje && !mostrarFormulario && (
        <div
          className={
            esErrorMensaje
              ? "delivery-message delivery-message-error"
              : "delivery-message delivery-message-success"
          }
          role={esErrorMensaje ? "alert" : "status"}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div className="delivery-message delivery-message-error">
          <p>{error}</p>

          <button
            type="button"
            className="delivery-refresh"
            onClick={() => void cargarDatos()}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <div className="delivery-search-box">
        <FiSearch />

        <input
          type="search"
          placeholder="Buscar por actividad, materia o descripción..."
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          aria-label="Buscar entregas"
        />
      </div>

      {cargando && (
        <div className="delivery-empty">
          Cargando entregas...
        </div>
      )}

      {!cargando && !error && entregasFiltradas.length === 0 && (
        <div className="delivery-empty">
          <FiFileText className="delivery-empty-icon" />

          <p>No hay entregas disponibles para mostrar.</p>

          {esEstudiante && actividadesDisponibles.length > 0 && (
            <button
              type="button"
              className="delivery-new-button"
              onClick={abrirFormulario}
            >
              <FiPlus />
              Registrar entrega
            </button>
          )}
        </div>
      )}

      {!cargando && !error && entregasFiltradas.length > 0 && (
        <div className="delivery-list">
          {entregasFiltradas.map((entrega) => (
            <article
              key={entrega.id_entrega}
              className="delivery-card"
            >
              <div className="delivery-card-top">
                <div className="delivery-title">
                  <div className="delivery-icon">
                    <FiFileText />
                  </div>

                  <div className="delivery-title-content">
                    <h3>
                      {entrega.actividad?.titulo ??
                        `Actividad #${entrega.id_actividad}`}
                    </h3>

                    <div className="delivery-subject">
                      {entrega.materia?.nombre_materia ??
                        "Materia no disponible"}
                    </div>
                  </div>
                </div>

                <span
                  className={
                    entrega.estado === "Aprobado"
                      ? "delivery-status delivery-status-aprobado"
                      : entrega.estado === "Reprobado"
                        ? "delivery-status delivery-status-reprobado"
                        : "delivery-status delivery-status-pendiente"
                  }
                >
                  {entrega.estado}
                </span>
              </div>

              <p className="delivery-card-description">
                {entrega.descripcion}
              </p>

              <div className="delivery-meta">
                <span>
                  Fecha de entrega:{" "}
                  {formatearFechaHora(entrega.fecha_entrega)}
                </span>

                <span>
                  Calificación:{" "}
                  {entrega.nota === null ||
                  entrega.nota === undefined
                    ? "Pendiente"
                    : `${entrega.nota}/100`}
                </span>
              </div>

              {entrega.comentario_docente && (
                <div className="delivery-comment">
                  <strong>Comentario del docente:</strong>
                  <p>{entrega.comentario_docente}</p>
                </div>
              )}

              {entrega.archivo && (
                <div className="delivery-card-actions">
                  <button
                    type="button"
                    className="delivery-file-button"
                    onClick={() => abrirArchivo(entrega.archivo)}
                  >
                    <FiUpload />
                    Ver archivo
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {mostrarFormulario && esEstudiante && (
        <div
          className="delivery-modal-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarFormulario();
            }
          }}
        >
          <div
            className="delivery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-entrega"
          >
            <div className="delivery-modal-header">
              <h2 id="titulo-formulario-entrega">
                Registrar entrega
              </h2>

              <button
                type="button"
                className="delivery-close"
                onClick={cerrarFormulario}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                <FiX />
              </button>
            </div>

            {mensaje && (
              <div
                className={
                  esErrorMensaje
                    ? "delivery-message delivery-message-error"
                    : "delivery-message delivery-message-success"
                }
                role={esErrorMensaje ? "alert" : "status"}
              >
                {mensaje}
              </div>
            )}

            <form
              className="delivery-form"
              onSubmit={manejarEnvio}
            >
              <div className="delivery-field">
                <label htmlFor="actividad">
                  Actividad *
                </label>

                <select
                  id="actividad"
                  value={idActividad}
                  onChange={(evento) =>
                    setIdActividad(evento.target.value)
                  }
                  required
                  disabled={guardando}
                >
                  <option value="">
                    Selecciona una actividad
                  </option>

                  {actividadesDisponibles.map((actividad) => (
                    <option
                      key={actividad.id_actividad}
                      value={actividad.id_actividad}
                    >
                      {actividad.titulo}
                    </option>
                  ))}
                </select>

                {actividadesDisponibles.length === 0 && (
                  <small>
                    No hay actividades disponibles para entregar.
                  </small>
                )}
              </div>

              <div className="delivery-field">
                <label htmlFor="fechaEntrega">
                  Fecha y hora de entrega *
                </label>

                <input
                  id="fechaEntrega"
                  type="datetime-local"
                  value={fechaEntrega}
                  onChange={(evento) =>
                    setFechaEntrega(evento.target.value)
                  }
                  required
                  disabled={guardando}
                />
              </div>

              <div className="delivery-field">
                <label htmlFor="descripcion">
                  Descripción *
                </label>

                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(evento) =>
                    setDescripcion(evento.target.value)
                  }
                  placeholder="Describe el trabajo que estás entregando..."
                  required
                  disabled={guardando}
                />
              </div>

              <div className="delivery-field">
                <label htmlFor="archivo">
                  Enlace al archivo (opcional)
                </label>

                <input
                  id="archivo"
                  type="url"
                  value={archivo}
                  onChange={(evento) =>
                    setArchivo(evento.target.value)
                  }
                  placeholder="https://..."
                  disabled={guardando}
                />

                <small>
                  Introduce un enlace accesible. La carga
                  directa de archivos todavía no está implementada.
                </small>
              </div>

              <div className="delivery-pending-note">
                El estado inicial será <strong>Pendiente</strong>.
                El docente registrará la calificación.
              </div>

              <div className="delivery-form-actions">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="delivery-save"
                  disabled={
                    guardando ||
                    actividadesDisponibles.length === 0
                  }
                >
                  <FiCheckCircle />
                  {guardando
                    ? "Guardando..."
                    : "Registrar entrega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}