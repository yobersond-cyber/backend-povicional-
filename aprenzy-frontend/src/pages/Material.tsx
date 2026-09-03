// Importa las herramientas necesarias de React
import { useEffect, useState } from "react";

// Importa los iconos
import {
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

// Importa el servicio de materiales
import {
  obtenerMateriales,
  type Material,
} from "../services/material";

// Página de materiales académicos
function Materiales() {
  // Guarda los materiales obtenidos
  const [materiales, setMateriales] = useState<Material[]>(
    [],
  );

  // Guarda el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Controla la carga
  const [loading, setLoading] = useState(true);

  // Guarda errores
  const [error, setError] = useState("");

  // Carga los materiales al abrir la página
  useEffect(() => {
    // Ejecuta la consulta
    cargarMateriales();
  }, []);

  // Consulta los materiales
  const cargarMateriales = async () => {
    // Activa la carga
    setLoading(true);

    // Limpia errores anteriores
    setError("");

    try {
      // Obtiene los materiales desde FastAPI
      const datos = await obtenerMateriales();

      // Guarda los materiales
      setMateriales(datos);
    } catch (error) {
      // Guarda el mensaje de error
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los materiales",
      );
    } finally {
      // Finaliza la carga
      setLoading(false);
    }
  };

  // Filtra los materiales
  const materialesFiltrados = materiales.filter(
    (material) => {
      // Construye el texto de búsqueda
      const texto = `
        ${material.titulo}
        ${material.descripcion ?? ""}
      `.toLowerCase();

      // Comprueba la coincidencia
      return texto.includes(
        busqueda.toLowerCase(),
      );
    },
  );

  // Formatea la fecha
  const formatearFecha = (fecha: string) => {
    // Convierte la fecha
    const fechaObjeto = new Date(fecha);

    // Devuelve la fecha formateada
    return fechaObjeto.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Abre el archivo del material
  const descargarMaterial = (archivo: string | null) => {
    // Comprueba que exista un archivo
    if (!archivo) {
      return;
    }

    // Abre el archivo en una nueva pestaña
    window.open(archivo, "_blank");
  };

  // Renderiza la página
  return (
    <section className="page-section">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h2>Materiales académicos</h2>

          <p>
            Consulta el material publicado por tus
            docentes.
          </p>
        </div>

        {/* Botón de actualización */}
        <button
          className="secondary-button"
          onClick={cargarMateriales}
        >
          <FiRefreshCw />

          Actualizar
        </button>
      </div>

      {/* Buscador */}
      <div className="search-box">
        <FiSearch />

        <input
          type="text"
          placeholder="Buscar material..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="empty-section">
          <FiFileText />

          <p>
            Cargando materiales...
          </p>
        </div>
      )}

      {/* Estado de error */}
      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {/* Lista de materiales */}
      {!loading && !error && (
        <div className="materials-grid">
          {materialesFiltrados.map((material) => (
            <article
              className="material-card"
              key={material.id_material}
            >
              {/* Icono */}
              <div className="material-icon">
                <FiFileText />
              </div>

              {/* Contenido */}
              <div className="material-content">
                <span className="material-label">
                  Material académico
                </span>

                <h3>{material.titulo}</h3>

                <p>
                  {material.descripcion ||
                    "Sin descripción disponible."}
                </p>

                {/* Información */}
                <div className="material-meta">
                  <span>
                    Publicado:{" "}
                    {formatearFecha(
                      material.fecha_publicacion,
                    )}
                  </span>

                  <span>
                    Materia #{material.id_materia}
                  </span>
                </div>

                {/* Botón de descarga */}
                {material.archivo && (
                  <button
                    className="primary-button"
                    onClick={() =>
                      descargarMaterial(
                        material.archivo,
                      )
                    }
                  >
                    <FiDownload />

                    Descargar material
                  </button>
                )}
              </div>
            </article>
          ))}

          {/* Sin resultados */}
          {materialesFiltrados.length === 0 && (
            <div className="empty-section">
              <FiFileText />

              <h3>
                No hay materiales
              </h3>

              <p>
                No se encontraron materiales
                académicos.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Exporta la página
export default Materiales;