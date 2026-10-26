import { useEffect, useState } from "react";
import type { Usuario } from "../services/usuario";
import { obtenerDocentes } from "../services/usuario";
import {
  obtenerAsignacionesDocenteMateria,
  type DocenteMateria,
} from "../services/asignaciones";
import { obtenerMaterias, type Materia } from "../services/materia";

import AsignarMateriaForm from "../components/admin/AsignarMateriaForm";
import AsignacionesMateriaTable from "../components/admin/AsignacionesMateriaTable";

export default function AsignarMaterias() {
  const [docentes, setDocentes] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [asignaciones, setAsignaciones] = useState<
    DocenteMateria[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [
        docentesData,
        materiasData,
        asignacionesData,
      ] = await Promise.all([
        obtenerDocentes(),
        obtenerMaterias(),
        obtenerAsignacionesDocenteMateria(),
      ]);

      setDocentes(docentesData);
      setMaterias(materiasData);
      setAsignaciones(asignacionesData);
    } catch (err) {
      console.error(err);
      setError(
        "No fue posible cargar la información de asignaciones.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="admin-page">
        <p>Cargando asignaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error}</div>

        <button
          type="button"
          className="admin-button-primary"
          onClick={cargarDatos}
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Asignación de materias</h1>
          <p>
            Gestiona las materias asignadas a los docentes.
          </p>
        </div>
      </div>

      <AsignarMateriaForm
        docentes={docentes}
        onAsignacionCreada={cargarDatos}
      />

      <AsignacionesMateriaTable
        asignaciones={asignaciones}
        docentes={docentes}
        materias={materias}
        onCambio={cargarDatos}
      />
    </div>
  );
}