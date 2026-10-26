import {
  FiEdit2,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

import type {
  Estudiante,
} from "../../services/usuario";

interface EstudianteTableProps {
  estudiantes: Estudiante[];

  onEditar: (
    estudiante: Estudiante,
  ) => void;

  onEliminar: (
    estudiante: Estudiante,
  ) => void;
}

export default function EstudianteTable({
  estudiantes,
  onEditar,
  onEliminar,
}: EstudianteTableProps) {
  if (estudiantes.length === 0) {
    return (
      <div className="admin-empty">
        <FiUser />

        <h3>
          No hay estudiantes
        </h3>

        <p>
          No se encontraron
          estudiantes que coincidan
          con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-table-card">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                Estudiante
              </th>

              <th>
                Código
              </th>

              <th>
                Documento
              </th>

              <th>
                Correo
              </th>

              <th>
                Jornada
              </th>

              <th>
                Incapacidades
              </th>

              <th>
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {estudiantes.map(
              (estudiante) => (
                <tr
                  key={
                    estudiante.id_usuario
                  }
                >
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">
                        <FiUser />
                      </div>

                      <div>
                        <strong>
                          {
                            estudiante.nombres_compl
                          }{" "}
                          {
                            estudiante.apellidos_compl
                          }
                        </strong>

                        <span>
                          {
                            estudiante.telefono
                          }
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {
                      estudiante.codigo_usuario
                    }
                  </td>

                  <td>
                    {
                      estudiante.documento
                    }
                  </td>

                  <td>
                    {
                      estudiante.correo
                    }
                  </td>

                  <td>
                    {
                      estudiante.jornada ??
                      "No definida"
                    }
                  </td>

                  <td>
                    <span className="admin-count-badge">
                      {
                        estudiante
                          .incapacidades
                          .length
                      }
                    </span>
                  </td>

                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-action-button"
                        title="Editar estudiante"
                        onClick={() =>
                          onEditar(
                            estudiante,
                          )
                        }
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        className="admin-action-button admin-action-danger"
                        title="Eliminar estudiante"
                        onClick={() =>
                          onEliminar(
                            estudiante,
                          )
                        }
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}