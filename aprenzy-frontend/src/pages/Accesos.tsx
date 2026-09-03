// Importa las herramientas necesarias de React
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

// Importa los iconos de la interfaz
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";

// Importa la autenticación
import { useAuth } from "../context/AuthContext";

// Importa los servicios de acceso
import {
  crearAcceso,
  obtenerAcceso,
  obtenerAccesos,
  type AccesoAcademico,
  type EstadoAcceso,
} from "../services/acceso";

// Representa los datos del formulario
interface FormularioAcceso {
  id_usuario: string;
  id_incapacidad: string;
  estado: EstadoAcceso;
}

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

// Calcula los días restantes usando una fecha de finalización
/* function calcularDiasRestantes(
  fechaFin: string | undefined,
): number | null {
  // Si no existe fecha no se puede calcular
  if (!fechaFin) {
    return null;
  }

  // Obtiene la fecha actual
  const hoy = new Date();

  // Convierte la fecha recibida
  const fin = new Date(`${fechaFin}T23:59:59`);

  // Calcula la diferencia
  const diferencia =
    fin.getTime() - hoy.getTime();

  // Convierte milisegundos a días
  const dias = Math.ceil(
    diferencia / (1000 * 60 * 60 * 24),
  );

  return Math.max(0, dias);
}
 */
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

export default function Accesos() {
  // Obtiene el usuario autenticado
  const { usuario } = useAuth();

  // Guarda la lista de accesos
  const [accesos, setAccesos] = useState<
    AccesoAcademico[]
  >([]);

  // Guarda el acceso consultado por estudiante
  const [accesoEstudiante, setAccesoEstudiante] =
    useState<AccesoAcademico | null>(null);

  // Controla la carga
  const [cargando, setCargando] = useState(true);

  // Guarda errores
  const [error, setError] = useState("");

  // Guarda mensajes exitosos
  const [mensaje, setMensaje] = useState("");

  // Guarda el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Controla la ventana de creación
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  // Guarda el ID que introduce un estudiante
  const [idConsulta, setIdConsulta] =
    useState("");

  // Guarda los datos del formulario
  const [formulario, setFormulario] =
    useState<FormularioAcceso>({
      id_usuario: "",
      id_incapacidad: "",
      estado: "activo",
    });

  // Determina si el usuario es administrador
  const esAdministrador =
    usuario?.tipo_de_usuario ===
    "administrador";

  // Carga los accesos del administrador
  async function cargarAccesos() {
    // Limpia mensajes anteriores
    setError("");
    setMensaje("");

    // Activa la carga
    setCargando(true);

    try {
      // Consulta los accesos
      const datos = await obtenerAccesos();

      // Guarda los resultados
      setAccesos(datos);
    } catch (err) {
      // Muestra el error
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los accesos",
      );
    } finally {
      // Finaliza la carga
      setCargando(false);
    }
  }

  // Consulta un acceso específico
  async function consultarAcceso(
    event?: FormEvent,
  ) {
    // Evita recargar la página
    event?.preventDefault();

    // Limpia mensajes
    setError("");
    setMensaje("");

    // Convierte el ID a número
    const id = Number(idConsulta);

    // Valida el ID
    if (!Number.isInteger(id) || id <= 0) {
      setError(
        "Ingresa un ID de acceso válido.",
      );
      return;
    }

    // Activa la carga
    setCargando(true);

    try {
      // Consulta el acceso
      const acceso = await obtenerAcceso(id);

      // Guarda el resultado
      setAccesoEstudiante(acceso);

      // Guarda el ID para futuras consultas
      localStorage.setItem(
        "aprenzy_acceso_id",
        String(id),
      );
    } catch (err) {
      // Limpia el resultado anterior
      setAccesoEstudiante(null);

      // Muestra el error
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible consultar el acceso",
      );
    } finally {
      // Finaliza la carga
      setCargando(false);
    }
  }

  // Crea un acceso académico
  async function guardarAcceso(
    event: FormEvent,
  ) {
    // Evita recargar la página
    event.preventDefault();

    // Limpia mensajes
    setError("");
    setMensaje("");

    // Convierte los IDs
    const idUsuario = Number(
      formulario.id_usuario,
    );

    const idIncapacidad = Number(
      formulario.id_incapacidad,
    );

    // Valida los datos
    if (
      !Number.isInteger(idUsuario) ||
      idUsuario <= 0
    ) {
      setError(
        "El ID del estudiante no es válido.",
      );
      return;
    }

    if (
      !Number.isInteger(idIncapacidad) ||
      idIncapacidad <= 0
    ) {
      setError(
        "El ID de la incapacidad no es válido.",
      );
      return;
    }

    // Activa la carga
    setCargando(true);

    try {
      // Envía el nuevo acceso
      const nuevoAcceso = await crearAcceso({
        id_usuario: idUsuario,
        id_incapacidad: idIncapacidad,
        estado: formulario.estado,
      });

      // Actualiza la lista local
      setAccesos((actuales) => [
        ...actuales,
        nuevoAcceso,
      ]);

      // Guarda el ID para facilitar la consulta
      localStorage.setItem(
        "aprenzy_acceso_id",
        String(nuevoAcceso.id_acceso),
      );

      // Limpia el formulario
      setFormulario({
        id_usuario: "",
        id_incapacidad: "",
        estado: "activo",
      });

      // Cierra el formulario
      setMostrarFormulario(false);

      // Muestra confirmación
      setMensaje(
        "El acceso académico fue creado correctamente.",
      );
    } catch (err) {
      // Muestra el error
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible crear el acceso",
      );
    } finally {
      // Finaliza la carga
      setCargando(false);
    }
  }

  // Carga automáticamente la información según el rol
  useEffect(() => {
    // Administrador obtiene todos los accesos
    if (esAdministrador) {
      void cargarAccesos();
      return;
    }

    // Recupera el último ID guardado
    const idGuardado = localStorage.getItem(
      "aprenzy_acceso_id",
    );

    // Si existe, lo coloca en el formulario
    if (idGuardado) {
      setIdConsulta(idGuardado);

      // Consulta automáticamente el acceso
      const id = Number(idGuardado);

      if (Number.isInteger(id) && id > 0) {
        setCargando(true);

        obtenerAcceso(id)
          .then((acceso) => {
            setAccesoEstudiante(acceso);
          })
          .catch(() => {
            setAccesoEstudiante(null);
          })
          .finally(() => {
            setCargando(false);
          });

        return;
      }
    }

    // No hay acceso guardado
    setCargando(false);
  }, [esAdministrador]);

  // Filtra la lista de administrador
  const accesosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return accesos;
    }

    return accesos.filter((acceso) => {
      return (
        String(acceso.id_acceso).includes(
          texto,
        ) ||
        String(acceso.id_usuario).includes(
          texto,
        ) ||
        String(
          acceso.id_incapacidad,
        ).includes(texto) ||
        acceso.estado.includes(texto)
      );
    });
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

  // Obtiene el ID del acceso mostrado
  const idAccesoMostrado =
    accesoEstudiante?.id_acceso;

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
            color: #172033;
            font-size: 28px;
          }

          .accesos-header p {
            margin: 0;
            color: #667085;
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

          .accesos-search input:focus,
          .accesos-form input:focus,
          .accesos-form select:focus {
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
            white-space: nowrap;
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

          .accesos-form-card {
            margin-bottom: 22px;
            padding: 20px;
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
          }

          .accesos-form-card h2 {
            margin: 0 0 18px;
            color: #172033;
            font-size: 18px;
          }

          .accesos-form {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 15px;
          }

          .accesos-form-group {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .accesos-form-group label {
            color: #344054;
            font-size: 13px;
            font-weight: 700;
          }

          .accesos-form-group input,
          .accesos-form-group select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 11px 12px;
            outline: none;
            background: #fff;
          }

          .accesos-form-actions {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .acceso-estudiante {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }

          .acceso-consulta {
            background: #fff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 20px;
          }

          .acceso-consulta h2 {
            margin: 0 0 6px;
            color: #172033;
          }

          .acceso-consulta-description {
            margin: 0 0 18px;
            color: #667085;
          }

          .acceso-consulta-form {
            display: flex;
            gap: 10px;
            max-width: 550px;
          }

          .acceso-consulta-form input {
            flex: 1;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            padding: 11px 12px;
            outline: none;
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

          .acceso-info-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 15px;
          }

          .acceso-info-item {
            padding: 16px;
            border: 1px solid #eef1f4;
            border-radius: 11px;
          }

          .acceso-info-item span {
            display: block;
            color: #667085;
            font-size: 12px;
            margin-bottom: 5px;
          }

          .acceso-info-item strong {
            color: #172033;
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

            .accesos-form {
              grid-template-columns: 1fr;
            }

            .acceso-info-grid {
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
          }

          @media (max-width: 600px) {
            .acceso-consulta-form {
              flex-direction: column;
            }

            .accesos-header h1 {
              font-size: 24px;
            }
          }
        `}
      </style>

      <div className="accesos-header">
        <div>
          <h1>Accesos académicos</h1>

          <p>
            Consulta y administra los accesos
            académicos asociados a incapacidades.
          </p>
        </div>

        {esAdministrador && (
          <div className="accesos-header-actions">
            <button
              type="button"
              className="accesos-button accesos-button-secondary"
              onClick={() => void cargarAccesos()}
              disabled={cargando}
            >
              <FiRefreshCw />
              Actualizar
            </button>

            <button
              type="button"
              className="accesos-button accesos-button-primary"
              onClick={() =>
                setMostrarFormulario(
                  !mostrarFormulario,
                )
              }
            >
              {mostrarFormulario ? (
                <FiX />
              ) : (
                <FiPlus />
              )}

              {mostrarFormulario
                ? "Cancelar"
                : "Nuevo acceso"}
            </button>
          </div>
        )}
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

      {esAdministrador ? (
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

          {mostrarFormulario && (
            <div className="accesos-form-card">
              <h2>Crear acceso académico</h2>

              <form
                className="accesos-form"
                onSubmit={guardarAcceso}
              >
                <div className="accesos-form-group">
                  <label htmlFor="id_usuario">
                    ID del estudiante
                  </label>

                  <input
                    id="id_usuario"
                    type="number"
                    min="1"
                    value={
                      formulario.id_usuario
                    }
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        id_usuario:
                          event.target.value,
                      })
                    }
                    placeholder="Ej. 12"
                    required
                  />
                </div>

                <div className="accesos-form-group">
                  <label htmlFor="id_incapacidad">
                    ID de la incapacidad
                  </label>

                  <input
                    id="id_incapacidad"
                    type="number"
                    min="1"
                    value={
                      formulario.id_incapacidad
                    }
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        id_incapacidad:
                          event.target.value,
                      })
                    }
                    placeholder="Ej. 5"
                    required
                  />
                </div>

                <div className="accesos-form-group">
                  <label htmlFor="estado">
                    Estado inicial
                  </label>

                  <select
                    id="estado"
                    value={formulario.estado}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        estado:
                          event.target
                            .value as EstadoAcceso,
                      })
                    }
                  >
                    <option value="activo">
                      Activo
                    </option>

                    <option value="suspendido">
                      Suspendido
                    </option>

                    <option value="finalizado">
                      Finalizado
                    </option>
                  </select>
                </div>

                <div className="accesos-form-actions">
                  <button
                    type="button"
                    className="accesos-button accesos-button-secondary"
                    onClick={() =>
                      setMostrarFormulario(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="accesos-button accesos-button-primary"
                    disabled={cargando}
                  >
                    <FiPlus />
                    Crear acceso
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="accesos-card">
            <div className="accesos-card-header">
              <h2>Lista de accesos</h2>

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
                  placeholder="Buscar acceso..."
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
            ) : accesosFiltrados.length === 0 ? (
              <div className="accesos-empty">
                <FiFileText />

                <div>
                  No hay accesos académicos
                  registrados.
                </div>
              </div>
            ) : (
              <div className="accesos-table-wrapper">
                <table className="accesos-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estudiante</th>
                      <th>Incapacidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {accesosFiltrados.map(
                      (acceso) => (
                        <tr
                          key={
                            acceso.id_acceso
                          }
                        >
                          <td>
                            #{acceso.id_acceso}
                          </td>

                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems:
                                  "center",
                                gap: "7px",
                              }}
                            >
                              <FiUser />
                              {acceso.id_usuario}
                            </span>
                          </td>

                          <td>
                            #{acceso.id_incapacidad}
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
      ) : (
        <div className="acceso-estudiante">
          <div className="acceso-consulta">
            <h2>
              Consultar mi acceso
            </h2>

            <p className="acceso-consulta-description">
              Ingresa el ID de tu acceso académico
              para consultar su estado.
            </p>

            <form
              className="acceso-consulta-form"
              onSubmit={consultarAcceso}
            >
              <input
                type="number"
                min="1"
                value={idConsulta}
                onChange={(event) =>
                  setIdConsulta(
                    event.target.value,
                  )
                }
                placeholder="ID del acceso"
                required
              />

              <button
                type="submit"
                className="accesos-button accesos-button-primary"
                disabled={cargando}
              >
                <FiSearch />
                Consultar
              </button>
            </form>
          </div>

          {cargando ? (
            <div className="acceso-detalle">
              <div className="accesos-empty">
                <FiRefreshCw />
                <div>
                  Consultando acceso...
                </div>
              </div>
            </div>
          ) : accesoEstudiante ? (
            <div className="acceso-detalle">
              <div className="acceso-detalle-top">
                <div>
                  <h2>
                    Acceso #
                    {idAccesoMostrado}
                  </h2>

                  <p>
                    Información de tu acceso
                    académico temporal.
                  </p>
                </div>

                <span
                  className={`acceso-detalle-status ${obtenerClaseEstado(
                    accesoEstudiante.estado,
                  )}`}
                >
                  {obtenerIconoEstado(
                    accesoEstudiante.estado,
                  )}

                  {obtenerTextoEstado(
                    accesoEstudiante.estado,
                  )}
                </span>
              </div>

              <div className="acceso-info-grid">
                <div className="acceso-info-item">
                  <span>
                    Estudiante
                  </span>

                  <strong>
                    #{accesoEstudiante.id_usuario}
                  </strong>
                </div>

                <div className="acceso-info-item">
                  <span>
                    Incapacidad
                  </span>

                  <strong>
                    #
                    {
                      accesoEstudiante.id_incapacidad
                    }
                  </strong>
                </div>

                <div className="acceso-info-item">
                  <span>
                    Estado actual
                  </span>

                  <strong>
                    {obtenerTextoEstado(
                      accesoEstudiante.estado,
                    )}
                  </strong>
                </div>
              </div>

              <div className="acceso-notice">
                <strong>
                  Estado del acceso:
                </strong>{" "}
                {accesoEstudiante.estado ===
                  "activo" &&
                  "Tu acceso académico se encuentra activo."}

                {accesoEstudiante.estado ===
                  "suspendido" &&
                  "Tu acceso académico se encuentra suspendido."}

                {accesoEstudiante.estado ===
                  "finalizado" &&
                  "Tu acceso académico ya finalizó."}
              </div>
            </div>
          ) : (
            <div className="acceso-detalle">
              <div className="accesos-empty">
                <FiShield />

                <div>
                  No hay un acceso consultado
                  todavía.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}