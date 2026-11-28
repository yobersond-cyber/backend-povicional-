
import { useEffect, useState } from "react";

import {
  FiBookOpen,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

function Materias() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Consulta las materias al backend.
  const cargarMaterias = async () => {
    setLoading(true);
    setError("");

    try {
      const datos = await obtenerMaterias();
      setMaterias(datos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las materias",
      );
    } finally {
      setLoading(false);
    }
  };

  // Carga las materias al abrir la página.
  useEffect(() => {
    void cargarMaterias();
  }, []);

  // Filtra las materias según la búsqueda.
  const materiasFiltradas = materias.filter((materia) => {
    const texto = `
      ${materia.nombre_materia}
      ${materia.codigo_materia}
      ${materia.descripcion}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Materias</h2>
          <p>Consulta las materias académicas disponibles.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void cargarMaterias()}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </div>

      <div className="search-box">
        <FiSearch />

        <input
          type="text"
          placeholder="Buscar materia..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />
      </div>

      {loading && (
        <div className="empty-section">
          <p>Cargando materias...</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="subjects-grid">
          {materiasFiltradas.map((materia) => (
            <article
              className="subject-card"
              key={materia.id_materia}
            >
              <div className="subject-icon">
                <FiBookOpen />
              </div>

              <div>
                <span className="subject-code">
                  {materia.codigo_materia}
                </span>

                <h3>{materia.nombre_materia}</h3>

                <p>
                  {materia.descripcion ||
                    "Sin descripción disponible."}
                </p>

                <small>
                  Curso: {materia.id_curso}
                </small>
              </div>
            </article>
          ))}

          {materiasFiltradas.length === 0 && (
            <div className="empty-section">
              <p>No se encontraron materias.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Materias;
