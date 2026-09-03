import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerHistorial,
  type HistorialIncapacidad,
} from "../services/historial";

export default function Historial() {
  const [historial, setHistorial] = useState<
    HistorialIncapacidad[]
  >([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Carga el historial desde el backend
  async function cargarHistorial() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerHistorial();

      setHistorial(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el historial.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarHistorial();
  }, []);

  // Formatea las fechas para mostrar al usuario
  function formatearFecha(fecha: string) {
    if (!fecha) {
      return "Sin fecha";
    }

    const valor = fecha.includes("T")
      ? fecha
      : `${fecha}T00:00:00`;

    const fechaFormateada = new Date(valor);

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
  }

  // Formatea fecha y hora del cambio
  function formatearFechaHora(fecha: string) {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaFormateada = new Date(fecha);

    if (Number.isNaN(fechaFormateada.getTime())) {
      return fecha;
    }

    return fechaFormateada.toLocaleString(
      "es-CO",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    );
  }

  // Filtra el historial según la búsqueda
  const historialFiltrado = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return historial;
    }

    return historial.filter((item) => {
      return (
        String(item.id_historial)
          .includes(texto) ||
        String(item.id_incapacidad)
          .includes(texto) ||
        String(item.id_usuario_cambio)
          .includes(texto) ||
        item.motivo_cambio
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [historial, busqueda]);

  // Calcula estadísticas del historial
  const totalCambios = historial.length;

  const incapacidadesModificadas = useMemo(() => {
    return new Set(
      historial.map(
        (item) => item.id_incapacidad,
      ),
    ).size;
  }, [historial]);

  const ultimoCambio = historial.length
    ? [...historial].sort(
        (a, b) =>
          new Date(b.fecha_cambio).getTime() -
          new Date(a.fecha_cambio).getTime(),
      )[0]
    : null;

  return (
    <div>
      <style>
        {`
          .historial-container {
            width: 100%;
          }

          .historial-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }

          .historial-title h1 {
            margin: 0;
            color: #172033;
            font-size: 28px;
          }

          .historial-title p {
            margin: 8px 0 0;
            color: #667085;
            line-height: 1.5;
          }

          .historial-refresh {
            border: 1px solid #d9deea;
            background: #ffffff;
            color: #344054;
            padding: 10px 14px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          .historial-refresh:hover {
            background: #f8f9fc;
          }

          .historial-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .historial-stat {
            background: #ffffff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .historial-stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: #eef2ff;
            color: #4f46e5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
          }

          .historial-stat span {
            display: block;
            color: #667085;
            font-size: 13px;
          }

          .historial-stat strong {
            display: block;
            margin-top: 4px;
            color: #172033;
            font-size: 21px;
          }

          .historial-toolbar {
            background: #ffffff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 16px;
          }

          .historial-search {
            position: relative;
            max-width: 520px;
          }

          .historial-search svg {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .historial-search input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d9deea;
            border-radius: 9px;
            padding: 11px 12px 11px 40px;
            outline: none;
            font-size: 14px;
          }

          .historial-search input:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px #eef2ff;
          }

          .historial-error {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            color: #b42318;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 16px;
          }

          .historial-loading,
          .historial-empty {
            background: #ffffff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            padding: 40px 20px;
            text-align: center;
            color: #667085;
          }

          .historial-table-wrapper {
            background: #ffffff;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            overflow-x: auto;
          }

          .historial-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 950px;
          }

          .historial-table th {
            background: #f8f9fc;
            color: #475467;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            text-align: left;
            padding: 14px;
            border-bottom: 1px solid #e8ecf1;
            white-space: nowrap;
          }

          .historial-table td {
            padding: 15px 14px;
            color: #344054;
            font-size: 14px;
            border-bottom: 1px solid #eef1f4;
            vertical-align: top;
          }

          .historial-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .historial-table tbody tr:hover {
            background: #fafbff;
          }

          .historial-id {
            font-weight: 700;
            color: #3949ab;
          }

          .historial-date {
            display: flex;
            align-items: center;
            gap: 7px;
            white-space: nowrap;
          }

          .historial-date svg {
            color: #667085;
            flex-shrink: 0;
          }

          .historial-change {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .historial-change-line {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
          }

          .historial-old {
            color: #667085;
          }

          .historial-new {
            color: #344054;
            font-weight: 700;
          }

          .historial-arrow {
            color: #98a2b3;
          }

          .historial-reason {
            max-width: 260px;
            line-height: 1.45;
          }

          .historial-user {
            display: inline-flex;
            align-items: center;
            padding: 5px 9px;
            border-radius: 999px;
            background: #f2f4f7;
            color: #475467;
            font-size: 12px;
            font-weight: 600;
          }

          @media (max-width: 900px) {
            .historial-stats {
              grid-template-columns: 1fr;
            }

            .historial-header {
              flex-direction: column;
            }
          }

          @media (max-width: 600px) {
            .historial-title h1 {
              font-size: 23px;
            }

            .historial-refresh {
              width: 100%;
              justify-content: center;
            }
          }
        `}
      </style>

      <div className="historial-container">
        <div className="historial-header">
          <div className="historial-title">
            <h1>Historial de incapacidades</h1>

            <p>
              Consulta los cambios realizados sobre las
              incapacidades registradas en Aprenzy.
            </p>
          </div>

          <button
            type="button"
            className="historial-refresh"
            onClick={() => void cargarHistorial()}
            disabled={cargando}
          >
            <FiRefreshCw />
            Actualizar
          </button>
        </div>

        <div className="historial-stats">
          <div className="historial-stat">
            <div className="historial-stat-icon">
              <FiFileText />
            </div>

            <div>
              <span>Cambios registrados</span>
              <strong>{totalCambios}</strong>
            </div>
          </div>

          <div className="historial-stat">
            <div className="historial-stat-icon">
              <FiCalendar />
            </div>

            <div>
              <span>Incapacidades modificadas</span>
              <strong>
                {incapacidadesModificadas}
              </strong>
            </div>
          </div>

          <div className="historial-stat">
            <div className="historial-stat-icon">
              <FiClock />
            </div>

            <div>
              <span>Último cambio</span>
              <strong>
                {ultimoCambio
                  ? formatearFecha(
                      ultimoCambio.fecha_cambio,
                    )
                  : "--"}
              </strong>
            </div>
          </div>
        </div>

        <div className="historial-toolbar">
          <div className="historial-search">
            <FiSearch />

            <input
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por incapacidad, usuario o motivo..."
            />
          </div>
        </div>

        {error && (
          <div className="historial-error">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="historial-loading">
            Cargando historial...
          </div>
        ) : historialFiltrado.length === 0 ? (
          <div className="historial-empty">
            {busqueda
              ? "No se encontraron registros con esa búsqueda."
              : "No hay cambios registrados en el historial."}
          </div>
        ) : (
          <div className="historial-table-wrapper">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Historial</th>
                  <th>Incapacidad</th>
                  <th>Fechas anteriores</th>
                  <th>Fechas nuevas</th>
                  <th>Motivo del cambio</th>
                  <th>Fecha del cambio</th>
                  <th>Usuario</th>
                </tr>
              </thead>

              <tbody>
                {historialFiltrado.map((item) => (
                  <tr key={item.id_historial}>
                    <td>
                      <span className="historial-id">
                        #{item.id_historial}
                      </span>
                    </td>

                    <td>
                      <span className="historial-id">
                        #{item.id_incapacidad}
                      </span>
                    </td>

                    <td>
                      <div className="historial-change">
                        <div className="historial-date">
                          <FiCalendar />
                          {formatearFecha(
                            item.fecha_anterior_inicio,
                          )}
                        </div>

                        <div className="historial-date">
                          <FiCalendar />
                          {formatearFecha(
                            item.fecha_anterior_fin,
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="historial-change">
                        <div className="historial-date">
                          <FiCalendar />
                          {formatearFecha(
                            item.fecha_nueva_inicio,
                          )}
                        </div>

                        <div className="historial-date">
                          <FiCalendar />
                          {formatearFecha(
                            item.fecha_nueva_fin,
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="historial-reason">
                        {item.motivo_cambio}
                      </div>
                    </td>

                    <td>
                      <div className="historial-date">
                        <FiClock />
                        {formatearFechaHora(
                          item.fecha_cambio,
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="historial-user">
                        Usuario #{item.id_usuario_cambio}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}