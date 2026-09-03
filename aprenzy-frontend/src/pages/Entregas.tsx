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

// Representa una entrega con información académica
interface EntregaVista extends Entrega {
  actividad?: Actividad;
  materia?: Materia;
}

// Formatea fecha y hora
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
  const [estado, setEstado] = useState<
    "Aprobado" | "Reprobado"
  >("Aprobado");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Determina si el usuario es estudiante
  const esEstudiante =
    usuario?.tipo_de_usuario === "estudiante";

  // Carga los datos
  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

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
          : "No fue posible cargar las entregas.";

      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }

  // Carga la información al abrir el módulo
  useEffect(() => {
    cargarDatos();
  }, []);

  // Une entregas con sus actividades y materias
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

  // Filtra las entregas
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

      const descripcionEntrega =
        entrega.descripcion ?? "";

      return (
        actividad.toLowerCase().includes(termino) ||
        materia.toLowerCase().includes(termino) ||
        descripcionEntrega
          .toLowerCase()
          .includes(termino)
      );
    });
  }, [busqueda, entregasVista]);

  // Limpia el formulario
  function limpiarFormulario() {
    setIdActividad("");
    setFechaEntrega("");
    setEstado("Aprobado");
    setDescripcion("");
    setArchivo("");
    setMensaje("");
  }

  // Abre el formulario
  function abrirFormulario() {
    limpiarFormulario();
    setMostrarFormulario(true);
  }

  // Cierra el formulario
  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    limpiarFormulario();
  }

  // Registra una nueva entrega
  async function manejarEnvio(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!usuario?.id_usuario) {
      setMensaje(
        "No se encontró el usuario autenticado.",
      );
      return;
    }

    if (!idActividad) {
      setMensaje("Selecciona una actividad.");
      return;
    }

    if (!fechaEntrega) {
      setMensaje("Selecciona la fecha de entrega.");
      return;
    }

    if (!descripcion.trim()) {
      setMensaje(
        "Escribe una descripción de la entrega.",
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const nuevaEntrega = await crearEntrega({
        id_actividad: Number(idActividad),
        id_usuario: usuario.id_usuario,
        fecha_entrega: new Date(
          fechaEntrega,
        ).toISOString(),
        estado,
        descripcion: descripcion.trim(),
        comentario_docente: null,
        archivo: archivo.trim() || null,
        nota: null,
      });

      setEntregas((actuales) => [
        ...actuales,
        nuevaEntrega,
      ]);

      setMensaje(
        "Entrega registrada correctamente.",
      );

      setTimeout(() => {
        setMostrarFormulario(false);
        limpiarFormulario();
      }, 900);
    } catch (err) {
      const mensajeError =
        err instanceof Error
          ? err.message
          : "No fue posible registrar la entrega.";

      setMensaje(mensajeError);
    } finally {
      setGuardando(false);
    }
  }

  // Obtiene las actividades disponibles para el estudiante
  const actividadesDisponibles = useMemo(() => {
    const idsEntregados = new Set(
      entregas.map(
        (entrega) => entrega.id_actividad,
      ),
    );

    return actividades.filter(
      (actividad) =>
        !idsEntregados.has(
          actividad.id_actividad,
        ),
    );
  }, [actividades, entregas]);

  // Abre el archivo
  function abrirArchivo(archivo: string | null) {
    if (!archivo) {
      return;
    }

    window.open(archivo, "_blank");
  }

  return (
    <div className="deliveries-page">
      <style>
        {`
          .deliveries-page {
            width: 100%;
          }

          .deliveries-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }

          .deliveries-header h1 {
            margin: 0 0 8px;
            color: #172033;
            font-size: 28px;
          }

          .deliveries-header p {
            margin: 0;
            color: #667085;
          }

          .delivery-new-button,
          .delivery-refresh {
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

          .delivery-new-button {
            background: #4f46e5;
            color: #fff;
            border-color: #4f46e5;
          }

          .delivery-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .delivery-search-box {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 18px;
            position: relative;
          }

          .delivery-search-box svg {
            position: absolute;
            left: 29px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .delivery-search-box input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 11px 14px 11px 38px;
            outline: none;
          }

          .delivery-list {
            display: grid;
            gap: 14px;
          }

          .delivery-card {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 18px;
          }

          .delivery-card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
          }

          .delivery-title {
            display: flex;
            gap: 12px;
          }

          .delivery-icon {
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

          .delivery-card h3 {
            margin: 0;
            color: #172033;
            font-size: 17px;
          }

          .delivery-subject {
            margin-top: 4px;
            color: #667085;
            font-size: 13px;
          }

          .delivery-status {
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .delivery-status.aprobado {
            background: #ecfdf3;
            color: #027a48;
          }

          .delivery-status.reprobado {
            background: #fef3f2;
            color: #b42318;
          }

          .delivery-card-description {
            color: #475467;
            line-height: 1.5;
            margin: 16px 0;
          }

          .delivery-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            color: #667085;
            font-size: 13px;
          }

          .delivery-comment {
            margin-top: 15px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 9px;
            color: #475467;
            font-size: 14px;
          }

          .delivery-card-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
          }

          .delivery-file-button {
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

          .delivery-empty,
          .delivery-loading,
          .delivery-error {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 30px;
            text-align: center;
            color: #667085;
          }

          .delivery-error {
            color: #b42318;
          }

          .delivery-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(16, 24, 40, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 2000;
            overflow-y: auto;
          }

          .delivery-modal {
            width: 100%;
            max-width: 560px;
            background: #fff;
            border-radius: 16px;
            padding: 24px;
            box-sizing: border-box;
          }

          .delivery-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .delivery-modal-header h2 {
            margin: 0;
            color: #172033;
            font-size: 21px;
          }

          .delivery-close {
            border: 0;
            background: transparent;
            cursor: pointer;
            font-size: 20px;
          }

          .delivery-form {
            display: grid;
            gap: 16px;
          }

          .delivery-field {
            display: grid;
            gap: 7px;
          }

          .delivery-field label {
            color: #344054;
            font-size: 14px;
            font-weight: 700;
          }

          .delivery-field input,
          .delivery-field select,
          .delivery-field textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 11px 12px;
            font-family: inherit;
            outline: none;
          }

          .delivery-field textarea {
            min-height: 100px;
            resize: vertical;
          }

          .delivery-field input:focus,
          .delivery-field select:focus,
          .delivery-field textarea:focus {
            border-color: #6366f1;
          }

          .delivery-message {
            padding: 10px 12px;
            border-radius: 9px;
            background: #fef3f2;
            color: #b42318;
            font-size: 14px;
          }

          .delivery-success {
            background: #ecfdf3;
            color: #027a48;
          }

          .delivery-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 5px;
          }

          .delivery-form-actions button {
            border: 1px solid #d0d5dd;
            background: #fff;
            color: #344054;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          .delivery-form-actions .save {
            background: #4f46e5;
            color: #fff;
            border-color: #4f46e5;
          }

          @media (max-width: 700px) {
            .deliveries-header {
              flex-direction: column;
            }

            .delivery-card-top {
              flex-direction: column;
            }

            .delivery-header-actions {
              width: 100%;
            }

            .delivery-new-button,
            .delivery-refresh {
              flex: 1;
              justify-content: center;
            }
          }
        `}
      </style>

      <div className="deliveries-header">
        <div>
          <h1>Entregas</h1>

          <p>
            Consulta tus entregas y registra nuevas
            actividades académicas.
          </p>
        </div>

        <div className="delivery-header-actions">
          <button
            type="button"
            className="delivery-refresh"
            onClick={cargarDatos}
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
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
      </div>

      <div className="delivery-search-box">
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

      {cargando && (
        <div className="delivery-loading">
          Cargando entregas...
        </div>
      )}

      {!cargando && error && (
        <div className="delivery-error">
          <p>{error}</p>

          <button
            type="button"
            className="delivery-refresh"
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
          <div className="delivery-empty">
            <FiFileText size={30} />

            <p>
              No hay entregas disponibles para mostrar.
            </p>

            {esEstudiante && (
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

      {!cargando &&
        !error &&
        entregasFiltradas.length > 0 && (
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

                    <div>
                      <h3>
                        {entrega.actividad?.titulo ??
                          "Actividad"}
                      </h3>

                      <div className="delivery-subject">
                        {entrega.materia
                          ?.nombre_materia ??
                          "Materia no disponible"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`delivery-status ${
                      entrega.estado === "Aprobado"
                        ? "aprobado"
                        : "reprobado"
                    }`}
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
                    {formatearFechaHora(
                      entrega.fecha_entrega,
                    )}
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
                    <strong>
                      Comentario del docente:
                    </strong>{" "}
                    {entrega.comentario_docente}
                  </div>
                )}

                {entrega.archivo && (
                  <div className="delivery-card-actions">
                    <button
                      type="button"
                      className="delivery-file-button"
                      onClick={() =>
                        abrirArchivo(
                          entrega.archivo,
                        )
                      }
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

      {mostrarFormulario && (
        <div
          className="delivery-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              cerrarFormulario();
            }
          }}
        >
          <div className="delivery-modal">
            <div className="delivery-modal-header">
              <h2>Registrar entrega</h2>

              <button
                type="button"
                className="delivery-close"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                <FiX />
              </button>
            </div>

            <form
              className="delivery-form"
              onSubmit={manejarEnvio}
            >
              <div className="delivery-field">
                <label htmlFor="actividad">
                  Actividad
                </label>

                <select
                  id="actividad"
                  value={idActividad}
                  onChange={(event) =>
                    setIdActividad(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Selecciona una actividad
                  </option>

                  {actividadesDisponibles.map(
                    (actividad) => (
                      <option
                        key={
                          actividad.id_actividad
                        }
                        value={
                          actividad.id_actividad
                        }
                      >
                        {actividad.titulo}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="delivery-field">
                <label htmlFor="fechaEntrega">
                  Fecha de entrega
                </label>

                <input
                  id="fechaEntrega"
                  type="datetime-local"
                  value={fechaEntrega}
                  onChange={(event) =>
                    setFechaEntrega(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="delivery-field">
                <label htmlFor="estado">
                  Estado
                </label>

                <select
                  id="estado"
                  value={estado}
                  onChange={(event) =>
                    setEstado(
                      event.target.value as
                        | "Aprobado"
                        | "Reprobado",
                    )
                  }
                >
                  <option value="Aprobado">
                    Aprobado
                  </option>

                  <option value="Reprobado">
                    Reprobado
                  </option>
                </select>
              </div>

              <div className="delivery-field">
                <label htmlFor="descripcion">
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value,
                    )
                  }
                  placeholder="Describe la actividad que estás entregando..."
                  required
                />
              </div>

              <div className="delivery-field">
                <label htmlFor="archivo">
                  Archivo
                </label>

                <input
                  id="archivo"
                  type="url"
                  value={archivo}
                  onChange={(event) =>
                    setArchivo(
                      event.target.value,
                    )
                  }
                  placeholder="https://..."
                />
              </div>

              {mensaje && (
                <div
                  className={`delivery-message ${
                    mensaje.includes("correctamente")
                      ? "delivery-success"
                      : ""
                  }`}
                >
                  {mensaje}
                </div>
              )}

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
                  className="save"
                  disabled={guardando}
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