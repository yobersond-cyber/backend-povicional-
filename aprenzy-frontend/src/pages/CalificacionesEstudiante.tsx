import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerEntregas,
  type Entrega,
} from "../services/entrega";

import {
  obtenerActividades,
  type Actividad,
} from "../services/actividad";

import {
  obtenerMaterias,
  type Materia,
} from "../services/materia";

interface EntregaEstudiante extends Entrega {
  actividad?: Actividad;
  materia?: Materia;
}

function formatearFecha(fecha: string): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor = new Date(
    fecha.includes("T")
      ? fecha
      : `${fecha.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function obtenerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar las calificaciones.";
}

export default function CalificacionesEstudiante() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarCalificaciones() {
    setCargando(true);
    setError("");

    try {
      const [
        entregasData,
        actividadesData,
        materiasData,
      ] = await Promise.all([
        obtenerEntregas(),
        obtenerActividades(),
        obtenerMaterias(),
      ]);

      setEntregas(entregasData ?? []);
      setActividades(actividadesData ?? []);
      setMaterias(materiasData ?? []);
    } catch (err) {
      setError(obtenerError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarCalificaciones();
  }, []);

  // Relaciona cada entrega con su actividad y materia.
  const entregasRelacionadas = useMemo<
    EntregaEstudiante[]
  >(() => {
    return entregas.map((entrega) => {
      const actividad = actividades.find(
        (item) =>
          item.id_actividad === entrega.id_actividad,
      );

      const materia = materias.find(
        (item) =>
          item.id_materia === actividad?.id_materia,
      );

      return {
        ...entrega,
        actividad,
        materia,
      };
    });
  }, [entregas, actividades, materias]);

  // Filtra las entregas por materia y texto.
  const entregasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return entregasRelacionadas.filter((entrega) => {
      const idMateria =
        entrega.materia?.id_materia ??
        entrega.actividad?.id_materia;

      if (
        filtroMateria &&
        String(idMateria) !== filtroMateria
      ) {
        return false;
      }

      const contenido = [
        entrega.actividad?.titulo ?? "",
        entrega.actividad?.descripcion ?? "",
        entrega.materia?.nombre_materia ?? "",
        entrega.descripcion ?? "",
        entrega.comentario_docente ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [
    entregasRelacionadas,
    busqueda,
    filtroMateria,
  ]);

  // Cuenta las entregas que ya tienen nota.
  const entregasCalificadas = entregasRelacionadas.filter(
    (entrega) =>
      entrega.nota !== null &&
      entrega.nota !== undefined,
  );

  // Calcula el promedio solamente con notas existentes.
  const promedio = useMemo(() => {
    const notas = entregasCalificadas.map(
      (entrega) => entrega.nota as number,
    );

    if (notas.length === 0) {
      return null;
    }

    const suma = notas.reduce(
      (total, nota) => total + nota,
      0,
    );

    return Math.round((suma / notas.length) * 10) / 10;
  }, [entregasCalificadas]);

  return (
    <section className="page-section">
      <style>{`
        .ce-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin: 22px 0;
        }

        .ce-stat {
          padding: 18px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
        }

        .ce-stat span {
          color: #64748b;
          font-size: 13px;
        }

        .ce-stat strong {
          display: block;
          margin-top: 8px;
          font-size: 26px;
          color: #0f172a;
        }

        .ce-filters {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 12px;
          margin: 20px 0;
        }

        .ce-filters input,
        .ce-filters select {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #fff;
          color: #334155;
          font-size: 14px;
        }

        .ce-list {
          display: grid;
          gap: 14px;
        }

        .ce-card {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #fff;
        }

        .ce-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .ce-card-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .ce-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 20px;
        }

        .ce-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
        }

        .ce-subject {
          margin-top: 6px;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 700;
        }

        .ce-grade {
          flex-shrink: 0;
          color: #0f172a;
          font-weight: 800;
          font-size: 22px;
          text-align: right;
        }

        .ce-grade small {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
        }

        .ce-status {
          display: inline-block;
          margin-top: 9px;
          padding: 5px 9px;
          border-radius: 30px;
          background: #fef3c7;
          color: #92400e;
          font-size: 11px;
          font-weight: 700;
        }

        .ce-status-graded {
          background: #dcfce7;
          color: #166534;
        }

        .ce-description {
          margin: 16px 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .ce-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: #64748b;
          font-size: 12px;
        }

        .ce-comment {
          margin-top: 15px;
          padding: 13px;
          border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        .ce-comment strong {
          display: block;
          margin-bottom: 5px;
          color: #0f172a;
        }

        .ce-message {
          padding: 28px 18px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          color: #64748b;
          text-align: center;
          line-height: 1.6;
        }

        .ce-error {
          margin: 16px 0;
          padding: 14px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #991b1b;
          overflow-wrap: anywhere;
        }

        .ce-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #fff;
          color: #334155;
          cursor: pointer;
          font-weight: 600;
        }

        .ce-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .ce-stats {
            grid-template-columns: 1fr;
          }

          .ce-filters {
            grid-template-columns: 1fr;
          }

          .ce-card-header {
            flex-direction: column;
          }

          .ce-grade {
            text-align: left;
          }

          .ce-card {
            padding: 15px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>Mis calificaciones</h2>

          <p>
            Consulta tus notas, las actividades evaluadas
            y los comentarios de tus docentes.
          </p>
        </div>

        <button
          type="button"
          className="ce-refresh"
          onClick={() => void cargarCalificaciones()}
          disabled={cargando}
        >
          <FiRefreshCw />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="ce-stats">
        <div className="ce-stat">
          <span>Entregas realizadas</span>
          <strong>{entregasRelacionadas.length}</strong>
        </div>

        <div className="ce-stat">
          <span>Entregas calificadas</span>
          <strong>{entregasCalificadas.length}</strong>
        </div>

        <div className="ce-stat">
          <span>Promedio de notas publicadas</span>
          <strong>
            {promedio === null ? "—" : `${promedio}/100`}
          </strong>
        </div>
      </div>

      <div className="ce-filters">
        <input
          type="search"
          aria-label="Buscar calificaciones"
          placeholder="Buscar actividad, materia o comentario..."
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
        />

        <select
          aria-label="Filtrar por materia"
          value={filtroMateria}
          onChange={(evento) =>
            setFiltroMateria(evento.target.value)
          }
        >
          <option value="">Todas mis materias</option>

          {materias.map((materia) => (
            <option
              key={materia.id_materia}
              value={materia.id_materia}
            >
              {materia.nombre_materia}
            </option>
          ))}
        </select>
      </div>

      {cargando && (
        <div className="ce-message">
          Cargando tus calificaciones...
        </div>
      )}

      {!cargando && error && (
        <div className="ce-error" role="alert">
          <strong>No fue posible cargar tus calificaciones.</strong>

          <p>{error}</p>

          <button
            type="button"
            className="ce-refresh"
            onClick={() => void cargarCalificaciones()}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {!cargando && !error && (
        <div className="ce-list">
          {entregasFiltradas.map((entrega) => {
            const calificada =
              entrega.nota !== null &&
              entrega.nota !== undefined;

            return (
              <article
                className="ce-card"
                key={entrega.id_entrega}
              >
                <div className="ce-card-header">
                  <div className="ce-card-title">
                    <div className="ce-icon">
                      <FiFileText />
                    </div>

                    <div>
                      <h3>
                        {entrega.actividad?.titulo ??
                          `Actividad #${entrega.id_actividad}`}
                      </h3>

                      <div className="ce-subject">
                        <FiBookOpen
                          style={{
                            display: "inline",
                            marginRight: 5,
                          }}
                        />

                        {entrega.materia?.nombre_materia ??
                          "Materia no disponible"}
                      </div>

                      <span
                        className={
                          calificada
                            ? "ce-status ce-status-graded"
                            : "ce-status"
                        }
                      >
                        {calificada
                          ? "Calificada"
                          : "Pendiente de calificación"}
                      </span>
                    </div>
                  </div>

                  <div className="ce-grade">
                    {calificada
                      ? `${entrega.nota}/100`
                      : "Pendiente"}

                    <small>Nota publicada</small>
                  </div>
                </div>

                <p className="ce-description">
                  {entrega.actividad?.descripcion ??
                    entrega.descripcion ??
                    "Sin descripción disponible."}
                </p>

                <div className="ce-meta">
                  <span>
                    <FiCalendar
                      style={{
                        display: "inline",
                        marginRight: 5,
                      }}
                    />

                    Entregada:{" "}
                    {formatearFecha(entrega.fecha_entrega)}
                  </span>

                  {entrega.actividad?.fecha_limite && (
                    <span>
                      Fecha límite:{" "}
                      {formatearFecha(
                        entrega.actividad.fecha_limite,
                      )}
                    </span>
                  )}
                </div>

                {calificada &&
                  entrega.comentario_docente && (
                    <div className="ce-comment">
                      <strong>
                        Comentario de tu docente
                      </strong>

                      {entrega.comentario_docente}
                    </div>
                  )}
              </article>
            );
          })}

          {entregasFiltradas.length === 0 && (
            <div className="ce-message">
              <FiCheckCircle size={28} />

              <h3>No hay calificaciones para mostrar</h3>

              <p>
                {entregasRelacionadas.length === 0
                  ? "Cuando entregues actividades y tus docentes las evalúen, podrás consultar tus notas aquí."
                  : "Ninguna entrega coincide con los filtros seleccionados."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}