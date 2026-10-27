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

// Representa la información adicional de una entrega
interface EntregaVista extends Entrega {
  actividad?: Actividad;
  materia?: Materia;
}

// Formatea una fecha
function formatearFecha(fecha: string): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaNormalizada = fecha.includes("T")
    ? fecha
    : `${fecha}T00:00:00`;

  const valor = new Date(fechaNormalizada);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Obtiene el texto visual de la nota
function textoNota(nota: number | null): string {
  if (nota === null || nota === undefined) {
    return "Sin calificar";
  }

  return `${nota}/100`;
}

export default function Calificaciones() {
  const { usuario } = useAuth();

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>(
    [],
  );
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [entregaSeleccionada, setEntregaSeleccionada] =
    useState<EntregaVista | null>(null);

  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Determina si el usuario es docente
  const esDocente =
    usuario?.tipo_de_usuario === "docente";

  // Carga las calificaciones
  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

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
      const mensajeError =
        err instanceof Error
          ? err.message
          : "No fue posible cargar las calificaciones";

      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }

  // Carga los datos al abrir la pantalla
  useEffect(() => {
    cargarDatos();
  }, []);

  // Une entregas con actividades y materias
  const entregasVista = useMemo<EntregaVista[]>(
    () =>
      entregas.map((entrega) => {
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
      }),
    [entregas, actividades, materias],
  );

  // Filtra por actividad, materia o descripción
  const entregasFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return entregasVista;
    }

    return entregasVista.filter((entrega) => {
      const actividad =
        entrega.actividad?.titulo ?? "";

      const materia =
        entrega.materia?.nombre_materia ?? "";

      const descripcion =
        entrega.descripcion ?? "";

      return (
        actividad.toLowerCase().includes(termino) ||
        materia.toLowerCase().includes(termino) ||
        descripcion.toLowerCase().includes(termino)
      );
    });
  }, [busqueda, entregasVista]);

  // Calcula el promedio
  const promedio = useMemo(() => {
    const notas = entregas
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
  }, [entregas]);

  // Cuenta las entregas calificadas
  const cantidadCalificadas = useMemo(
    () =>
      entregas.filter(
        (entrega) =>
          entrega.nota !== null &&
          entrega.nota !== undefined,
      ).length,
    [entregas],
  );

  // Abre el formulario de calificación
  function abrirCalificacion(
    entrega: EntregaVista,
  ) {
    setEntregaSeleccionada(entrega);

    setNota(
      entrega.nota !== null &&
        entrega.nota !== undefined
        ? String(entrega.nota)
        : "",
    );

    setMensaje("");
  }

  // Cierra el formulario
  function cerrarCalificacion() {
    if (guardando) {
      return;
    }

    setEntregaSeleccionada(null);
    setNota("");
  }

  // Guarda una calificación
  async function guardarCalificacion() {
    if (!entregaSeleccionada) {
      return;
    }

    const valor = Number(nota);

    if (!Number.isInteger(valor)) {
      setMensaje(
        "La calificación debe ser un número entero.",
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

      const entregaActualizada =
        await calificarEntrega(
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

      setTimeout(() => {
        setEntregaSeleccionada(null);
        setNota("");
        setMensaje("");
      }, 900);
    } catch (err) {
      const mensajeError =
        err instanceof Error
          ? err.message
          : "No fue posible guardar la calificación";

      setMensaje(mensajeError);
    } finally {
      setGuardando(false);
    }
  }

  // Abre el archivo de una entrega
  function abrirArchivo(archivo: string | null) {
    if (!archivo) {
      setMensaje(
        "Esta entrega no tiene un archivo disponible.",
      );
      return;
    }

    window.open(archivo, "_blank");
  }

  return (
    <div className="grades-page">
      <style>
        {`
          .grades-page {
            width: 100%;
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
            color: #fff;
            font-size: 28px;
          }

          .grades-header p {
            margin: 0;
            color: #fff;
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

          .grades-refresh:hover {
            background: #f9fafb;
          }

          .grades-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 22px;
          }

          .grades-stat {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 18px;
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
          }

          .grade-card h3 {
            margin: 0;
            color: #172033;
            font-size: 17px;
          }

          .grade-card-subject {
            margin-top: 4px;
            color: #667085;
            font-size: 13px;
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
          }

          .grade-modal-info {
            margin: 18px 0;
            color: #667085;
            line-height: 1.5;
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
          }
        `}
      </style>

      <div className="grades-header">
        <div>
          <h1>Calificaciones</h1>

          <p>
            Consulta y gestiona las calificaciones de
            las entregas académicas.
          </p>
        </div>

        <button
          type="button"
          className="grades-refresh"
          onClick={cargarDatos}
          disabled={cargando}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </div>

      <div className="grades-stats">
        <div className="grades-stat">
          <span>Total de entregas</span>
          <strong>{entregas.length}</strong>
        </div>

        <div className="grades-stat">
          <span>Entregas calificadas</span>
          <strong>{cantidadCalificadas}</strong>
        </div>

        <div className="grades-stat">
          <span>Promedio</span>
          <strong>
            {promedio === null
              ? "--"
              : `${promedio}/100`}
          </strong>
        </div>
      </div>

      <div className="grades-toolbar">
        <div className="grades-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Buscar por actividad, materia o descripción..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>
      </div>

      {cargando && (
        <div className="grade-loading">
          Cargando calificaciones...
        </div>
      )}

      {!cargando && error && (
        <div className="grade-error">
          <p>{error}</p>

          <button
            type="button"
            className="grade-action"
            onClick={cargarDatos}
          >
            <FiRefreshCw />
            Intentar nuevamente
          </button>
        </div>
      )}

      {!cargando &&
        !error &&
        entregasFiltradas.length === 0 && (
          <div className="grade-empty">
            <FiFileText size={30} />

            <p>
              No hay entregas disponibles para mostrar.
            </p>
          </div>
        )}

      {!cargando &&
        !error &&
        entregasFiltradas.length > 0 && (
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
                        {entrega.actividad?.titulo ??
                          "Actividad"}
                      </h3>

                      <div className="grade-card-subject">
                        {entrega.materia
                          ?.nombre_materia ??
                          "Materia no disponible"}
                      </div>
                    </div>
                  </div>

                  <div className="grade-value">
                    {textoNota(entrega.nota)}
                  </div>
                </div>

                <p className="grade-card-description">
                  {entrega.descripcion ||
                    "Sin descripción."}
                </p>

                <div className="grade-card-meta">
                  <span>
                    Entrega:{" "}
                    {formatearFecha(
                      entrega.fecha_entrega,
                    )}
                  </span>

                  <span>
                    Estado: {entrega.estado}
                  </span>
                </div>

                <div className="grade-card-actions">
                  {entrega.archivo && (
                    <button
                      type="button"
                      className="grade-action"
                      onClick={() =>
                        abrirArchivo(
                          entrega.archivo,
                        )
                      }
                    >
                      <FiDownload />
                      Ver archivo
                    </button>
                  )}

                  {esDocente && (
                    <button
                      type="button"
                      className="grade-action primary"
                      onClick={() =>
                        abrirCalificacion(entrega)
                      }
                    >
                      <FiEdit3 />
                      Calificar
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
            if (
              event.target === event.currentTarget
            ) {
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
              >
                <FiX />
              </button>
            </div>

            <p className="grade-modal-info">
              {entregaSeleccionada.actividad
                ?.titulo ?? "Actividad"}
            </p>

            <label className="grade-modal-label">
              Calificación
            </label>

            <input
              className="grade-modal-input"
              type="number"
              min="0"
              max="100"
              step="1"
              value={nota}
              onChange={(event) =>
                setNota(event.target.value)
              }
              placeholder="0 - 100"
            />

            {mensaje && (
              <div className="grade-modal-message">
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
                onClick={guardarCalificacion}
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}