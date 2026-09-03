// Importa las herramientas necesarias de React
import { useEffect, useState } from "react";

// Importa iconos para la interfaz
import {
  FiBookOpen,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

// Importa el servicio de materias
import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

// Página de materias académicas
function Materias() {
  // Guarda las materias recibidas del backend
  const [materias, setMaterias] = useState<Materia[]>([]);

  // Guarda el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Controla la carga de información
  const [loading, setLoading] = useState(true);

  // Guarda posibles errores
  const [error, setError] = useState("");

  // Carga las materias al abrir la página
  useEffect(() => {
    // Ejecuta la función de carga
    cargarMaterias();
  }, []);

  // Consulta las materias al backend
  const cargarMaterias = async () => {
    // Activa la carga
    setLoading(true);

    // Limpia errores anteriores
    setError("");

    try {
      // Obtiene las materias reales
      const datos = await obtenerMaterias();

      // Guarda las materias
      setMaterias(datos);
    } catch (error) {
      // Muestra el error recibido
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las materias",
      );
    } finally {
      // Finaliza la carga
      setLoading(false);
    }
  };

  // Filtra las materias según la búsqueda
  const materiasFiltradas = materias.filter((materia) => {
    // Convierte los datos importantes a texto
    const texto = `
      ${materia.nombre_materia}
      ${materia.codigo_materia}
      ${materia.descripcion}
    `.toLowerCase();

    // Comprueba si coincide con la búsqueda
    return texto.includes(busqueda.toLowerCase());
  });

  // Renderiza la página
  return (
    <section className="page-section">
      {/* Encabezado de la página */}
      <div className="page-header">
        {/* Título y descripción */}
        <div>
          <h2>Materias</h2>
          <p>Consulta las materias académicas disponibles.</p>
        </div>

        {/* Botón para actualizar */}
        <button
          className="secondary-button"
          onClick={cargarMaterias}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda */}
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

      {/* Mensaje mientras carga */}
      {loading && (
        <div className="empty-section">
          <p>Cargando materias...</p>
        </div>
      )}

      {/* Mensaje de error */}
      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {/* Lista de materias */}
      {!loading && !error && (
        <div className="subjects-grid">
          {materiasFiltradas.map((materia) => (
            <article
              className="subject-card"
              key={materia.id_materia}
            >
              {/* Icono de la materia */}
              <div className="subject-icon">
                <FiBookOpen />
              </div>

              {/* Información principal */}
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

          {/* Mensaje si no existen resultados */}
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

// Exporta la página
export default Materias;