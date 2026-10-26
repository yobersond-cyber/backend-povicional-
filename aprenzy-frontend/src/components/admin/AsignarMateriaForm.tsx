import { useEffect, useState } from "react";
import type { Usuario } from "../../services/usuario";
import {
  asignarDocenteMateria,
  obtenerAsignacionesDocenteMateria,
  type DocenteMateria,
} from "../../services/asignaciones";
import { obtenerMaterias, type Materia } from "../../services/materia";

interface Props {
  docentes: Usuario[];
  onAsignacionCreada?: () => void;
}

export default function AsignarMateriaForm({
  docentes,
  onAsignacionCreada,
}: Props) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [asignaciones, setAsignaciones] = useState<DocenteMateria[]>([]);

  const [idDocente, setIdDocente] = useState("");
  const [idMateria, setIdMateria] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [materiasData, asignacionesData] = await Promise.all([
        obtenerMaterias(),
        obtenerAsignacionesDocenteMateria(),
      ]);

      setMaterias(materiasData);
      setAsignaciones(asignacionesData);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar las materias y asignaciones.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function handleAsignar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!idDocente || !idMateria) {
      setError("Selecciona un docente y una materia.");
      return;
    }

    const yaAsignada = asignaciones.some(
      (asignacion) =>
        asignacion.id_usuario === Number(idDocente) &&
        asignacion.id_materia === Number(idMateria),
    );

    if (yaAsignada) {
      setError("Este docente ya está asignado a esta materia.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await asignarDocenteMateria({
        id_usuario: Number(idDocente),
        id_materia: Number(idMateria),
      });

      setIdMateria("");

      await cargarDatos();

      onAsignacionCreada?.();
    } catch (err) {
      console.error(err);
      setError("No fue posible realizar la asignación.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <p>Cargando materias...</p>;
  }

  return (
    <div className="admin-table-card">
      <div className="admin-page-header">
        <div>
          <h2>Asignar materia a docente</h2>
          <p>
            Selecciona un docente y una materia para crear la asignación.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <form className="admin-form" onSubmit={handleAsignar}>
        <div className="admin-form-grid">
          <div>
            <label htmlFor="docente">Docente</label>

            <select
              id="docente"
              value={idDocente}
              onChange={(event) => setIdDocente(event.target.value)}
            >
              <option value="">Seleccionar docente</option>

              {docentes.map((docente) => (
                <option
                  key={docente.id_usuario}
                  value={docente.id_usuario}
                >
                  {docente.nombres_compl} {docente.apellidos_compl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="materia">Materia</label>

            <select
              id="materia"
              value={idMateria}
              onChange={(event) => setIdMateria(event.target.value)}
            >
              <option value="">Seleccionar materia</option>

              {materias.map((materia) => (
                <option
                  key={materia.id_materia}
                  value={materia.id_materia}
                >
                  {materia.codigo_materia} - {materia.nombre_materia}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-button-primary"
            disabled={guardando}
          >
            {guardando ? "Asignando..." : "Asignar materia"}
          </button>
        </div>
      </form>
    </div>
  );
}