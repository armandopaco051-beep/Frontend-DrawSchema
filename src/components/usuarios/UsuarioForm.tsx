import type { FormEvent } from 'react'
import { Save } from 'lucide-react'
import type { Usuario, UsuarioFormValues } from '../../models/usuario'

type UsuarioFormProps = {
  formValues: UsuarioFormValues
  isSaving: boolean
  selectedUser: Usuario | null
  onChange: (name: keyof UsuarioFormValues, value: string) => void
  onSubmit: () => void
}

export function UsuarioForm({
  formValues,
  isSaving,
  selectedUser,
  onChange,
  onSubmit,
}: UsuarioFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="users-form" onSubmit={handleSubmit}>
      <div className="panel-title">
        <div>
          <p>{selectedUser ? 'Editar usuario' : 'Nuevo usuario'}</p>
          <h2>{selectedUser ? selectedUser.codigo : 'Crear cuenta'}</h2>
          <small>
            {selectedUser
              ? 'Actualiza solo los datos que necesites cambiar.'
              : 'Registra una cuenta con rol de estudiante por defecto.'}
          </small>
        </div>
        {!selectedUser ? <span className="form-badge">Rol estudiante</span> : null}
      </div>

      <div className="form-row two-columns">
        <label>
          Codigo
          <input
            disabled={Boolean(selectedUser)}
            onChange={(event) => onChange('codigo', event.target.value)}
            placeholder="U001"
            required
            value={formValues.codigo}
          />
        </label>

        <label>
          Rol
          <input
            min="1"
            onChange={(event) => onChange('id_rol', event.target.value)}
            required
            type="number"
            value={formValues.id_rol}
          />
        </label>
      </div>

      <div className="form-row two-columns">
        <label>
          Nombres
          <input
            onChange={(event) => onChange('nombres', event.target.value)}
            placeholder="Armando"
            required
            value={formValues.nombres}
          />
        </label>

        <label>
          Apellidos
          <input
            onChange={(event) => onChange('apellidos', event.target.value)}
            placeholder="Mamani"
            required
            value={formValues.apellidos}
          />
        </label>
      </div>

      <label>
        Email
        <input
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="armando@gmail.com"
          required
          type="email"
          value={formValues.email}
        />
      </label>

      <label>
        Password
        <input
          minLength={selectedUser ? undefined : 6}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder={selectedUser ? 'Dejar vacio para no cambiar' : '123456'}
          required={!selectedUser}
          type="password"
          value={formValues.password}
        />
      </label>

      <div className="form-row country-row">
        <label>
          Pais
          <input
            onChange={(event) => onChange('pais', event.target.value)}
            placeholder="Bolivia"
            required
            value={formValues.pais}
          />
        </label>
      </div>

      <button className="primary-action" disabled={isSaving} type="submit">
        <Save size={18} />
        {isSaving ? 'Guardando...' : selectedUser ? 'Guardar cambios' : 'Crear usuario'}
      </button>
    </form>
  )
}
