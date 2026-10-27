import {
  useEffect,
  useState,
} from "react";

import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiX,
} from "react-icons/fi";

import {
  actualizarCurso,
  crearCurso,
  obtenerCursos,
  type Curso,
} from "../services/curso";

// Formulario para crear o editar cursos
interface CursoFormulario {
  id_colegio: number;
  numero_curso: string;
  grado: string;
  jornada: string;
}

// Administra los cursos académicos
export default function Cursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [cursoEditando, setCursoEditando] =
    useState<number | null>(null);

  const [formulario, setFormulario] =
    useState<CursoFormulario>({
      id_colegio: 1,
      numero_curso: "",
      grado: "",
      jornada: "",
    });

  // Carga los cursos
  async function cargarCursos() {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerCursos();

      setCursos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los cursos.",
      );
    } finally {
      setCargando(false);
    }
  }

  // Carga los cursos al abrir el módulo
  useEffect(() => {
    void cargarCursos();
  }, []);

  // Abre el formulario para crear
  function abrirCrear() {
    setCursoEditando(null);

    setFormulario({
      id_colegio:
        cursos[0]?.id_colegio ?? 1,
      numero_curso: "",
      grado: "",
      jornada: "",
    });

    setModalAbierto(true);
  }

  // Abre el formulario para editar
  function abrirEditar(curso: Curso) {
    setCursoEditando(curso.id_curso);

    setFormulario({
      id_colegio: curso.id_colegio,
      numero_curso: curso.numero_curso,
      grado: curso.grado,
      jornada: curso.jornada,
    });

    setModalAbierto(true);
  }

  // Cierra el formulario
  function cerrarModal() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
  }

  // Actualiza un campo del formulario
  function cambiarCampo(
    campo: keyof CursoFormulario,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]:
        campo === "id_colegio"
          ? Number(valor)
          : valor,
    }));
  }

  // Guarda el curso
  async function guardarCurso(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !formulario.numero_curso.trim() ||
      !formulario.grado.trim() ||
      !formulario.jornada.trim()
    ) {
      setError(
        "Completa todos los campos del curso.",
      );

      return;
    }

    try {
      setGuardando(true);
      setError("");

      if (cursoEditando === null) {
        await crearCurso({
          id_colegio:
            formulario.id_colegio,
          numero_curso:
            formulario.numero_curso.trim(),
          grado:
            formulario.grado.trim(),
          jornada:
            formulario.jornada.trim(),
        });
      } else {
        await actualizarCurso(
          cursoEditando,
          {
            id_colegio:
              formulario.id_colegio,
            numero_curso:
              formulario.numero_curso.trim(),
            grado:
              formulario.grado.trim(),
            jornada:
              formulario.jornada.trim(),
          },
        );
      }

      setModalAbierto(false);

      await cargarCursos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar el curso.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="cursos-page">
      {/* Encabezado */}
      <section className="cursos-header">
        <div>
          <span className="cursos-kicker">
            Administración académica
          </span>

          <h1>Cursos</h1>

          <p>
            Gestiona los cursos registrados en el
            colegio.
          </p>
        </div>

        <div className="cursos-actions">
          <button
            type="button"
            className="cursos-refresh"
            onClick={() => void cargarCursos()}
            disabled={cargando}
          >
            <FiRefreshCw />

            Actualizar
          </button>

          <button
            type="button"
            className="cursos-primary"
            onClick={abrirCrear}
          >
            <FiPlus />

            Nuevo curso
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="cursos-error">
          {error}
        </div>
      )}

      {/* Carga */}
      {cargando && (
        <div className="cursos-state">
          Cargando cursos...
        </div>
      )}

      {/* Tabla */}
      {!cargando && (
        <section className="cursos-card">
          <div className="cursos-table-wrapper">
            <table className="cursos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Curso</th>
                  <th>Grado</th>
                  <th>Jornada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cursos.map((curso) => (
                  <tr key={curso.id_curso}>
                    <td>
                      {curso.id_curso}
                    </td>

                    <td>
                      <strong>
                        {curso.numero_curso}
                      </strong>
                    </td>

                    <td>
                      {curso.grado}
                    </td>

                    <td>
                      {curso.jornada}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="cursos-edit"
                        onClick={() =>
                          abrirEditar(curso)
                        }
                      >
                        <FiEdit2 />

                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cursos.length === 0 && (
            <div className="cursos-empty">
              No hay cursos registrados.
            </div>
          )}
        </section>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="cursos-modal-overlay">
          <div className="cursos-modal">
            <div className="cursos-modal-header">
              <div>
                <h2>
                  {cursoEditando === null
                    ? "Nuevo curso"
                    : "Editar curso"}
                </h2>

                <p>
                  Completa la información del curso.
                </p>
              </div>

              <button
                type="button"
                className="cursos-modal-close"
                onClick={cerrarModal}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={guardarCurso}>
              <div className="cursos-form-grid">
                <label>
                  Colegio
                  <input
                    type="number"
                    min="1"
                    value={formulario.id_colegio}
                    onChange={(event) =>
                      cambiarCampo(
                        "id_colegio",
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  Número de curso
                  <input
                    type="text"
                    value={
                      formulario.numero_curso
                    }
                    onChange={(event) =>
                      cambiarCampo(
                        "numero_curso",
                        event.target.value,
                      )
                    }
                    placeholder="Ej. 01"
                    required
                  />
                </label>

                <label>
                  Grado
                  <input
                    type="text"
                    value={formulario.grado}
                    onChange={(event) =>
                      cambiarCampo(
                        "grado",
                        event.target.value,
                      )
                    }
                    placeholder="Ej. 10"
                    required
                  />
                </label>

                <label>
                  Jornada
                  <input
                    type="text"
                    value={formulario.jornada}
                    onChange={(event) =>
                      cambiarCampo(
                        "jornada",
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Mañana"
                    required
                  />
                </label>
              </div>

              <div className="cursos-form-actions">
                <button
                  type="button"
                  className="cursos-cancel"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="cursos-primary"
                  disabled={guardando}
                >
                  <FiSave />

                  {guardando
                    ? "Guardando..."
                    : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
    </div>
  );
}