import { Pencil, Trash2 } from 'lucide-react'
import type { Usuario } from '../../models/usuario'

type UsuariosTableProps = {
  usuarios: Usuario[]
  onDelete: (usuario: Usuario) => void
  onEdit: (usuario: Usuario) => void
}

export function UsuariosTable({ usuarios, onDelete, onEdit }: UsuariosTableProps) {
  return (
    <div className="users-table-wrap">
      <table className="users-table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Pais</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.codigo}>
              <td>{usuario.codigo}</td>
              <td>
                {usuario.nombres} {usuario.apellidos}
              </td>
              <td>{usuario.email}</td>
              <td>{usuario.pais}</td>
              <td>{usuario.id_rol}</td>
              <td>
                <div className="table-actions">
                  <button className="icon-button" onClick={() => onEdit(usuario)} type="button">
                    <Pencil size={16} />
                  </button>
                  <button className="icon-button danger" onClick={() => onDelete(usuario)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {usuarios.length === 0 ? (
        <div className="empty-state">No hay usuarios para mostrar.</div>
      ) : null}
    </div>
  )
}
