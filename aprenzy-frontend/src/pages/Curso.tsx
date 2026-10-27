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

      <style>
        {`
          .cursos-page {
            width: 100%;
          }

          .cursos-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 24px;
          }

          .cursos-kicker {
            color: #fff;
            font-size: 17px;
            font-weight: 700;
          }

          .cursos-header h1 {
            margin: 5px 0 8px;
            color: #fff;
            font-size: 28px;
          }

          .cursos-header p {
            margin: 0;
            color: #fff;
          }

          .cursos-actions {
            display: flex;
            gap: 10px;
          }

          .cursos-refresh,
          .cursos-primary,
          .cursos-edit,
          .cursos-cancel {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 10px 14px;
            border-radius: 9px;
            cursor: pointer;
            font-weight: 600;
          }

          .cursos-refresh {
            border: 1px solid #d9deea;
            background: #fff;
            color: #344054;
          }

          .cursos-primary {
            border: 1px solid #4f46e5;
            background: #4f46e5;
            color: #fff;
          }

          .cursos-card {
            overflow: hidden;
            border: 1px solid #e8ecf1;
            border-radius: 14px;
            background: #fff;
          }

          .cursos-table-wrapper {
            overflow-x: auto;
          }

          .cursos-table {
            width: 100%;
            border-collapse: collapse;
          }

          .cursos-table th,
          .cursos-table td {
            padding: 15px 18px;
            border-bottom: 1px solid #f4efee;
            background: #263247;
            text-align: left;
          }

          .cursos-table th {
            background: #17213c;
            color: #fff;
            font-size: 12px;
            text-transform: uppercase;
          }

          .cursos-table td {
            color: #fff;
            font-size: 14px;
            background: #17213c
          }

          .cursos-table td strong {
            color: #fff;
          }

          .cursos-edit {
            border: 1px solid #d9deea;
            background: #fff;
            color: #344054;
          }

          .cursos-error,
          .cursos-state,
          .cursos-empty {
            padding: 18px;
            margin-bottom: 18px;
            border: 1px solid #f1eae8;
            border-radius: 12px;
            background: #fff;
            color: #667085;
          }

          .cursos-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.45);
          }

          .cursos-modal {
            width: min(600px, 100%);
            padding: 24px;
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
          }

          .cursos-modal-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
          }

          .cursos-modal-header h2 {
            margin: 0;
            color: #172033;
          }

          .cursos-modal-header p {
            margin: 6px 0 0;
            color: #667085;
          }

          .cursos-modal-close {
            width: 36px;
            height: 36px;
            border: 0;
            border-radius: 8px;
            background: #f2f4f7;
            cursor: pointer;
          }

          .cursos-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .cursos-form-grid label {
            display: grid;
            gap: 7px;
            color: #344054;
            font-size: 13px;
            font-weight: 600;
          }

          .cursos-form-grid input {
            width: 100%;
            box-sizing: border-box;
            padding: 11px;
            border: 1px solid #d9deea;
            border-radius: 8px;
            outline: none;
          }

          .cursos-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 22px;
          }

          .cursos-cancel {
            border: 1px solid #d9deea;
            background: #fff;
            color: #344054;
          }

          @media (max-width: 700px) {
            .cursos-header {
              flex-direction: column;
            }

            .cursos-actions {
              width: 100%;
            }

            .cursos-actions button {
              flex: 1;
            }

            .cursos-form-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}