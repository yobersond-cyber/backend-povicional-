import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";

import DocenteForm from "../components/admin/DocenteForm";
import DocenteTable from "../components/admin/DocenteTable";

import {
  eliminarUsuario,
  obtenerDocentes,
  type Usuario,
} from "../services/usuario";

export default function Docentes() {
  const [docentes, setDocentes] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [docenteEditando, setDocenteEditando] =
    useState<Usuario | null>(null);

  const cargarDocentes = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerDocentes();

      setDocentes(datos);
    } catch (error) {
      console.error("Error obteniendo docentes:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("No fue posible cargar los docentes.");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDocentes();
  }, [cargarDocentes]);

  const docentesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return docentes;
    }

    return docentes.filter((docente) => {
      const nombreCompleto =
        `${docente.nombres_compl} ${docente.apellidos_compl}`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        docente.documento
          ?.toLowerCase()
          .includes(texto) ||
        docente.codigo_usuario
          ?.toLowerCase()
          .includes(texto) ||
        docente.correo
          ?.toLowerCase()
          .includes(texto)
      );
    });
  }, [docentes, busqueda]);

  function abrirCrear() {
    setDocenteEditando(null);
    setMostrarFormulario(true);
  }

  function abrirEdicion(docente: Usuario) {
    setDocenteEditando(docente);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setDocenteEditando(null);
  }

  async function manejarGuardado() {
    cerrarFormulario();
    await cargarDocentes();
  }

  async function manejarEliminar(id: number) {
    const docente = docentes.find(
      (item) => item.id_usuario === id,
    );

    const nombre = docente
      ? `${docente.nombres_compl} ${docente.apellidos_compl}`
      : "este docente";

    const confirmar = window.confirm(
      `¿Está seguro de eliminar a ${nombre}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");

      await eliminarUsuario(id);

      await cargarDocentes();
    } catch (error) {
      console.error("Error eliminando docente:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("No fue posible eliminar el docente.");
      }
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Docentes</h1>

          <p>
            Gestiona los docentes registrados en Aprenzy.
          </p>
        </div>

        <button
          type="button"
          className="admin-button-primary"
          onClick={abrirCrear}
        >
          <FiPlus />
          Nuevo docente
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Buscar docente..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="admin-button-secondary"
          onClick={() => void cargarDocentes()}
          disabled={cargando}
        >
          <FiRefreshCw
            className={cargando ? "admin-spin" : ""}
          />

          Actualizar
        </button>
      </div>

      {error && (
        <div className="admin-form-error">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="admin-table-card">
          <div className="admin-empty-state">
            <p>Cargando docentes...</p>
          </div>
        </div>
      ) : (
        <DocenteTable
          docentes={docentesFiltrados}
          onEditar={abrirEdicion}
          onEliminar={manejarEliminar}
        />
      )}

      {mostrarFormulario && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarFormulario();
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h2>
                  {docenteEditando
                    ? "Editar docente"
                    : "Nuevo docente"}
                </h2>

                <p>
                  {docenteEditando
                    ? "Actualiza la información del docente."
                    : "Registra un nuevo docente en el sistema."}
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={cerrarFormulario}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <DocenteForm
              docente={docenteEditando}
              onSuccess={() => void manejarGuardado()}
              onCancel={cerrarFormulario}
            />
          </div>
        </div>
      )}
    </section>
  );
}