import { useEffect, useState } from "react";

import {
  FiCalendar,
  FiClipboard,
  FiClock,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerMisActividades,
  type ActividadEstudiante,
} from "../services/actividad";

function fechaLocal(fecha: string): Date | null {
  const valor = new Date(
    fecha.includes("T")
      ? fecha
      : `${fecha.slice(0, 10)}T00:00:00`,
  );

  return Number.isNaN(valor.getTime())
    ? null
    : valor;
}

function formatearFecha(fecha: string): string {
  const valor = fechaLocal(fecha);

  if (!valor) {
    return "Fecha no disponible";
  }

  return valor.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function actividadVencida(fecha: string): boolean {
  const limite = fechaLocal(fecha);

  if (!limite) {
    return false;
  }

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  limite.setHours(23, 59, 59, 999);

  return limite < hoy;
}

export default function ActividadesEstudiante() {
  const [actividades, setActividades] = useState<
    ActividadEstudiante[]
  >([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarActividades() {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerMisActividades();
      setActividades(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las actividades.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarActividades();
  }, []);

  const actividadesFiltradas = actividades.filter(
    (actividad) => {
      const texto = [
        actividad.titulo,
        actividad.descripcion,
        String(actividad.id_actividad),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(busqueda.trim().toLowerCase());
    },
  );

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Mis actividades</h2>

          <p>
            Consulta las actividades académicas asignadas
            a tu curso y revisa sus fechas de entrega.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void cargarActividades()}
          disabled={cargando}
        >
          <FiRefreshCw />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="search-box">
        <FiSearch />

        <input
          type="search"
          placeholder="Buscar actividad..."
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
          aria-label="Buscar actividades"
        />
      </div>

      {cargando && (
        <div className="empty-section">
          <FiClock />
          <p>Cargando actividades...</p>
        </div>
      )}

      {!cargando && error && (
        <div className="error-box" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void cargarActividades()}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {!cargando && !error && (
        <div className="activities-list">
          {actividadesFiltradas.map((actividad) => {
            const vencida = actividadVencida(
              actividad.fecha_limite,
            );

            return (
              <article
                className="activity-card"
                key={actividad.id_actividad}
              >
                <div className="activity-card-icon">
                  <FiClipboard />
                </div>

                <div className="activity-card-content">
                  <div className="activity-card-top">
                    <div>
                      <span className="activity-label">
                        Actividad académica
                      </span>

                      <h3>{actividad.titulo}</h3>
                    </div>

                    <span
                      className={
                        vencida
                          ? "activity-status expired"
                          : "activity-status active"
                      }
                    >
                      {vencida ? "Vencida" : "Pendiente"}
                    </span>
                  </div>

                  <p>
                    {actividad.descripcion ||
                      "Sin descripción disponible."}
                  </p>

                  <div className="activity-meta">
                    <span>
                      <FiCalendar />
                      Publicación:{" "}
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

                  <span className="activity-label">
                    Actividad #{actividad.id_actividad}
                  </span>
                </div>
              </article>
            );
          })}

          {actividadesFiltradas.length === 0 && (
            <div className="empty-section">
              <FiClipboard />

              <h3>No hay actividades</h3>

              <p>
                {actividades.length === 0
                  ? "Todavía no tienes actividades asignadas."
                  : "No hay actividades que coincidan con tu búsqueda."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}