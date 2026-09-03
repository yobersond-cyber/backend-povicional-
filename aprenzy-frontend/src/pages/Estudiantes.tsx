import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

import {
  obtenerEstudiantes,
  type Estudiante,
} from "../services/usuario";

// Lista los estudiantes del colegio para el administrador
export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Carga los estudiantes desde FastAPI
  async function cargarEstudiantes() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerEstudiantes();

      setEstudiantes(datos);
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "No fue posible cargar los estudiantes.";

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  // Carga los datos al abrir el módulo
  useEffect(() => {
    void cargarEstudiantes();
  }, []);

  // Filtra los estudiantes
  const estudiantesFiltrados = estudiantes.filter(
    (estudiante) => {
      const texto = `
        ${estudiante.nombres_compl}
        ${estudiante.apellidos_compl}
        ${estudiante.codigo_usuario}
        ${estudiante.documento}
      `.toLowerCase();

      return texto.includes(
        busqueda.toLowerCase().trim(),
      );
    },
  );

  return (
    <div className="estudiantes-page">
      {/* Encabezado */}
      <section className="estudiantes-header">
        <div>
          <span className="estudiantes-kicker">
            Administración
          </span>

          <h1>Estudiantes</h1>

          <p>
            Consulta los estudiantes registrados
            en el colegio.
          </p>
        </div>

        <div className="estudiantes-total">
          <FiUsers />

          <strong>
            {estudiantes.length}
          </strong>

          <span>
            registrados
          </span>
        </div>
      </section>

      {/* Barra de búsqueda */}
      <section className="estudiantes-toolbar">
        <div className="estudiantes-search">
          <FiSearch />

          <input
            type="search"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value,
              )
            }
            placeholder="Buscar por nombre, código o documento..."
            aria-label="Buscar estudiantes"
          />
        </div>

        <button
          type="button"
          className="estudiantes-refresh"
          onClick={() =>
            void cargarEstudiantes()
          }
          disabled={cargando}
        >
          <FiRefreshCw />

          Actualizar
        </button>
      </section>

      {/* Mensaje de error */}
      {error && (
        <div
          className="estudiantes-error"
          role="alert"
        >
          <FiAlertCircle />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* Estado de carga */}
      {cargando && (
        <div className="estudiantes-state">
          Cargando estudiantes...
        </div>
      )}

      {/* Tabla */}
      {!cargando && !error && (
        <section className="estudiantes-table-card">
          <div className="estudiantes-table-wrapper">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Código</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Jornada</th>
                  <th>Incapacidades</th>
                </tr>
              </thead>

              <tbody>
                {estudiantesFiltrados.map(
                  (estudiante) => (
                    <tr
                      key={
                        estudiante.id_usuario
                      }
                    >
                      <td>
                        <div className="estudiantes-name">
                          <strong>
                            {
                              estudiante.nombres_compl
                            }{" "}
                            {
                              estudiante.apellidos_compl
                            }
                          </strong>

                          <span>
                            {
                              estudiante.telefono
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {
                          estudiante.codigo_usuario
                        }
                      </td>

                      <td>
                        {
                          estudiante.documento
                        }
                      </td>

                      <td>
                        {
                          estudiante.correo
                        }
                      </td>

                      <td>
                        {
                          estudiante.jornada ??
                          "No definida"
                        }
                      </td>

                      <td>
                        <span className="estudiantes-badge">
                          {
                            estudiante
                              .incapacidades
                              .length
                          }
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* Sin resultados */}
          {estudiantesFiltrados.length ===
            0 && (
            <div className="estudiantes-empty">
              No hay estudiantes que
              coincidan con la búsqueda.
            </div>
          )}
        </section>
      )}
    </div>
  );
}