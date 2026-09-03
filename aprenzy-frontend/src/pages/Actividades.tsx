// Importa las herramientas necesarias de React
import { useEffect, useState } from "react";

// Importa los iconos de la interfaz
import {
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

// Importa el servicio de actividades
import {
  obtenerMisActividades,
  type Actividad,
} from "../services/actividad";

// Página de actividades académicas
function Actividades() {
  // Guarda las actividades obtenidas del backend
  const [actividades, setActividades] = useState<Actividad[]>([]);

  // Guarda el texto de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Controla el estado de carga
  const [loading, setLoading] = useState(true);

  // Guarda los errores
  const [error, setError] = useState("");

  // Carga las actividades al abrir la página
  useEffect(() => {
    // Ejecuta la consulta inicial
    cargarActividades();
  }, []);

  // Consulta las actividades del estudiante
  const cargarActividades = async () => {
    // Activa el estado de carga
    setLoading(true);

    // Limpia errores anteriores
    setError("");

    try {
      // Obtiene las actividades desde FastAPI
      const datos = await obtenerMisActividades();

      // Guarda las actividades
      setActividades(datos);
    } catch (error) {
      // Guarda el mensaje de error
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las actividades",
      );
    } finally {
      // Finaliza la carga
      setLoading(false);
    }
  };

  // Filtra las actividades
  const actividadesFiltradas = actividades.filter(
    (actividad) => {
      // Construye el texto utilizado para buscar
      const texto = `
        ${actividad.titulo}
        ${actividad.descripcion}
      `.toLowerCase();

      // Comprueba si coincide con la búsqueda
      return texto.includes(busqueda.toLowerCase());
    },
  );

  // Determina si una actividad está vencida
  const estaVencida = (fecha: string) => {
    // Convierte la fecha en un objeto Date
    const fechaLimite = new Date(fecha);

    // Obtiene la fecha actual
    const ahora = new Date();

    // Comprueba si ya pasó la fecha límite
    return fechaLimite < ahora;
  };

  // Formatea una fecha para mostrarla al usuario
  const formatearFecha = (fecha: string) => {
    // Convierte la fecha recibida
    const fechaFormateada = new Date(fecha);

    // Devuelve la fecha en formato local
    return fechaFormateada.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );
  };

  // Renderiza la página
  return (
    <section className="page-section">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h2>Actividades</h2>

          <p>
            Consulta las actividades académicas
            asignadas.
          </p>
        </div>

        {/* Botón para actualizar */}
        <button
          className="secondary-button"
          onClick={cargarActividades}
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
          placeholder="Buscar actividad..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="empty-section">
          <FiClock />

          <p>
            Cargando actividades...
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {/* Lista de actividades */}
      {!loading && !error && (
        <div className="activities-list">
          {actividadesFiltradas.map(
            (actividad) => {
              // Comprueba si la actividad está vencida
              const vencida = estaVencida(
                actividad.fecha_limite,
              );

              return (
                <article
                  className="activity-card"
                  key={actividad.id_actividad}
                >
                  {/* Icono */}
                  <div className="activity-card-icon">
                    <FiClipboard />
                  </div>

                  {/* Información */}
                  <div className="activity-card-content">
                    <div className="activity-card-top">
                      <div>
                        <span className="activity-label">
                          Actividad académica
                        </span>

                        <h3>
                          {actividad.titulo}
                        </h3>
                      </div>

                      {/* Estado */}
                      <span
                        className={
                          vencida
                            ? "activity-status expired"
                            : "activity-status active"
                        }
                      >
                        {vencida
                          ? "Vencida"
                          : "Pendiente"}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p>
                      {actividad.descripcion ||
                        "Sin descripción disponible."}
                    </p>

                    {/* Información de fechas */}
                    <div className="activity-meta">
                      <span>
                        <FiCalendar />

                        Publicada:{" "}
                        {formatearFecha(
                          actividad.fecha_publicacion,
                        )}
                      </span>

                      <span>
                        <FiClock />

                        Fecha límite:{" "}
                        {formatearFecha(
                          actividad.fecha_limite,
                        )}
                      </span>
                    </div>

                    {/* Botón de entrega */}
                    {!vencida && (
                      <button
                        className="primary-button"
                        type="button"
                      >
                        <FiCheckCircle />

                        Ver actividad
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}

          {/* Mensaje sin resultados */}
          {actividadesFiltradas.length === 0 && (
            <div className="empty-section">
              <FiClipboard />

              <h3>
                No hay actividades
              </h3>

              <p>
                No se encontraron actividades
                para mostrar.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Exporta la página
export default Actividades;