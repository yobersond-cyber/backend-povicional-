import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { Usuario } from "../../services/usuario";

interface DocenteTableProps {
  docentes: Usuario[];
  onEditar: (docente: Usuario) => void;
  onEliminar: (id: number) => void;
}

export default function DocenteTable({
  docentes,
  onEditar,
  onEliminar,
}: DocenteTableProps) {
  if (docentes.length === 0) {
    return (
      <div className="admin-table-card">
        <div className="admin-empty-state">
          <p>No hay docentes registrados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table-card">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Documento</th>
              <th>Código</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Jornada</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {docentes.map((docente) => (
              <tr key={docente.id_usuario}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">
                      {docente.nombres_compl
                        ?.charAt(0)
                        ?.toUpperCase() ?? "D"}
                    </div>

                    <div>
                      <strong>
                        {docente.nombres_compl}{" "}
                        {docente.apellidos_compl}
                      </strong>

                      <span>
                        ID: {docente.id_usuario}
                      </span>
                    </div>
                  </div>
                </td>

                <td>{docente.documento}</td>

                <td>{docente.codigo_usuario}</td>

                <td>{docente.correo}</td>

                <td>{docente.telefono || "—"}</td>

                <td>{docente.jornada || "—"}</td>

                <td>
                  <div className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-action-button"
                      onClick={() => onEditar(docente)}
                      title="Editar docente"
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      type="button"
                      className="admin-action-button admin-action-danger"
                      onClick={() => onEliminar(docente.id_usuario)}
                      title="Eliminar docente"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}