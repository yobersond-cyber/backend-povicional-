
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
  obtenerIncapacidades,
} from "../services/incapacidad";

import type {
  Incapacidad,
} from "../services/incapacidad";

// Representa el formulario de apelación.
interface FormularioApelacion {
  numero_radicado: string;
  motivo: string;
  respuesta: string;
  estado: "aprobada" | "rechazada";
  archivo: File | null;
}

// Devuelve el texto del estado.
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

// Devuelve la clase visual del estado.
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

// Formatea una fecha.
function formatearFecha(
  fecha: string,
): string {
  if (!fecha) {
    return "-";
  }

  const fechaObjeto = new Date(fecha);

  if (Number.isNaN(fechaObjeto.getTime())) {
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

// Crea el formulario inicial.
function formularioInicial(): FormularioApelacion {
  return {
    numero_radicado: "",
    motivo: "",
    respuesta: "",
    estado: "rechazada",
    archivo: null,
  };
}

export default function Apelaciones() {
  const { usuario } = useAuth();

  const esCoordinador =
    usuario?.tipo_de_usuario === "coordinador";

  const esEstudiante =
    usuario?.tipo_de_usuario === "estudiante";

  const [apelaciones, setApelaciones] =
    useState<Apelacion[]>([]);

  const [incapacidades, setIncapacidades] =
    useState<Incapacidad[]>([]);

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
  ] = useState<Apelacion | null>(null);

  // Obtiene las apelaciones y las incapacidades
  // permitidas para el usuario autenticado.
  async function cargarApelaciones() {
    setCargando(true);
    setError("");

    try {
      const [
        apelacionesObtenidas,
        incapacidadesObtenidas,
      ] = await Promise.all([
        obtenerApelaciones(),
        obtenerIncapacidades(),
      ]);

      setApelaciones(apelacionesObtenidas);
      setIncapacidades(incapacidadesObtenidas);
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

  // Carga la información al entrar.
  useEffect(() => {
    if (esCoordinador || esEstudiante) {
      void cargarApelaciones();
    } else {
      setCargando(false);
      setError(
        "No tienes permisos para consultar las apelaciones.",
      );
    }
  }, [esCoordinador, esEstudiante]);

  // Relaciona cada apelación con su incapacidad.
  const incapacidadesPorId = useMemo(() => {
    const mapa = new Map<number, Incapacidad>();

    incapacidades.forEach((incapacidad) => {
      mapa.set(
        incapacidad.id_incapacidad,
        incapacidad,
      );
    });

    return mapa;
  }, [incapacidades]);

  // Identifica las incapacidades que ya tienen apelación.
  const idsIncapacidadesApeladas = useMemo(
    () =>
      new Set(
        apelaciones.map(
          (apelacion) => apelacion.id_incapacidad,
        ),
      ),
    [apelaciones],
  );

  // El estudiante solo puede apelar incapacidades propias
  // que estén rechazadas y no tengan una apelación previa.
  const incapacidadesDisponibles = useMemo(
    () =>
      incapacidades.filter(
        (incapacidad) =>
          incapacidad.estado === "rechazada" &&
          !idsIncapacidadesApeladas.has(
            incapacidad.id_incapacidad,
          ),
      ),
    [
      incapacidades,
      idsIncapacidadesApeladas,
    ],
  );

  // Filtra las apelaciones.
  const apelacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return apelaciones;
    }

    return apelaciones.filter((apelacion) => {
      const incapacidad =
        incapacidadesPorId.get(
          apelacion.id_incapacidad,
        );

      return (
        apelacion.motivo.toLowerCase().includes(texto) ||
        apelacion.estado.toLowerCase().includes(texto) ||
        (incapacidad?.numero_radicado ?? "")
          .toLowerCase()
          .includes(texto) ||
        (incapacidad?.motivo ?? "")
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [
    apelaciones,
    incapacidadesPorId,
    busqueda,
  ]);

  // Actualiza un campo del formulario.
  function actualizarCampo(
    campo: keyof FormularioApelacion,
    valor: string | File | null,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  // Abre el formulario de creación.
  function abrirFormularioCrear() {
    setError("");
    setMensaje("");
    setApelacionEditando(null);
    setFormulario(formularioInicial());
    setMostrarFormulario(true);
  }

  // Abre el formulario de revisión.
  function abrirFormularioEditar(
    apelacion: Apelacion,
  ) {
    setError("");
    setMensaje("");
    setApelacionEditando(apelacion);

    setFormulario({
      numero_radicado: "",
      motivo: "",
      respuesta: apelacion.respuesta ?? "",
      estado:
        apelacion.estado === "aprobada"
          ? "aprobada"
          : "rechazada",
      archivo: null,
    });

    setMostrarFormulario(true);
  }

  // Cierra el formulario.
  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setApelacionEditando(null);
    setFormulario(formularioInicial());
  }

  // Envía el formulario.
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

    if (apelacionEditando && !esCoordinador) {
      setError(
        "No tienes permisos para revisar apelaciones.",
      );
      return;
    }

    if (!apelacionEditando && !esEstudiante) {
      setError(
        "Solo los estudiantes pueden presentar apelaciones.",
      );
      return;
    }

    if (apelacionEditando) {
      if (!formulario.respuesta.trim()) {
        setError(
          "Debes escribir una respuesta para la apelación.",
        );
        return;
      }
    } else {
      if (!formulario.numero_radicado) {
        setError(
          "Debes seleccionar una incapacidad rechazada.",
        );
        return;
      }

      if (!formulario.motivo.trim()) {
        setError(
          "El motivo de la apelación es obligatorio.",
        );
        return;
      }

      const incapacidadSeleccionada =
        incapacidadesDisponibles.find(
          (incapacidad) =>
            incapacidad.numero_radicado ===
            formulario.numero_radicado,
        );

      if (!incapacidadSeleccionada) {
        setError(
          "La incapacidad seleccionada no está disponible para apelación.",
        );
        return;
      }
    }

    setGuardando(true);

    try {
      if (apelacionEditando) {
        await actualizarApelacion(
          apelacionEditando.id_apelacion,
          {
            respuesta: formulario.respuesta.trim(),
            estado: formulario.estado,
          },
        );

        setMensaje(
          formulario.estado === "aprobada"
            ? "Apelación aprobada correctamente. La incapacidad también fue aprobada."
            : "Apelación rechazada correctamente.",
        );
      } else {
        await crearApelacion({
          numero_radicado:
            formulario.numero_radicado,
          motivo: formulario.motivo.trim(),
          archivo: formulario.archivo,
        });

        setMensaje(
          "Apelación radicada correctamente.",
        );
      }

      setMostrarFormulario(false);
      setApelacionEditando(null);
      setFormulario(formularioInicial());

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

          .apelaciones-form input:disabled,
          .apelaciones-form select:disabled,
          .apelaciones-form textarea:disabled {
            background: #f2f4f7;
          }

          .apelaciones-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .apelaciones-help {
            color: #667085;
            font-size: 13px;
            line-height: 1.5;
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
            {esCoordinador
              ? "Revisa las apelaciones presentadas por los estudiantes de tu colegio."
              : "Consulta y presenta apelaciones sobre tus incapacidades rechazadas."}
          </p>
        </div>

        <div className="apelaciones-header-actions">
          <button
            type="button"
            className="apelaciones-button secondary"
            onClick={() => void cargarApelaciones()}
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>

          {esEstudiante && (
            <button
              type="button"
              className="apelaciones-button primary"
              onClick={abrirFormularioCrear}
              disabled={incapacidadesDisponibles.length === 0}
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
            placeholder="Buscar por radicado, estado o motivo..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
          />
        </div>

        <div className="apelaciones-counter">
          {apelacionesFiltradas.length} apelación(es)
        </div>
      </div>

      {cargando ? (
        <div className="apelaciones-loading">
          Cargando apelaciones...
        </div>
      ) : apelacionesFiltradas.length === 0 ? (
        <div className="apelaciones-empty">
          <FiFileText />

          <h3>
            No hay apelaciones para mostrar
          </h3>

          <p>
            {esEstudiante
              ? "Cuando presentes una apelación, aparecerá aquí."
              : "Las apelaciones presentadas por los estudiantes aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="apelaciones-list">
          {apelacionesFiltradas.map((apelacion) => {
            const incapacidad =
              incapacidadesPorId.get(
                apelacion.id_incapacidad,
              );

            return (
              <article
                className="apelacion-card"
                key={apelacion.id_apelacion}
              >
                <div className="apelacion-card-header">
                  <div>
                    <h2 className="apelacion-card-title">
                      Apelación
                    </h2>

                    <div className="apelacion-card-subtitle">
                      {incapacidad
                        ? `Radicado ${incapacidad.numero_radicado}`
                        : "Información de incapacidad"}
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
                      Radicado
                    </span>

                    <strong>
                      {incapacidad?.numero_radicado ?? "No disponible"}
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

                {incapacidad && (
                  <div className="apelacion-info-grid">
                    <div className="apelacion-info-item">
                      <span>
                        Inicio de incapacidad
                      </span>

                      <strong>
                        {incapacidad.fecha_inicio}
                      </strong>
                    </div>

                    <div className="apelacion-info-item">
                      <span>
                        Fin de incapacidad
                      </span>

                      <strong>
                        {incapacidad.fecha_fin}
                      </strong>
                    </div>

                    <div className="apelacion-info-item">
                      <span>
                        Estado de incapacidad
                      </span>

                      <strong>
                        {incapacidad.estado}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="apelacion-motivo">
                  <strong>
                    Motivo de la apelación
                  </strong>

                  <p>
                    {apelacion.motivo}
                  </p>
                </div>

                {apelacion.archivo && (
                  <div className="apelacion-motivo">
                    <strong>
                      Documento adjunto
                    </strong>

                    <a
                      href={apelacion.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver documento adjunto
                    </a>
                  </div>
                )}

                {apelacion.respuesta && (
                  <div className="apelacion-respuesta">
                    <strong>
                      Respuesta del coordinador
                    </strong>

                    <p>
                      {apelacion.respuesta}
                    </p>
                  </div>
                )}

                {esCoordinador &&
                  apelacion.estado === "pendiente" && (
                    <div className="apelacion-actions">
                      <button
                        type="button"
                        className="apelaciones-button secondary"
                        onClick={() =>
                          abrirFormularioEditar(apelacion)
                        }
                      >
                        <FiEdit2 />
                        Revisar apelación
                      </button>
                    </div>
                  )}
              </article>
            );
          })}
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
                    ? "Registra la decisión y la respuesta para el estudiante."
                    : "Selecciona una de tus incapacidades rechazadas y explica el motivo de la apelación."}
                </p>
              </div>

              <button
                type="button"
                className="apelaciones-close"
                onClick={cerrarFormulario}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                <FiX />
              </button>
            </div>

            <form
              className="apelaciones-form"
              onSubmit={manejarSubmit}
            >
              {!apelacionEditando ? (
                <>
                  <div className="apelaciones-form-group">
                    <label htmlFor="incapacidad-apelacion">
                      Incapacidad rechazada
                    </label>

                    <select
                      id="incapacidad-apelacion"
                      value={formulario.numero_radicado}
                      onChange={(evento) =>
                        actualizarCampo(
                          "numero_radicado",
                          evento.target.value,
                        )
                      }
                      disabled={guardando}
                      required
                    >
                      <option value="">
                        Selecciona una incapacidad
                      </option>

                      {incapacidadesDisponibles.map(
                        (incapacidad) => (
                          <option
                            key={incapacidad.id_incapacidad}
                            value={incapacidad.numero_radicado}
                          >
                            {incapacidad.numero_radicado}
                            {" — "}
                            {incapacidad.fecha_inicio}
                            {" a "}
                            {incapacidad.fecha_fin}
                          </option>
                        ),
                      )}
                    </select>

                    {incapacidadesDisponibles.length === 0 && (
                      <span className="apelaciones-help">
                        No tienes incapacidades rechazadas disponibles para apelar.
                      </span>
                    )}
                  </div>

                  <div className="apelaciones-form-group">
                    <label htmlFor="motivo-apelacion">
                      Motivo de la apelación
                    </label>

                    <textarea
                      id="motivo-apelacion"
                      value={formulario.motivo}
                      onChange={(evento) =>
                        actualizarCampo(
                          "motivo",
                          evento.target.value,
                        )
                      }
                      disabled={guardando}
                      placeholder="Explica por qué solicitas que se revise nuevamente tu incapacidad..."
                      required
                    />
                  </div>

                  <div className="apelaciones-form-group">
                    <label htmlFor="archivo-apelacion">
                      Documento de soporte (opcional)
                    </label>

                    <input
                      id="archivo-apelacion"
                      type="file"
                      onChange={(evento) =>
                        actualizarCampo(
                          "archivo",
                          evento.target.files?.[0] ?? null,
                        )
                      }
                      disabled={guardando}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="apelaciones-form-group">
                    <label htmlFor="estado-apelacion">
                      Decisión
                    </label>

                    <select
                      id="estado-apelacion"
                      value={formulario.estado}
                      onChange={(evento) =>
                        actualizarCampo(
                          "estado",
                          evento.target.value,
                        )
                      }
                      disabled={guardando}
                    >
                      <option value="aprobada">
                        Aprobar apelación
                      </option>

                      <option value="rechazada">
                        Rechazar apelación
                      </option>
                    </select>
                  </div>

                  <div className="apelaciones-form-group">
                    <label htmlFor="respuesta-apelacion">
                      Respuesta al estudiante
                    </label>

                    <textarea
                      id="respuesta-apelacion"
                      value={formulario.respuesta}
                      onChange={(evento) =>
                        actualizarCampo(
                          "respuesta",
                          evento.target.value,
                        )
                      }
                      disabled={guardando}
                      placeholder="Explica la decisión tomada..."
                      required
                    />
                  </div>

                  <p className="apelaciones-help">
                    Si apruebas la apelación, el sistema también aprobará la incapacidad y gestionará el acceso académico según las fechas registradas.
                  </p>
                </>
              )}

              <div className="apelaciones-form-actions">
                <button
                  type="button"
                  className="apelaciones-button secondary"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="apelaciones-button primary"
                  disabled={
                    guardando ||
                    (!apelacionEditando &&
                      incapacidadesDisponibles.length === 0)
                  }
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
