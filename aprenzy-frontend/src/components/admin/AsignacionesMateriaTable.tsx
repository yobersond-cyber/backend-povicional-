import type { Usuario } from "../../services/usuario";
import type { Materia } from "../../services/materia";
import {
  eliminarDocenteMateria,
  type DocenteMateria,
} from "../../services/asignaciones";

interface Props {
  asignaciones: DocenteMateria[];
  docentes: Usuario[];
  materias: Materia[];
  onCambio: () => void;
}

export default function AsignacionesMateriaTable({
  asignaciones,
  docentes,
  materias,
  onCambio,
}: Props) {
  function obtenerNombreDocente(idUsuario: number) {
    const docente = docentes.find(
      (item) => item.id_usuario === idUsuario,
    );

    if (!docente) {
      return `Usuario #${idUsuario}`;
    }

    return `${docente.nombres_compl} ${docente.apellidos_compl}`;
  }

  function obtenerMateria(idMateria: number) {
    return materias.find(
      (item) => item.id_materia === idMateria,
    );
  }

  async function handleEliminar(
    idDocenteMateria: number,
  ) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta asignación?",
    );

    if (!confirmar) {
      return;
    }

    try {
      await eliminarDocenteMateria(idDocenteMateria);
      onCambio();
    } catch (error) {
      console.error(error);
      window.alert(
        "No fue posible eliminar la asignación.",
      );
    }
  }

  return (
    <div className="admin-table-card">
      <div className="admin-page-header">
        <div>
          <h2>Asignaciones actuales</h2>
          <p>
            Docentes y materias asignadas actualmente.
          </p>
        </div>
      </div>

      {asignaciones.length === 0 ? (
        <p>No existen asignaciones actualmente.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Materia</th>
                <th>Código</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {asignaciones.map((asignacion) => {
                const materia = obtenerMateria(
                  asignacion.id_materia,
                );

                return (
                  <tr key={asignacion.id_docente_materia}>
                    <td>
                      {obtenerNombreDocente(
                        asignacion.id_usuario,
                      )}
                    </td>

                    <td>
                      {materia?.nombre_materia ??
                        `Materia #${asignacion.id_materia}`}
                    </td>

                    <td>
                      {materia?.codigo_materia ?? "-"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-action-button admin-action-delete"
                        onClick={() =>
                          handleEliminar(
                            asignacion.id_docente_materia,
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}   