import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  FiEdit2,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  actualizarApelacion,
  crearApelacion,
  obtenerApelaciones,
  type Apelacion,
} from "../services/apelacion";

import {
  obtenerIncapacidad,
  type Incapacidad,
} from "../services/incapacidad";

// Representa el formulario
interface FormularioApelacion {
  id_incapacidad: string;
  fecha_apelacion: string;
  motivo: string;
  respuesta: string;
  estado:
    | "pendiente"
    | "aprobada"
    | "rechazada";
  id_revisor: string;
}

// Devuelve el texto del estado
function obtenerTextoEstado(
  estado: Apelacion["estado"],
): string {
  if (estado === "aprobada") {
    return "Aprobada";
  }

  if (estado === "rechazada") {
    return "Rechazada";
  }

  return "Pendiente";
}

// Devuelve la clase visual del estado
function obtenerClaseEstado(
  estado: Apelacion["estado"],
): string {
  if (estado === "aprobada") {
    return "apelacion-estado aprobada";
  }

  if (estado === "rechazada") {
    return "apelacion-estado rechazada";
  }

  return "apelacion-estado pendiente";
}

// Formatea una fecha
function formatearFecha(
  fecha: string,
): string {
  if (!fecha) {
    return "-";
  }

  const fechaObjeto =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaObjeto.getTime(),
    )
  ) {
    return fecha;
  }

  return fechaObjeto.toLocaleString(
    "es-CO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

// Crea el formulario inicial
function formularioInicial(): FormularioApelacion {
  return {
    id_incapacidad: "",
    fecha_apelacion:
      new Date()
        .toISOString()
        .slice(0, 16),
    motivo: "",
    respuesta: "",
    estado: "pendiente",
    id_revisor: "",
  };
}

export default function Apelaciones() {
  const { usuario } = useAuth();

  const esAdministrador =
    usuario?.tipo_de_usuario ===
    "administrador";

  const [apelaciones, setApelaciones] =
    useState<Apelacion[]>([]);

  const [incapacidades, setIncapacidades] =
    useState<
      Record<number, Incapacidad>
    >({});

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [formulario, setFormulario] =
    useState<FormularioApelacion>(
      formularioInicial(),
    );

  const [
    apelacionEditando,
    setApelacionEditando,
  ] = useState<Apelacion | null>(
    null,
  );

  // Obtiene los IDs de incapacidades guardadas localmente
  function obtenerIdsIncapacidadesLocales(): number[] {
    const guardado =
      localStorage.getItem(
        "aprenzy_incapacidades",
      );

    if (!guardado) {
      return [];
    }

    try {
      const ids = JSON.parse(guardado);

      if (!Array.isArray(ids)) {
        return [];
      }

      return ids.filter(
        (id): id is number =>
          typeof id === "number",
      );
    } catch {
      return [];
    }
  }

  // Obtiene las apelaciones
  async function cargarApelaciones() {
    setCargando(true);
    setError("");

    try {
      if (esAdministrador) {
        // El administrador puede consultar todas
        const datos =
          await obtenerApelaciones();

        setApelaciones(datos);

        await cargarIncapacidades(
          datos,
        );

        return;
      }

      // El estudiante no tiene endpoint
      // para listar sus apelaciones.
      // Consultamos las apelaciones generales
      // y filtramos las incapacidades conocidas.
      const datos =
        await obtenerApelaciones();

      const ids =
        obtenerIdsIncapacidadesLocales();

      const datosFiltrados =
        datos.filter((apelacion) =>
          ids.includes(
            apelacion.id_incapacidad,
          ),
        );

      setApelaciones(
        datosFiltrados,
      );

      await cargarIncapacidades(
        datosFiltrados,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las apelaciones.",
      );
    } finally {
      setCargando(false);
    }
  }

  // Carga las incapacidades relacionadas
  async function cargarIncapacidades(
    datos: Apelacion[],
  ) {
    const ids = [
      ...new Set(
        datos.map(
          (apelacion) =>
            apelacion.id_incapacidad,
        ),
      ),
    ];

    if (ids.length === 0) {
      setIncapacidades({});
      return;
    }

    const resultados =
      await Promise.allSettled(
        ids.map((id) =>
          obtenerIncapacidad(id),
        ),
      );

    const mapa: Record<
      number,
      Incapacidad
    > = {};

    resultados.forEach(
      (resultado) => {
        if (
          resultado.status ===
          "fulfilled"
        ) {
          mapa[
            resultado.value
              .id_incapacidad
          ] =
            resultado.value;
        }
      },
    );

    setIncapacidades(mapa);
  }

  // Carga la información al entrar
  useEffect(() => {
    void cargarApelaciones();
  }, [esAdministrador]);

  // Filtra las apelaciones
  const apelacionesFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return apelaciones;
      }

      return apelaciones.filter(
        (apelacion) => {
          const incapacidad =
            incapacidades[
              apelacion
                .id_incapacidad
            ];

          return (
            String(
              apelacion.id_apelacion,
            ).includes(texto) ||
            String(
              apelacion.id_incapacidad,
            ).includes(texto) ||
            apelacion.motivo
              .toLowerCase()
              .includes(texto) ||
            apelacion.estado
              .toLowerCase()
              .includes(texto) ||
            incapacidad?.numero_radicado
              ?.toLowerCase()
              .includes(texto)
          );
        },
      );
    }, [
      apelaciones,
      incapacidades,
      busqueda,
    ]);

  // Actualiza un campo
  function actualizarCampo(
    campo: keyof FormularioApelacion,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  // Abre el formulario de creación
  function abrirFormularioCrear() {
    setError("");
    setMensaje("");
    setApelacionEditando(null);
    setFormulario(
      formularioInicial(),
    );
    setMostrarFormulario(true);
  }

  // Abre el formulario de edición
  function abrirFormularioEditar(
    apelacion: Apelacion,
  ) {
    setError("");
    setMensaje("");
    setApelacionEditando(
      apelacion,
    );

    setFormulario({
      id_incapacidad:
        String(
          apelacion.id_incapacidad,
        ),
      fecha_apelacion:
        apelacion.fecha_apelacion
          .slice(0, 16),
      motivo: apelacion.motivo,
      respuesta:
        apelacion.respuesta ?? "",
      estado: apelacion.estado,
      id_revisor:
        apelacion.id_revisor
          ? String(
              apelacion.id_revisor,
            )
          : "",
    });

    setMostrarFormulario(true);
  }

  // Cierra el formulario
  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setApelacionEditando(null);
    setFormulario(
      formularioInicial(),
    );
  }

  // Envía el formulario
  async function manejarSubmit(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    if (!usuario) {
      setError(
        "No se encontró el usuario autenticado.",
      );

      return;
    }

    const idIncapacidad =
      Number(
        formulario.id_incapacidad,
      );

    if (
      !idIncapacidad ||
      idIncapacidad <= 0
    ) {
      setError(
        "Debes indicar una incapacidad válida.",
      );

      return;
    }

    if (
      !formulario.fecha_apelacion
    ) {
      setError(
        "La fecha de apelación es obligatoria.",
      );

      return;
    }

    if (
      !formulario.motivo.trim()
    ) {
      setError(
        "El motivo de la apelación es obligatorio.",
      );

      return;
    }

    if (
      esAdministrador &&
      !formulario.id_revisor
    ) {
      setError(
        "Indica el ID del revisor.",
      );

      return;
    }

    setGuardando(true);

    try {
      if (apelacionEditando) {
        // Actualiza una apelación
        await actualizarApelacion(
          apelacionEditando.id_apelacion,
          {
            id_incapacidad:
              idIncapacidad,
            fecha_apelacion:
              new Date(
                formulario.fecha_apelacion,
              ).toISOString(),
            motivo:
              formulario.motivo.trim(),
            respuesta:
              formulario.respuesta.trim() ||
              null,
            estado:
              formulario.estado,
            id_revisor:
              formulario.id_revisor
                ? Number(
                    formulario.id_revisor,
                  )
                : null,
          },
        );

        setMensaje(
          "Apelación actualizada correctamente.",
        );
      } else {
        // Crea una apelación
        await crearApelacion({
          id_incapacidad:
            idIncapacidad,
          fecha_apelacion:
            new Date(
              formulario.fecha_apelacion,
            ).toISOString(),
          motivo:
            formulario.motivo.trim(),
          respuesta: null,
          estado: "pendiente",
          id_revisor: null,
        });

        setMensaje(
          "Apelación radicada correctamente.",
        );
      }

      cerrarFormulario();

      await cargarApelaciones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar la apelación.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="apelaciones-page">
      <style>
        {`
          .apelaciones-page {
            width: 100%;
          }

          .apelaciones-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .apelaciones-header h1 {
            margin: 0;
            color: #fff;
            font-size: 28px;
          }

          .apelaciones-header p {
            margin: 7px 0 0;
            color: #fff;
            line-height: 1.5;
          }

          .apelaciones-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .apelaciones-button {
            border: 0;
            border-radius: 9px;
            padding: 10px 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          .apelaciones-button.primary {
            background: #4f46e5;
            color: #fff;
          }

          .apelaciones-button.secondary {
            background: #fff;
            color: #344054;
            border: 1px solid #d0d5dd;
          }

          .apelaciones-button.success {
            background: #ecfdf3;
            color: #027a48;
          }

          .apelaciones-button.danger {
            background: #fff1f2;
            color: #b42318;
          }

          .apelaciones-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .apelaciones-alert {
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
          }

          .apelaciones-alert.error {
            background: #fef3f2;
            color: #b42318;
            border: 1px solid #fecdca;
          }

          .apelaciones-alert.success {
            background: #ecfdf3;
            color: #027a48;
            border: 1px solid #abefc6;
          }

          .apelaciones-toolbar {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
          }

          .apelaciones-search {
            flex: 1;
            max-width: 520px;
            position: relative;
          }

          .apelaciones-search svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .apelaciones-search input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 10px 12px 10px 38px;
            outline: none;
          }

          .apelaciones-search input:focus,
          .apelaciones-form input:focus,
          .apelaciones-form textarea:focus,
          .apelaciones-form select:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px #eef2ff;
          }

          .apelaciones-counter {
            color: #667085;
            font-size: 14px;
          }

          .apelaciones-list {
            display: grid;
            gap: 16px;
          }

          .apelacion-card {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 20px;
          }

          .apelacion-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
          }

          .apelacion-card-title {
            margin: 0;
            color: #172033;
            font-size: 18px;
          }

          .apelacion-card-subtitle {
            margin-top: 5px;
            color: #667085;
            font-size: 13px;
          }

          .apelacion-estado {
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .apelacion-estado.pendiente {
            background: #fffaeb;
            color: #b54708;
          }

          .apelacion-estado.aprobada {
            background: #ecfdf3;
            color: #027a48;
          }

          .apelacion-estado.rechazada {
            background: #fef3f2;
            color: #b42318;
          }

          .apelacion-info-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-top: 18px;
          }

          .apelacion-info-item {
            background: #f8fafc;
            border-radius: 9px;
            padding: 12px;
          }

          .apelacion-info-item span {
            display: block;
            color: #667085;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .apelacion-info-item strong {
            color: #172033;
            font-size: 14px;
          }

          .apelacion-motivo,
          .apelacion-respuesta {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eef1f4;
          }

          .apelacion-motivo strong,
          .apelacion-respuesta strong {
            display: block;
            color: #344054;
            margin-bottom: 6px;
          }

          .apelacion-motivo p,
          .apelacion-respuesta p {
            margin: 0;
            color: #667085;
            line-height: 1.6;
            white-space: pre-wrap;
          }

          .apelacion-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #eef1f4;
          }

          .apelaciones-empty,
          .apelaciones-loading {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 45px 20px;
            text-align: center;
            color: #667085;
          }

          .apelaciones-empty svg {
            font-size: 34px;
            color: #98a2b3;
          }

          .apelaciones-empty h3 {
            margin: 12px 0 6px;
            color: #344054;
          }

          .apelaciones-empty p {
            margin: 0;
          }

          .apelaciones-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            background: rgba(16, 24, 40, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .apelaciones-modal {
            width: min(680px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            padding: 24px;
            box-sizing: border-box;
          }

          .apelaciones-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 20px;
          }

          .apelaciones-modal-header h2 {
            margin: 0;
            color: #172033;
          }

          .apelaciones-modal-header p {
            margin: 5px 0 0;
            color: #667085;
            font-size: 14px;
          }

          .apelaciones-close {
            border: 0;
            background: transparent;
            color: #667085;
            font-size: 22px;
            cursor: pointer;
          }

          .apelaciones-form {
            display: grid;
            gap: 16px;
          }

          .apelaciones-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .apelaciones-form-group {
            display: grid;
            gap: 7px;
          }

          .apelaciones-form-group label {
            color: #344054;
            font-size: 14px;
            font-weight: 600;
          }

          .apelaciones-form input,
          .apelaciones-form textarea,
          .apelaciones-form select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 10px 12px;
            outline: none;
            color: #172033;
            font-family: inherit;
          }

          .apelaciones-form textarea {
            min-height: 110px;
            resize: vertical;
          }

          .apelaciones-form input:disabled {
            background: #f2f4f7;
          }

          .apelaciones-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          @media (max-width: 850px) {
            .apelaciones-header {
              flex-direction: column;
            }

            .apelacion-info-grid {
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 600px) {
            .apelaciones-toolbar {
              flex-direction: column;
              align-items: stretch;
            }

            .apelaciones-search {
              max-width: none;
            }

            .apelacion-card-header {
              flex-direction: column;
            }

            .apelacion-info-grid,
            .apelaciones-form-row {
              grid-template-columns: 1fr;
            }

            .apelaciones-modal {
              padding: 18px;
            }
          }
        `}
      </style>

      <div className="apelaciones-header">
        <div>
          <h1>Apelaciones</h1>

          <p>
            {esAdministrador
              ? "Revisa y gestiona las apelaciones relacionadas con incapacidades."
              : "Consulta y presenta apelaciones sobre tus incapacidades rechazadas."}
          </p>
        </div>

        <div className="apelaciones-header-actions">
          <button
            type="button"
            className="apelaciones-button secondary"
            onClick={() =>
              void cargarApelaciones()
            }
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>

          {!esAdministrador && (
            <button
              type="button"
              className="apelaciones-button primary"
              onClick={
                abrirFormularioCrear
              }
            >
              <FiPlus />
              Nueva apelación
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="apelaciones-alert error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="apelaciones-alert success">
          {mensaje}
        </div>
      )}

      <div className="apelaciones-toolbar">
        <div className="apelaciones-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Buscar por ID, radicado, estado o motivo..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </div>

        <div className="apelaciones-counter">
          {
            apelacionesFiltradas.length
          }{" "}
          apelación(es)
        </div>
      </div>

      {cargando ? (
        <div className="apelaciones-loading">
          Cargando apelaciones...
        </div>
      ) : apelacionesFiltradas.length ===
        0 ? (
        <div className="apelaciones-empty">
          <FiFileText />

          <h3>
            No hay apelaciones para mostrar
          </h3>

          <p>
            Las apelaciones registradas
            aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="apelaciones-list">
          {apelacionesFiltradas.map(
            (apelacion) => {
              const incapacidad =
                incapacidades[
                  apelacion
                    .id_incapacidad
                ];

              return (
                <article
                  className="apelacion-card"
                  key={
                    apelacion.id_apelacion
                  }
                >
                  <div className="apelacion-card-header">
                    <div>
                      <h2 className="apelacion-card-title">
                        Apelación #
                        {
                          apelacion.id_apelacion
                        }
                      </h2>

                      <div className="apelacion-card-subtitle">
                        Incapacidad #
                        {
                          apelacion.id_incapacidad
                        }

                        {incapacidad &&
                          ` · Radicado ${incapacidad.numero_radicado}`}
                      </div>
                    </div>

                    <span
                      className={obtenerClaseEstado(
                        apelacion.estado,
                      )}
                    >
                      {obtenerTextoEstado(
                        apelacion.estado,
                      )}
                    </span>
                  </div>

                  <div className="apelacion-info-grid">
                    <div className="apelacion-info-item">
                      <span>
                        Fecha de apelación
                      </span>

                      <strong>
                        {formatearFecha(
                          apelacion.fecha_apelacion,
                        )}
                      </strong>
                    </div>

                    <div className="apelacion-info-item">
                      <span>
                        Revisor
                      </span>

                      <strong>
                        {apelacion.id_revisor
                          ? `Usuario #${apelacion.id_revisor}`
                          : "Sin asignar"}
                      </strong>
                    </div>

                    <div className="apelacion-info-item">
                      <span>
                        Estado
                      </span>

                      <strong>
                        {obtenerTextoEstado(
                          apelacion.estado,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="apelacion-motivo">
                    <strong>
                      Motivo de la apelación
                    </strong>

                    <p>
                      {apelacion.motivo}
                    </p>
                  </div>

                  {apelacion.respuesta && (
                    <div className="apelacion-respuesta">
                      <strong>
                        Respuesta
                      </strong>

                      <p>
                        {
                          apelacion.respuesta
                        }
                      </p>
                    </div>
                  )}

                  {esAdministrador && (
                    <div className="apelacion-actions">
                      <button
                        type="button"
                        className="apelaciones-button secondary"
                        onClick={() =>
                          abrirFormularioEditar(
                            apelacion,
                          )
                        }
                      >
                        <FiEdit2 />
                        Revisar / editar
                      </button>
                    </div>
                  )}
                </article>
              );
            },
          )}
        </div>
      )}

      {mostrarFormulario && (
        <div className="apelaciones-overlay">
          <div className="apelaciones-modal">
            <div className="apelaciones-modal-header">
              <div>
                <h2>
                  {apelacionEditando
                    ? "Revisar apelación"
                    : "Nueva apelación"}
                </h2>

                <p>
                  {apelacionEditando
                    ? "Actualiza el estado y la respuesta de la apelación."
                    : "Presenta una apelación relacionada con una incapacidad."}
                </p>
              </div>

              <button
                type="button"
                className="apelaciones-close"
                onClick={
                  cerrarFormulario
                }
                disabled={guardando}
              >
                <FiX />
              </button>
            </div>

            <form
              className="apelaciones-form"
              onSubmit={manejarSubmit}
            >
              <div className="apelaciones-form-group">
                <label htmlFor="id-incapacidad-apelacion">
                  ID de incapacidad
                </label>

                <input
                  id="id-incapacidad-apelacion"
                  type="number"
                  min="1"
                  value={
                    formulario.id_incapacidad
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "id_incapacidad",
                      evento.target.value,
                    )
                  }
                  disabled={
                    Boolean(
                      apelacionEditando,
                    ) || guardando
                  }
                  placeholder="Ej. 15"
                />
              </div>

              <div className="apelaciones-form-group">
                <label htmlFor="fecha-apelacion">
                  Fecha de apelación
                </label>

                <input
                  id="fecha-apelacion"
                  type="datetime-local"
                  value={
                    formulario.fecha_apelacion
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "fecha_apelacion",
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                />
              </div>

              <div className="apelaciones-form-group">
                <label htmlFor="motivo-apelacion">
                  Motivo
                </label>

                <textarea
                  id="motivo-apelacion"
                  value={
                    formulario.motivo
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "motivo",
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                  placeholder="Explica por qué solicitas la revisión..."
                />
              </div>

              {esAdministrador &&
                apelacionEditando && (
                  <>
                    <div className="apelaciones-form-row">
                      <div className="apelaciones-form-group">
                        <label htmlFor="estado-apelacion">
                          Estado
                        </label>

                        <select
                          id="estado-apelacion"
                          value={
                            formulario.estado
                          }
                          onChange={(evento) =>
                            actualizarCampo(
                              "estado",
                              evento.target.value,
                            )
                          }
                          disabled={
                            guardando
                          }
                        >
                          <option value="pendiente">
                            Pendiente
                          </option>

                          <option value="aprobada">
                            Aprobada
                          </option>

                          <option value="rechazada">
                            Rechazada
                          </option>
                        </select>
                      </div>

                      <div className="apelaciones-form-group">
                        <label htmlFor="revisor-apelacion">
                          ID del revisor
                        </label>

                        <input
                          id="revisor-apelacion"
                          type="number"
                          min="1"
                          value={
                            formulario.id_revisor
                          }
                          onChange={(
                            evento,
                          ) =>
                            actualizarCampo(
                              "id_revisor",
                              evento.target.value,
                            )
                          }
                          disabled={
                            guardando
                          }
                          placeholder="ID usuario"
                        />
                      </div>
                    </div>

                    <div className="apelaciones-form-group">
                      <label htmlFor="respuesta-apelacion">
                        Respuesta
                      </label>

                      <textarea
                        id="respuesta-apelacion"
                        value={
                          formulario.respuesta
                        }
                        onChange={(evento) =>
                          actualizarCampo(
                            "respuesta",
                            evento.target
                              .value,
                          )
                        }
                        disabled={
                          guardando
                        }
                        placeholder="Escribe la respuesta a la apelación..."
                      />
                    </div>
                  </>
                )}

              <div className="apelaciones-form-actions">
                <button
                  type="button"
                  className="apelaciones-button secondary"
                  onClick={
                    cerrarFormulario
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="apelaciones-button primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : apelacionEditando
                      ? "Guardar revisión"
                      : "Radicar apelación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}