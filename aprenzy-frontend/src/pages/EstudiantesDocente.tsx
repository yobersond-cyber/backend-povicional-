import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

import {
  obtenerEstudiantes,
  type Estudiante,
} from "../services/usuario";

export default function EstudiantesDocente() {
  const [estudiantes, setEstudiantes] = useState<
    Estudiante[]
  >([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarEstudiantes() {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerEstudiantes();
      setEstudiantes(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los estudiantes.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarEstudiantes();
  }, []);

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return estudiantes;
    }

    return estudiantes.filter((estudiante) => {
      const datos = [
        estudiante.nombres_compl,
        estudiante.apellidos_compl,
        estudiante.codigo_usuario,
        estudiante.documento,
        estudiante.correo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return datos.includes(texto);
    });
  }, [estudiantes, busqueda]);

  return (
    <div className="edoc-page">
      <style>{`
        .edoc-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          color: #1e293b;
        }

        .edoc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .edoc-kicker {
          color: #4f46e5;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .edoc-header h1 {
          color: #0f172a;
          font-size: clamp(24px, 3vw, 32px);
          margin: 8px 0;
        }

        .edoc-header p {
          max-width: 620px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .edoc-total {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .edoc-total-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 22px;
        }

        .edoc-total strong {
          display: block;
          color: #0f172a;
          font-size: 24px;
        }

        .edoc-total span {
          color: #64748b;
          font-size: 12px;
        }

        .edoc-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .edoc-search {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 220px;
          max-width: 520px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: white;
          color: #64748b;
        }

        .edoc-search input {
          width: 100%;
          min-width: 0;
          padding: 12px 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
        }

        .edoc-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #fff;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .edoc-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .edoc-panel {
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #fff;
        }

        .edoc-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .edoc-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
          font-size: 13px;
        }

        .edoc-table th {
          padding: 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          text-align: left;
          font-weight: 700;
        }

        .edoc-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .edoc-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .edoc-name {
          color: #0f172a;
          font-weight: 700;
        }

        .edoc-muted {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .edoc-message {
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .edoc-error {
          margin-bottom: 16px;
          padding: 13px 15px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        @media (max-width: 600px) {
          .edoc-header {
            flex-direction: column;
          }

          .edoc-total {
            width: 100%;
          }

          .edoc-search {
            max-width: none;
            width: 100%;
          }

          .edoc-button {
            width: 100%;
          }
        }
      `}</style>

      <header className="edoc-header">
        <div>
          <span className="edoc-kicker">
            Área docente
          </span>

          <h1>Mis estudiantes</h1>

          <p>
            Consulta los estudiantes inscritos en los cursos
            donde tienes materias asignadas. La información
            está limitada por los permisos de tu cuenta.
          </p>
        </div>

        <div className="edoc-total">
          <div className="edoc-total-icon">
            <FiUsers />
          </div>

          <div>
            <strong>{estudiantes.length}</strong>
            <span>Estudiantes disponibles</span>
          </div>
        </div>
      </header>

      <section className="edoc-toolbar">
        <label className="edoc-search">
          <FiSearch />

          <input
            type="search"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
            placeholder="Buscar por nombre, documento, código o correo..."
            aria-label="Buscar estudiantes"
          />
        </label>

        <button
          type="button"
          className="edoc-button"
          onClick={() => void cargarEstudiantes()}
          disabled={cargando}
        >
          <FiRefreshCw />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </section>

      {error && (
        <div className="edoc-error" role="alert">
          <strong>No se pudieron cargar los estudiantes.</strong>
          <p>{error}</p>

          <button
            type="button"
            className="edoc-button"
            onClick={() => void cargarEstudiantes()}
            disabled={cargando}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="edoc-panel">
        {cargando ? (
          <div className="edoc-message">
            Cargando estudiantes...
          </div>
        ) : (
          <div className="edoc-table-wrap">
            <table className="edoc-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Documento</th>
                  <th>Código</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Jornada</th>
                </tr>
              </thead>

              <tbody>
                {estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id_usuario}>
                    <td>
                      <span className="edoc-name">
                        {estudiante.nombres_compl}{" "}
                        {estudiante.apellidos_compl}
                      </span>
                    </td>

                    <td>{estudiante.documento || "—"}</td>

                    <td>{estudiante.codigo_usuario || "—"}</td>

                    <td>{estudiante.correo || "—"}</td>

                    <td>{estudiante.telefono || "—"}</td>

                    <td>{estudiante.jornada || "—"}</td>
                  </tr>
                ))}

                {estudiantesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="edoc-message">
                        {estudiantes.length === 0
                          ? "No hay estudiantes asignados a tus cursos."
                          : "No se encontraron estudiantes con esa búsqueda."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}   