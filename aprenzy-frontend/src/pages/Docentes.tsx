import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBookOpen,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import {
  obtenerDocentes,
  type Docente,
} from "../services/docente";

// Administra la consulta de docentes
export default function Docentes() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Carga los docentes
  async function cargarDocentes() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerDocentes();

      setDocentes(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los docentes.",
      );
    } finally {
      setCargando(false);
    }
  }

  // Carga los datos al abrir el módulo
  useEffect(() => {
    void cargarDocentes();
  }, []);

  // Filtra los docentes
  const docentesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return docentes;
    }

    return docentes.filter((docente) => {
      const datos = `
        ${docente.nombres_compl}
        ${docente.apellidos_compl}
        ${docente.codigo_usuario}
        ${docente.documento}
        ${docente.correo}
      `.toLowerCase();

      return datos.includes(texto);
    });
  }, [docentes, busqueda]);

  return (
    <div className="docentes-page">
      {/* Encabezado */}
      <section className="docentes-header">
        <div>
          <span className="docentes-kicker">
            Administración
          </span>

          <h1>Docentes</h1>

          <p>
            Consulta los docentes y las materias y cursos
            que tienen asignados.
          </p>
        </div>

        <div className="docentes-total">
          <FiUsers />

          <strong>{docentes.length}</strong>

          <span>docentes</span>
        </div>
      </section>

      {/* Herramientas */}
      <section className="docentes-toolbar">
        <div className="docentes-search">
          <FiSearch />

          <input
            type="search"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar docente..."
            aria-label="Buscar docente"
          />
        </div>

        <button
          type="button"
          className="docentes-refresh"
          onClick={() => void cargarDocentes()}
          disabled={cargando}
        >
          <FiRefreshCw />

          Actualizar
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="docentes-error">
          <strong>Error:</strong>

          <span>{error}</span>
        </div>
      )}

      {/* Carga */}
      {cargando && (
        <div className="docentes-state">
          Cargando docentes...
        </div>
      )}

      {/* Lista */}
      {!cargando && !error && (
        <div className="docentes-grid">
          {docentesFiltrados.map((docente) => (
            <article
              key={docente.id_usuario}
              className="docente-card"
            >
              {/* Información principal */}
              <div className="docente-card-header">
                <div className="docente-avatar">
                  <FiUser />
                </div>

                <div>
                  <h2>
                    {docente.nombres_compl}{" "}
                    {docente.apellidos_compl}
                  </h2>

                  <span>
                    Código: {docente.codigo_usuario}
                  </span>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="docente-contact">
                <div>
                  <FiMail />

                  <span>{docente.correo}</span>
                </div>

                <div>
                  <FiPhone />

                  <span>
                    {docente.telefono || "Sin teléfono"}
                  </span>
                </div>
              </div>

              {/* Materias */}
              <div className="docente-section">
                <div className="docente-section-title">
                  <FiBookOpen />

                  <strong>Materias asignadas</strong>
                </div>

                {docente.materias_asignadas.length > 0 ? (
                  <div className="docente-tags">
                    {docente.materias_asignadas.map(
                      (materia) => (
                        <span key={materia.id_materia}>
                          {materia.nombre_materia}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <p>No tiene materias asignadas.</p>
                )}
              </div>

              {/* Cursos */}
              <div className="docente-section">
                <div className="docente-section-title">
                  <FiUsers />

                  <strong>Cursos asignados</strong>
                </div>

                {docente.cursos_asignados.length > 0 ? (
                  <div className="docente-tags">
                    {docente.cursos_asignados.map(
                      (curso) => (
                        <span key={curso.id_curso}>
                          {curso.grado} -{" "}
                          {curso.numero_curso}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <p>No tiene cursos asignados.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!cargando &&
        !error &&
        docentesFiltrados.length === 0 && (
          <div className="docentes-empty">
            No se encontraron docentes.
          </div>
        )}

      <style>
        {`
          .docentes-page {
            width: 100%;
          }

          .docentes-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .docentes-kicker {
            color: #4f46e5;
            font-size: 13px;
            font-weight: 700;
          }

          .docentes-header h1 {
            margin: 5px 0 8px;
            color: #172033;
            font-size: 28px;
          }

          .docentes-header p {
            margin: 0;
            color: #667085;
          }

          .docentes-total {
            min-width: 120px;
            padding: 18px;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            background: #fff;
            text-align: center;
          }

          .docentes-total svg {
            color: #4f46e5;
            font-size: 22px;
          }

          .docentes-total strong,
          .docentes-total span {
            display: block;
          }

          .docentes-total strong {
            margin-top: 5px;
            color: #172033;
            font-size: 24px;
          }

          .docentes-total span {
            color: #667085;
            font-size: 13px;
          }

          .docentes-toolbar {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }

          .docentes-search {
            position: relative;
            flex: 1;
          }

          .docentes-search svg {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);
            color: #98a2b3;
          }

          .docentes-search input {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 14px 12px 40px;
            border: 1px solid #d9deea;
            border-radius: 9px;
            outline: none;
          }

          .docentes-refresh {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            border: 1px solid #d9deea;
            border-radius: 9px;
            background: #fff;
            cursor: pointer;
            font-weight: 600;
          }

          .docentes-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .docente-card {
            padding: 20px;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            background: #fff;
          }

          .docente-card-header {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .docente-avatar {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #eef2ff;
            color: #4f46e5;
          }

          .docente-card h2 {
            margin: 0;
            color: #172033;
            font-size: 17px;
          }

          .docente-card-header span {
            color: #667085;
            font-size: 13px;
          }

          .docente-contact {
            display: grid;
            gap: 8px;
            margin: 18px 0;
            padding: 14px 0;
            border-top: 1px solid #eef0f4;
            border-bottom: 1px solid #eef0f4;
          }

          .docente-contact div,
          .docente-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .docente-contact svg,
          .docente-section-title svg {
            color: #667085;
            flex-shrink: 0;
          }

          .docente-contact span {
            color: #475467;
            font-size: 14px;
            word-break: break-word;
          }

          .docente-section {
            margin-top: 15px;
          }

          .docente-section-title {
            color: #344054;
            margin-bottom: 9px;
          }

          .docente-section p {
            margin: 0;
            color: #98a2b3;
            font-size: 13px;
          }

          .docente-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }

          .docente-tags span {
            padding: 6px 9px;
            border-radius: 7px;
            background: #f2f4f7;
            color: #344054;
            font-size: 12px;
          }

          .docentes-error,
          .docentes-state,
          .docentes-empty {
            padding: 22px;
            border-radius: 12px;
            background: #fff;
            border: 1px solid #e8ecf1;
            color: #667085;
          }

          .docentes-error {
            margin-bottom: 18px;
          }

          @media (max-width: 800px) {
            .docentes-header,
            .docentes-toolbar {
              flex-direction: column;
            }

            .docentes-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}