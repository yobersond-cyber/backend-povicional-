import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  FiBookOpen,
  FiLock,
  FiMail,
  FiPhone,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  actualizarUsuario,
  crearUsuario,
  type Estudiante,
} from "../../services/usuario";

import {
  obtenerCursos,
  type Curso,
} from "../../services/curso";

import {
  asignarUsuarioCurso,
} from "../../services/asignaciones";

import { useAuth } from "../../context/AuthContext";

interface EstudianteFormProps {
  estudiante?: Estudiante | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormularioEstudiante {
  codigo_usuario: string;
  documento: string;
  nombres_compl: string;
  apellidos_compl: string;
  telefono: string;
  correo: string;
  jornada: string;
  contrasena: string;
  id_curso: string;
}

const formularioInicial: FormularioEstudiante = {
  codigo_usuario: "",
  documento: "",
  nombres_compl: "",
  apellidos_compl: "",
  telefono: "",
  correo: "",
  jornada: "",
  contrasena: "",
  id_curso: "",
};

export default function EstudianteForm({
  estudiante = null,
  onSuccess,
  onCancel,
}: EstudianteFormProps) {
  const { usuario } = useAuth();

  const esEdicion =
    estudiante !== null;

  const [
    formulario,
    setFormulario,
  ] = useState<FormularioEstudiante>(
    formularioInicial,
  );

  const [
    cursos,
    setCursos,
  ] = useState<Curso[]>([]);

  const [
    cargandoCursos,
    setCargandoCursos,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    advertencia,
    setAdvertencia,
  ] = useState("");

  useEffect(() => {
    if (!estudiante) {
      setFormulario(
        formularioInicial,
      );

      return;
    }

    setFormulario({
      codigo_usuario:
        estudiante.codigo_usuario ?? "",

      documento:
        estudiante.documento ?? "",

      nombres_compl:
        estudiante.nombres_compl ?? "",

      apellidos_compl:
        estudiante.apellidos_compl ?? "",

      telefono:
        estudiante.telefono ?? "",

      correo:
        estudiante.correo ?? "",

      jornada:
        estudiante.jornada ?? "",

      contrasena: "",

      id_curso: "",
    });
  }, [estudiante]);

  useEffect(() => {
    async function cargarCursos() {
      try {
        setCargandoCursos(true);

        const datos =
          await obtenerCursos();

        setCursos(datos);

        /*
         * Si estamos editando y el estudiante
         * ya tiene una relación con un curso,
         * intentamos identificarla desde los
         * datos disponibles.
         *
         * Si el backend no devuelve el curso
         * dentro de Estudiante, se mantiene
         * vacío para que el administrador
         * pueda seleccionar uno.
         */
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los cursos.",
        );
      } finally {
        setCargandoCursos(false);
      }
    }

    void cargarCursos();
  }, []);

  function actualizarCampo(
    campo: keyof FormularioEstudiante,
    valor: string,
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );
  }

  async function guardarEstudiante(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setAdvertencia("");

    if (!usuario) {
      setError(
        "No se encontró la sesión del administrador.",
      );

      return;
    }

    if (!formulario.id_curso) {
      setError(
        "Debes seleccionar un curso.",
      );

      return;
    }

    try {
      setGuardando(true);

      /*
       * ========================================
       * MODO EDICIÓN
       * ========================================
       */
      if (esEdicion && estudiante) {
        await actualizarUsuario(
          estudiante.id_usuario,
          {
            id_colegio:
              usuario.id_colegio,

            codigo_usuario:
              formulario.codigo_usuario.trim(),

            documento:
              formulario.documento.trim(),

            nombres_compl:
              formulario.nombres_compl.trim(),

            apellidos_compl:
              formulario.apellidos_compl.trim(),

            telefono:
              formulario.telefono.trim(),

            correo:
              formulario.correo.trim(),

            tipo_de_usuario:
              "estudiante",

            jornada:
              formulario.jornada || null,

            ...(formulario.contrasena
              ? {
                  contrasena:
                    formulario.contrasena,
                }
              : {}),
          },
        );

        /*
         * Intentamos asignar el nuevo curso.
         *
         * Si ya existe la relación, el backend
         * puede devolver error por duplicado.
         * En ese caso no impedimos que la
         * actualización del usuario quede guardada.
         */
        try {
          await asignarUsuarioCurso({
            id_usuario:
              estudiante.id_usuario,

            id_curso:
              Number(
                formulario.id_curso,
              ),
          });
        } catch (err) {
          const mensaje =
            err instanceof Error
              ? err.message
              : "No fue posible actualizar el curso.";

          setAdvertencia(
            `Los datos del estudiante fueron actualizados, pero no se pudo actualizar la asignación del curso: ${mensaje}`,
          );

          return;
        }

        onSuccess();

        return;
      }

      /*
       * ========================================
       * MODO CREACIÓN
       * ========================================
       */

      const nuevoEstudiante =
        await crearUsuario({
          id_colegio:
            usuario.id_colegio,

          codigo_usuario:
            formulario.codigo_usuario.trim(),

          documento:
            formulario.documento.trim(),

          nombres_compl:
            formulario.nombres_compl.trim(),

          apellidos_compl:
            formulario.apellidos_compl.trim(),

          telefono:
            formulario.telefono.trim(),

          correo:
            formulario.correo.trim(),

          tipo_de_usuario:
            "estudiante",

          jornada:
            formulario.jornada || null,

          contrasena:
            formulario.contrasena,
        });

      /*
       * Asignar curso al nuevo estudiante.
       */
      try {
        await asignarUsuarioCurso({
          id_usuario:
            nuevoEstudiante.id_usuario,

          id_curso:
            Number(
              formulario.id_curso,
            ),
        });
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "No fue posible asignar el curso.";

        setAdvertencia(
          `El estudiante fue creado correctamente, pero no se pudo asignar al curso: ${mensaje}`,
        );

        return;
      }

      setFormulario(
        formularioInicial,
      );

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : esEdicion
            ? "No fue posible actualizar el estudiante."
            : "No fue posible crear el estudiante.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div>
            <span className="admin-modal-kicker">
              Administración
            </span>

            <h2>
              {esEdicion
                ? "Editar estudiante"
                : "Crear estudiante"}
            </h2>

            <p>
              {esEdicion
                ? "Actualiza la información del estudiante."
                : "Registra el estudiante y asígnalo a su curso."}
            </p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onCancel}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </div>

        {error && (
          <div
            className="admin-form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {advertencia && (
          <div
            className="admin-form-warning"
            role="alert"
          >
            {advertencia}
          </div>
        )}

        <form
          onSubmit={guardarEstudiante}
          className="admin-form"
        >
          <div className="admin-form-section">
            <h3>
              Información personal
            </h3>

            <div className="admin-form-grid">
              <label>
                <span>
                  Nombres
                </span>

                <div className="admin-input">
                  <FiUser />

                  <input
                    type="text"
                    value={
                      formulario.nombres_compl
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "nombres_compl",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  Apellidos
                </span>

                <div className="admin-input">
                  <FiUser />

                  <input
                    type="text"
                    value={
                      formulario.apellidos_compl
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "apellidos_compl",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  Documento
                </span>

                <input
                  type="text"
                  value={
                    formulario.documento
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "documento",
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Código de estudiante
                </span>

                <input
                  type="text"
                  value={
                    formulario.codigo_usuario
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "codigo_usuario",
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Teléfono
                </span>

                <div className="admin-input">
                  <FiPhone />

                  <input
                    type="tel"
                    value={
                      formulario.telefono
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "telefono",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  Correo
                </span>

                <div className="admin-input">
                  <FiMail />

                  <input
                    type="email"
                    value={
                      formulario.correo
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "correo",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="admin-form-section">
            <h3>
              Información académica
            </h3>

            <div className="admin-form-grid">
              <label>
                <span>
                  Jornada
                </span>

                <select
                  value={
                    formulario.jornada
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "jornada",
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar jornada
                  </option>

                  <option value="mañana">
                    Mañana
                  </option>

                  <option value="tarde">
                    Tarde
                  </option>

                  <option value="noche">
                    Noche
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Curso
                </span>

                <div className="admin-input">
                  <FiBookOpen />

                  <select
                    value={
                      formulario.id_curso
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "id_curso",
                        event.target.value,
                      )
                    }
                    required
                    disabled={
                      cargandoCursos
                    }
                  >
                    <option value="">
                      {cargandoCursos
                        ? "Cargando cursos..."
                        : "Seleccionar curso"}
                    </option>

                    {cursos.map(
                      (curso) => (
                        <option
                          key={
                            curso.id_curso
                          }
                          value={
                            curso.id_curso
                          }
                        >
                          {curso.grado} -{" "}
                          {
                            curso.numero_curso
                          }{" "}
                          ({curso.jornada})
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </label>

              <label>
                <span>
                  Contraseña
                  {esEdicion &&
                    " (opcional)"}
                </span>

                <div className="admin-input">
                  <FiLock />

                  <input
                    type="password"
                    value={
                      formulario.contrasena
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        "contrasena",
                        event.target.value,
                      )
                    }
                    minLength={6}
                    required={!esEdicion}
                    placeholder={
                      esEdicion
                        ? "Dejar vacío para conservarla"
                        : ""
                    }
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button-secondary"
              onClick={onCancel}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="admin-button-primary"
              disabled={
                guardando ||
                cargandoCursos
              }
            >
              <FiSave />

              {guardando
                ? esEdicion
                  ? "Guardando..."
                  : "Creando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear estudiante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}