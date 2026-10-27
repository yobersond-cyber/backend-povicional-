import { useEffect, useState } from "react";

import {
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerMateriales,
  type Material,
} from "../services/material";

function formatearFecha(fecha: string): string {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return valor.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MaterialesEstudiante() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarMateriales() {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerMateriales();
      setMateriales(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los materiales académicos.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarMateriales();
  }, []);

  const materialesFiltrados = materiales.filter((material) => {
    const texto = [
      material.titulo,
      material.descripcion ?? "",
      String(material.id_materia),
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(busqueda.trim().toLowerCase());
  });

  function abrirMaterial(archivo: string | null) {
    if (!archivo) {
      setError("Este material no tiene un enlace disponible.");
      return;
    }

    try {
      const url = new URL(archivo);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        setError("El enlace del material no es válido.");
        return;
      }

      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch {
      setError("El enlace del material no es válido.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h2>Materiales académicos</h2>

          <p>
            Consulta los recursos publicados por tus docentes
            para las materias de tu curso.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void cargarMateriales()}
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
          placeholder="Buscar por título, descripción o materia..."
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          aria-label="Buscar materiales"
        />
      </div>

      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void cargarMateriales()}
            disabled={cargando}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {cargando && (
        <div className="empty-section">
          <FiFileText />
          <p>Cargando materiales académicos...</p>
        </div>
      )}

      {!cargando && !error && (
        <div className="materials-grid">
          {materialesFiltrados.map((material) => (
            <article
              className="material-card"
              key={material.id_material}
            >
              <div className="material-icon">
                <FiFileText />
              </div>

              <div className="material-content">
                <span className="material-label">
                  Recurso académico
                </span>

                <h3>{material.titulo}</h3>

                <p>
                  {material.descripcion ||
                    "Sin descripción disponible."}
                </p>

                <div className="material-meta">
                  <span>
                    Publicado:{" "}
                    {formatearFecha(material.fecha_publicacion)}
                  </span>

                  <span>
                    Materia #{material.id_materia}
                  </span>
                </div>

                {material.archivo && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => abrirMaterial(material.archivo)}
                  >
                    <FiDownload />
                    Abrir material
                  </button>
                )}
              </div>
            </article>
          ))}

          {materialesFiltrados.length === 0 && (
            <div className="empty-section">
              <FiFileText />

              <h3>No hay materiales</h3>

              <p>
                {materiales.length === 0
                  ? "Tus docentes todavía no han publicado materiales para tus materias."
                  : "No se encontraron materiales con esa búsqueda."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}   