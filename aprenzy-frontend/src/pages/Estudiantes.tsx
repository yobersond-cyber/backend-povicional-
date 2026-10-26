import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

import {
  eliminarUsuario,
  obtenerEstudiantes,
  type Estudiante,
} from "../services/usuario";

import EstudianteForm from "../components/admin/EstudianteForm";

import EstudianteTable from "../components/admin/EstudianteTable";

export default function Estudiantes() {
  const [
    estudiantes,
    setEstudiantes,
  ] = useState<Estudiante[]>([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    estudianteEditando,
    setEstudianteEditando,
  ] = useState<Estudiante | null>(
    null,
  );

  async function cargarEstudiantes() {
    try {
      setCargando(true);
      setError("");

      const datos =
        await obtenerEstudiantes();

      setEstudiantes(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los estudiantes.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarEstudiantes();
  }, []);

  const estudiantesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return estudiantes;
      }

      return estudiantes.filter(
        (estudiante) => {
          const datos = `
            ${estudiante.nombres_compl}
            ${estudiante.apellidos_compl}
            ${estudiante.codigo_usuario}
            ${estudiante.documento}
            ${estudiante.correo}
          `.toLowerCase();

          return datos.includes(
            texto,
          );
        },
      );
    }, [
      estudiantes,
      busqueda,
    ]);

  async function eliminarEstudiante(
    estudiante: Estudiante,
  ) {
    const nombre = `${estudiante.nombres_compl} ${estudiante.apellidos_compl}`;

    const confirmar =
      window.confirm(
        `¿Seguro que deseas eliminar al estudiante ${nombre}?`,
      );

    if (!confirmar) {
      return;
    }

    try {
      setError("");

      await eliminarUsuario(
        estudiante.id_usuario,
      );

      await cargarEstudiantes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible eliminar el estudiante.",
      );
    }
  }

  function abrirCrearEstudiante() {
    setError("");
    setEstudianteEditando(null);
    setMostrarFormulario(true);
  }

  function abrirEditarEstudiante(
    estudiante: Estudiante,
  ) {
    setError("");
    setEstudianteEditando(estudiante);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEstudianteEditando(null);
  }

  function formularioGuardado() {
    cerrarFormulario();

    void cargarEstudiantes();
  }

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <span className="admin-page-kicker">
            Administración
          </span>

          <h1>
            Estudiantes
          </h1>

          <p>
            Crea, consulta, actualiza
            y administra los estudiantes
            del colegio.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <div className="admin-total-card">
            <FiUsers />

            <div>
              <strong>
                {estudiantes.length}
              </strong>

              <span>
                estudiantes
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-button-primary"
            onClick={
              abrirCrearEstudiante
            }
          >
            <FiPlus />

            Nuevo estudiante
          </button>
        </div>
      </section>

      <section className="admin-toolbar">
        <div className="admin-search">
          <FiSearch />

          <input
            type="search"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value,
              )
            }
            placeholder="Buscar por nombre, código, documento o correo..."
            aria-label="Buscar estudiantes"
          />
        </div>

        <button
          type="button"
          className="admin-button-secondary"
          onClick={() =>
            void cargarEstudiantes()
          }
          disabled={cargando}
        >
          <FiRefreshCw />

          Actualizar
        </button>
      </section>

      {error && (
        <div
          className="admin-alert-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div className="admin-loading">
          Cargando estudiantes...
        </div>
      ) : (
        <EstudianteTable
          estudiantes={
            estudiantesFiltrados
          }
          onEditar={
            abrirEditarEstudiante
          }
          onEliminar={
            eliminarEstudiante
          }
        />
      )}

      {mostrarFormulario && (
        <EstudianteForm
          estudiante={
            estudianteEditando
          }
          onSuccess={
            formularioGuardado
          }
          onCancel={
            cerrarFormulario
          }
        />
      )}
    </div>
  );
}