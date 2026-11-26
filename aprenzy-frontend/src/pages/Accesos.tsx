
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  obtenerAccesos,
  type AccesoAcademico,
  type EstadoAcceso,
} from "../services/acceso";

import {
  obtenerSolicitudesEstudiantes,
  actualizarAprobacionEstudiante,
  type SolicitudEstudiante,
} from "../services/solicitudesEstudiantes";

// Obtiene el texto visual del estado
function obtenerTextoEstado(
  estado: EstadoAcceso,
): string {
  if (estado === "activo") {
    return "Activo";
  }

  if (estado === "suspendido") {
    return "Suspendido";
  }

  return "Finalizado";
}

// Obtiene la clase visual del estado
function obtenerClaseEstado(
  estado: EstadoAcceso,
): string {
  if (estado === "activo") {
    return "estado-activo";
  }

  if (estado === "suspendido") {
    return "estado-suspendido";
  }

  return "estado-finalizado";
}

// Obtiene el icono correspondiente al estado
function obtenerIconoEstado(
  estado: EstadoAcceso,
) {
  if (estado === "activo") {
    return <FiCheckCircle />;
  }

  if (estado === "suspendido") {
    return <FiClock />;
  }

  return <FiXCircle />;
}

// Formatea una fecha para mostrarla
/* function formatearFecha(
  fecha: string | undefined,
): string {
  if (!fecha) {
    return "No disponible";
  }

  const fechaFormateada = new Date(
    `${fecha}T00:00:00`,
  );

  if (Number.isNaN(fechaFormateada.getTime())) {
    return fecha;
  }

  return fechaFormateada.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
} */

type SeccionAccesos =
  | "solicitudes"
  | "academicos";

export default function Accesos() {
  // Obtiene el usuario autenticado
  const { usuario } = useAuth();

  // Guarda la lista de accesos
  const [accesos, setAccesos] = useState<
    AccesoAcademico[]
  >([]);

  // Guarda las solicitudes de estudiantes
  const [solicitudes, setSolicitudes] = useState<
    SolicitudEstudiante[]
  >([]);

  // Controla la carga general
  const [cargando, setCargando] = useState(true);

  // Controla la carga de solicitudes
  const [cargandoSolicitudes, setCargandoSolicitudes] =
    useState(false);

  // Guarda errores
  const [error, setError] = useState("");

  // Guarda errores de solicitudes
  const [errorSolicitudes, setErrorSolicitudes] =
    useState("");

  // Guarda mensajes exitosos
  const [mensaje, setMensaje] = useState("");

  // Guarda el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Controla la solicitud que se está procesando
  const [procesando, setProcesando] = useState<
    number | null
  >(null);

  // Controla la sección activa
  const [seccion, setSeccion] =
    useState<SeccionAccesos>("solicitudes");

  // Determina si el usuario es coordinador
  const esCoordinador =
    usuario?.tipo_de_usuario === "coordinador";

  // Determina si el usuario es estudiante
  const esEstudiante =
    usuario?.tipo_de_usuario === "estudiante";

  // Carga los accesos académicos
  async function cargarAccesos() {
    setError("");
    setCargando(true);

    try {
      const datos = await obtenerAccesos();
      setAccesos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los accesos académicos.",
      );
    } finally {
      setCargando(false);
    }
  }

  // Carga las solicitudes de cuentas de estudiantes
  async function cargarSolicitudes() {
    setErrorSolicitudes("");
    setCargandoSolicitudes(true);

    try {
      const datos =
        await obtenerSolicitudesEstudiantes();

      setSolicitudes(datos);
    } catch (err) {
      setErrorSolicitudes(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las solicitudes de estudiantes.",
      );
    } finally {
      setCargandoSolicitudes(false);
    }
  }

  // Actualiza la información de la pantalla
  async function actualizarInformacion() {
    setMensaje("");
    setError("");

    if (esCoordinador) {
      await Promise.all([
        cargarAccesos(),
        cargarSolicitudes(),
      ]);

      return;
    }

    if (esEstudiante) {
      await cargarAccesos();
    }
  }

  // Aprueba o rechaza una cuenta de estudiante
  async function procesarSolicitud(
    solicitud: SolicitudEstudiante,
    estado: "aprobada" | "rechazada",
  ) {
    setErrorSolicitudes("");
    setMensaje("");
    setProcesando(solicitud.id_usuario);

    try {
      await actualizarAprobacionEstudiante(
        solicitud.id_usuario,
        estado,
      );

      setSolicitudes((actuales) =>
        actuales.map((item) =>
          item.id_usuario === solicitud.id_usuario
            ? {
                ...item,
                estado_aprobacion: estado,
              }
            : item,
        ),
      );

      setMensaje(
        estado === "aprobada"
          ? "La cuenta del estudiante fue aprobada correctamente."
          : "La cuenta del estudiante fue rechazada correctamente.",
      );
    } catch (err) {
      setErrorSolicitudes(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar la solicitud.",
      );
    } finally {
      setProcesando(null);
    }
  }

  // Carga automáticamente la información según el rol
  useEffect(() => {
    if (esCoordinador) {
      void Promise.all([
        cargarAccesos(),
        cargarSolicitudes(),
      ]);

      return;
    }

    if (esEstudiante) {
      void cargarAccesos();
      return;
    }

    setError(
      "No tienes permisos para consultar esta sección.",
    );
    setCargando(false);
  }, [esCoordinador, esEstudiante]);

  // Filtra las solicitudes de estudiantes
  const solicitudesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return solicitudes;
    }

    return solicitudes.filter((solicitud) => {
      const nombre = [
        solicitud.nombres_compl,
        solicitud.apellidos_compl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        nombre.includes(texto) ||
        solicitud.documento
          .toLowerCase()
          .includes(texto) ||
        solicitud.correo
          .toLowerCase()
          .includes(texto) ||
        solicitud.estado_aprobacion.includes(
          texto,
        )
      );
    });
  }, [solicitudes, busqueda]);

  // Filtra los accesos académicos
  const accesosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return accesos;
    }

    return accesos.filter((acceso) =>
      obtenerTextoEstado(acceso.estado)
        .toLowerCase()
        .includes(texto),
    );
  }, [accesos, busqueda]);

  // Calcula estadísticas
  const cantidadActivos = accesos.filter(
    (acceso) => acceso.estado === "activo",
  ).length;

  const cantidadSuspendidos = accesos.filter(
    (acceso) => acceso.estado === "suspendido",
  ).length;

  const cantidadFinalizados = accesos.filter(
    (acceso) => acceso.estado === "finalizado",
  ).length;

  // Calcula solicitudes pendientes
  const cantidadPendientes = solicitudes.filter(
    (solicitud) =>
      solicitud.estado_aprobacion === "pendiente",
  ).length;

  // Calcula solicitudes aprobadas
  const cantidadAprobadas = solicitudes.filter(
    (solicitud) =>
      solicitud.estado_aprobacion === "aprobada",
  ).length;

  // Calcula solicitudes rechazadas
  const cantidadRechazadas = solicitudes.filter(
    (solicitud) =>
      solicitud.estado_aprobacion === "rechazada",
  ).length;

  return (
    <div className="accesos-page">
      <style>
        {`
          .accesos-page {
            width: 100%;
          }

          .accesos-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .accesos-header h1 {
            margin: 0 0 7px;
            color: #fff;
            font-size: 28px;
          }

          .accesos-header p {
            margin: 0;
            color: #fff;
            line-height: 1.5;
          }

          .accesos-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .accesos-button {
            border: 0;
            border-radius: 9px;
            padding: 11px 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 700;
          }

          .accesos-button-primary {
            background: #4f46e5;
            color: #fff;
          }

          .accesos-button-secondary {
            background: #eef2ff;
            color: #3949ab;
          }

          .accesos-button-success {
            background: #ecfdf3;
            color: #027a48;
          }

          .accesos-button-danger {
            background: #fff1f2;
            color: #b42318;
          }

          .accesos-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .accesos-alert {
            padding: 13px 15px;
            border-radius: 10px;
            margin-bottom: 18px;
            font-size: 14px;
          }

          .accesos-alert-error {
            background: #fff1f2;
            color: #b42318;
            border: 1px solid #fecdd3;
          }

          .accesos-alert-success {
            background: #ecfdf3;
            color: #027a48;
            border: 1px solid #abefc6;
          }

          .accesos-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 15px;
            margin-bottom: 22px;
          }

          .accesos-stat {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .accesos-stat-icon {
            width: 44px;
            height: 44px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 21px;
          }

          .accesos-stat span {
            display: block;
            color: #667085;
            font-size: 13px;
          }

          .accesos-stat strong {
            display: block;
            margin-top: 3px;
            color: #172033;
            font-size: 23px;
          }

          .accesos-card {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            overflow: hidden;
          }

          .accesos-card-header {
            padding: 18px 20px;
            border-bottom: 1px solid #eef1f4;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
          }

          .accesos-card-header h2 {
            margin: 0;
            color: #172033;
            font-size: 18px;
          }

          .accesos-search {
            position: relative;
            min-width: 240px;
          }

          .accesos-search svg {
            position: absolute;
            left: 11px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .accesos-search input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 10px 12px 10px 34px;
            outline: none;
          }

          .accesos-search input:focus {
            border-color: #4f46e5;
          }

          .accesos-table-wrapper {
            overflow-x: auto;
          }

          .accesos-table {
            width: 100%;
            border-collapse: collapse;
          }

          .accesos-table th,
          .accesos-table td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #eef1f4;
          }

          .accesos-table th {
            color: #667085;
            background: #fafbfc;
            font-size: 12px;
            text-transform: uppercase;
          }

          .accesos-table td {
            color: #344054;
            font-size: 14px;
          }

          .accesos-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }

          .estado-activo {
            background: #ecfdf3;
            color: #027a48;
          }

          .estado-suspendido {
            background: #fffaeb;
            color: #b54708;
          }

          .estado-finalizado {
            background: #f2f4f7;
            color: #475467;
          }

          .estado-pendiente {
            background: #fffaeb;
            color: #b54708;
          }

          .estado-aprobada {
            background: #ecfdf3;
            color: #027a48;
          }

          .estado-rechazada {
            background: #fff1f2;
            color: #b42318;
          }

          .accesos-empty {
            padding: 40px 20px;
            text-align: center;
            color: #667085;
          }

          .accesos-empty svg {
            font-size: 34px;
            margin-bottom: 10px;
            color: #98a2b3;
          }

          .accesos-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
          }

          .accesos-tab {
            border: 1px solid #e0e5ec;
            border-radius: 9px;
            background: #fff;
            color: #475467;
            padding: 11px 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 700;
          }

          .accesos-tab.active {
            background: #4f46e5;
            color: #fff;
            border-color: #4f46e5;
          }

          .accesos-tab-count {
            padding: 2px 7px;
            border-radius: 20px;
            background: rgba(79, 70, 229, 0.12);
            color: #4f46e5;
            font-size: 12px;
          }

          .accesos-tab.active .accesos-tab-count {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
          }

          .solicitudes-lista {
            display: flex;
            flex-direction: column;
          }

          .solicitud-item {
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            border-bottom: 1px solid #eef1f4;
          }

          .solicitud-item:last-child {
            border-bottom: 0;
          }

          .solicitud-informacion {
            display: flex;
            align-items: flex-start;
            gap: 13px;
            min-width: 0;
          }

          .solicitud-icono {
            width: 43px;
            height: 43px;
            flex-shrink: 0;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 20px;
          }

          .solicitud-datos {
            min-width: 0;
          }

          .solicitud-datos h3 {
            margin: 0 0 5px;
            color: #172033;
            font-size: 15px;
          }

          .solicitud-datos p {
            margin: 3px 0;
            color: #667085;
            font-size: 13px;
            overflow-wrap: anywhere;
          }

          .solicitud-acciones {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }

          .solicitud-estado {
            margin-top: 8px;
          }

          .acceso-estudiante {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }

          .acceso-detalle {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 24px;
          }

          .acceso-detalle-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 22px;
          }

          .acceso-detalle-top h2 {
            margin: 0 0 6px;
            color: #172033;
          }

          .acceso-detalle-top p {
            margin: 0;
            color: #667085;
          }

          .acceso-detalle-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 13px;
            border-radius: 999px;
            font-weight: 700;
          }

          .acceso-notice {
            margin-top: 18px;
            padding: 15px;
            border-radius: 10px;
            background: #eef2ff;
            color: #3730a3;
            line-height: 1.5;
            font-size: 14px;
          }

          @media (max-width: 850px) {
            .accesos-stats {
              grid-template-columns: 1fr;
            }

            .accesos-header,
            .accesos-card-header {
              flex-direction: column;
              align-items: stretch;
            }

            .accesos-search {
              min-width: 0;
            }

            .solicitud-item {
              flex-direction: column;
              align-items: stretch;
            }

            .solicitud-acciones {
              justify-content: flex-start;
            }
          }

          @media (max-width: 600px) {
            .accesos-header h1 {
              font-size: 24px;
            }

            .accesos-tabs {
              flex-direction: column;
            }

            .accesos-tab {
              justify-content: center;
            }

            .acceso-detalle-top {
              flex-direction: column;
              align-items: flex-start;
            }

            .accesos-header-actions {
              width: 100%;
            }

            .accesos-header-actions button {
              flex: 1;
              justify-content: center;
            }
          }
        `}
      </style>

      <div className="accesos-header">
        <div>
          <h1>
            {esCoordinador
              ? "Accesos y solicitudes"
              : "Mis accesos académicos"}
          </h1>

          <p>
            {esCoordinador
              ? "Administra las solicitudes de cuentas y consulta los accesos académicos de tu institución."
              : "Consulta el estado de tus accesos académicos asociados a incapacidades."}
          </p>
        </div>

        <div className="accesos-header-actions">
          <button
            type="button"
            className="accesos-button accesos-button-secondary"
            onClick={() =>
              void actualizarInformacion()
            }
            disabled={
              cargando ||
              cargandoSolicitudes
            }
          >
            <FiRefreshCw />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="accesos-alert accesos-alert-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="accesos-alert accesos-alert-success">
          {mensaje}
        </div>
      )}

      {!esCoordinador && !esEstudiante && (
        <div className="accesos-card">
          <div className="accesos-empty">
            <FiShield />
            <div>
              No tienes permisos para consultar esta sección.
            </div>
          </div>
        </div>
      )}

      {esCoordinador && (
        <>
          <div className="accesos-tabs">
            <button
              type="button"
              className={`accesos-tab ${
                seccion === "solicitudes"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSeccion("solicitudes");
                setBusqueda("");
                setErrorSolicitudes("");
              }}
            >
              <FiUser />
              Solicitudes de cuentas

              <span className="accesos-tab-count">
                {cantidadPendientes}
              </span>
            </button>

            <button
              type="button"
              className={`accesos-tab ${
                seccion === "academicos"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSeccion("academicos");
                setBusqueda("");
                setError("");
              }}
            >
              <FiShield />
              Accesos académicos

              <span className="accesos-tab-count">
                {accesos.length}
              </span>
            </button>
          </div>

          {seccion === "solicitudes" && (
            <>
              <div className="accesos-stats">
                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiClock />
                  </div>

                  <div>
                    <span>Pendientes</span>
                    <strong>
                      {cantidadPendientes}
                    </strong>
                  </div>
                </div>

                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiCheckCircle />
                  </div>

                  <div>
                    <span>Aprobadas</span>
                    <strong>
                      {cantidadAprobadas}
                    </strong>
                  </div>
                </div>

                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiXCircle />
                  </div>

                  <div>
                    <span>Rechazadas</span>
                    <strong>
                      {cantidadRechazadas}
                    </strong>
                  </div>
                </div>
              </div>

              {errorSolicitudes && (
                <div className="accesos-alert accesos-alert-error">
                  {errorSolicitudes}
                </div>
              )}

              <div className="accesos-card">
                <div className="accesos-card-header">
                  <h2>
                    Solicitudes de registro de estudiantes
                  </h2>

                  <div className="accesos-search">
                    <FiSearch />

                    <input
                      type="text"
                      value={busqueda}
                      onChange={(event) =>
                        setBusqueda(
                          event.target.value,
                        )
                      }
                      placeholder="Buscar estudiante..."
                    />
                  </div>
                </div>

                {cargandoSolicitudes ? (
                  <div className="accesos-empty">
                    <FiRefreshCw />
                    <div>
                      Cargando solicitudes...
                    </div>
                  </div>
                ) : solicitudesFiltradas.length ===
                  0 ? (
                  <div className="accesos-empty">
                    <FiFileText />
                    <div>
                      No hay solicitudes de estudiantes para mostrar.
                    </div>
                  </div>
                ) : (
                  <div className="solicitudes-lista">
                    {solicitudesFiltradas.map(
                      (solicitud) => {
                        const nombre = [
                          solicitud.nombres_compl,
                          solicitud.apellidos_compl,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        const pendiente =
                          solicitud.estado_aprobacion ===
                          "pendiente";

                        return (
                          <div
                            className="solicitud-item"
                            key={solicitud.id_usuario}
                          >
                            <div className="solicitud-informacion">
                              <div className="solicitud-icono">
                                <FiUser />
                              </div>

                              <div className="solicitud-datos">
                                <h3>
                                  {nombre ||
                                    "Estudiante"}
                                </h3>

                                <p>
                                  Documento:{" "}
                                  {solicitud.documento}
                                </p>

                                <p>
                                  Correo:{" "}
                                  {solicitud.correo}
                                </p>

                                {solicitud.telefono && (
                                  <p>
                                    Teléfono:{" "}
                                    {solicitud.telefono}
                                  </p>
                                )}

                                <div className="solicitud-estado">
                                  <span
                                    className={`accesos-status estado-${solicitud.estado_aprobacion}`}
                                  >
                                    {solicitud.estado_aprobacion ===
                                    "pendiente" ? (
                                      <FiClock />
                                    ) : solicitud.estado_aprobacion ===
                                      "aprobada" ? (
                                      <FiCheckCircle />
                                    ) : (
                                      <FiXCircle />
                                    )}

                                    {solicitud.estado_aprobacion ===
                                    "pendiente"
                                      ? "Pendiente"
                                      : solicitud.estado_aprobacion ===
                                        "aprobada"
                                      ? "Aprobada"
                                      : "Rechazada"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {pendiente && (
                              <div className="solicitud-acciones">
                                <button
                                  type="button"
                                  className="accesos-button accesos-button-success"
                                  onClick={() =>
                                    void procesarSolicitud(
                                      solicitud,
                                      "aprobada",
                                    )
                                  }
                                  disabled={
                                    procesando !== null
                                  }
                                >
                                  <FiCheckCircle />

                                  {procesando ===
                                  solicitud.id_usuario
                                    ? "Procesando..."
                                    : "Aprobar"}
                                </button>

                                <button
                                  type="button"
                                  className="accesos-button accesos-button-danger"
                                  onClick={() =>
                                    void procesarSolicitud(
                                      solicitud,
                                      "rechazada",
                                    )
                                  }
                                  disabled={
                                    procesando !== null
                                  }
                                >
                                  <FiXCircle />
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {seccion === "academicos" && (
            <>
              <div className="accesos-stats">
                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiCheckCircle />
                  </div>

                  <div>
                    <span>Activos</span>
                    <strong>
                      {cantidadActivos}
                    </strong>
                  </div>
                </div>

                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiClock />
                  </div>

                  <div>
                    <span>Suspendidos</span>
                    <strong>
                      {cantidadSuspendidos}
                    </strong>
                  </div>
                </div>

                <div className="accesos-stat">
                  <div className="accesos-stat-icon">
                    <FiXCircle />
                  </div>

                  <div>
                    <span>Finalizados</span>
                    <strong>
                      {cantidadFinalizados}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="accesos-card">
                <div className="accesos-card-header">
                  <h2>
                    Accesos académicos por incapacidad
                  </h2>

                  <div className="accesos-search">
                    <FiSearch />

                    <input
                      type="text"
                      value={busqueda}
                      onChange={(event) =>
                        setBusqueda(
                          event.target.value,
                        )
                      }
                      placeholder="Buscar por estado..."
                    />
                  </div>
                </div>

                {cargando ? (
                  <div className="accesos-empty">
                    <FiRefreshCw />
                    <div>
                      Cargando accesos...
                    </div>
                  </div>
                ) : accesosFiltrados.length ===
                  0 ? (
                  <div className="accesos-empty">
                    <FiFileText />
                    <div>
                      No hay accesos académicos registrados.
                    </div>
                  </div>
                ) : (
                  <div className="accesos-table-wrapper">
                    <table className="accesos-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>

                      <tbody>
                        {accesosFiltrados.map(
                          (acceso) => (
                            <tr
                              key={acceso.id_acceso}
                            >
                              <td>
                                Acceso académico por incapacidad
                              </td>

                              <td>
                                <span
                                  className={`accesos-status ${obtenerClaseEstado(
                                    acceso.estado,
                                  )}`}
                                >
                                  {obtenerIconoEstado(
                                    acceso.estado,
                                  )}

                                  {obtenerTextoEstado(
                                    acceso.estado,
                                  )}
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {esEstudiante && (
        <div className="acceso-estudiante">
          <div className="accesos-stats">
            <div className="accesos-stat">
              <div className="accesos-stat-icon">
                <FiCheckCircle />
              </div>

              <div>
                <span>Activos</span>
                <strong>
                  {cantidadActivos}
                </strong>
              </div>
            </div>

            <div className="accesos-stat">
              <div className="accesos-stat-icon">
                <FiClock />
              </div>

              <div>
                <span>Suspendidos</span>
                <strong>
                  {cantidadSuspendidos}
                </strong>
              </div>
            </div>

            <div className="accesos-stat">
              <div className="accesos-stat-icon">
                <FiXCircle />
              </div>

              <div>
                <span>Finalizados</span>
                <strong>
                  {cantidadFinalizados}
                </strong>
              </div>
            </div>
          </div>

          <div className="accesos-card">
            <div className="accesos-card-header">
              <h2>Mis accesos académicos</h2>
            </div>

            {cargando ? (
              <div className="accesos-empty">
                <FiRefreshCw />
                <div>
                  Cargando tus accesos...
                </div>
              </div>
            ) : accesos.length === 0 ? (
              <div className="accesos-empty">
                <FiShield />
                <div>
                  No tienes accesos académicos registrados.
                </div>
              </div>
            ) : (
              <div className="solicitudes-lista">
                {accesos.map((acceso) => (
                  <div
                    className="solicitud-item"
                    key={acceso.id_acceso}
                  >
                    <div className="solicitud-informacion">
                      <div className="solicitud-icono">
                        <FiShield />
                      </div>

                      <div className="solicitud-datos">
                        <h3>
                          Acceso académico por incapacidad
                        </h3>

                        <p>
                          Estado de tu acceso académico
                        </p>

                        <div className="solicitud-estado">
                          <span
                            className={`accesos-status ${obtenerClaseEstado(
                              acceso.estado,
                            )}`}
                          >
                            {obtenerIconoEstado(
                              acceso.estado,
                            )}

                            {obtenerTextoEstado(
                              acceso.estado,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="solicitud-acciones">
                      <span className="acceso-notice">
                        {acceso.estado === "activo" &&
                          "Tu acceso académico se encuentra activo."}

                        {acceso.estado === "suspendido" &&
                          "Tu acceso académico se encuentra suspendido temporalmente."}

                        {acceso.estado === "finalizado" &&
                          "Tu acceso académico ha finalizado."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
