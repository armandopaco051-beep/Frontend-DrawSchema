import { useEffect, useMemo, useState } from 'react'
import type { Usuario, UsuarioFormValues } from '../models/usuario'
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
} from '../services/usuarioService'

const emptyForm: UsuarioFormValues = {
  codigo: '',
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  pais: '',
  id_rol: 5,
}

export function useUsuariosController() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [formValues, setFormValues] = useState<UsuarioFormValues>(emptyForm)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const filteredUsuarios = useMemo(() => {
    const value = searchTerm.trim().toLowerCase()

    if (!value) {
      return usuarios
    }

    return usuarios.filter((usuario) => {
      return (
        usuario.codigo.toLowerCase().includes(value) ||
        usuario.email.toLowerCase().includes(value) ||
        usuario.nombres.toLowerCase().includes(value) ||
        usuario.apellidos.toLowerCase().includes(value)
      )
    })
  }, [searchTerm, usuarios])

  async function loadUsuarios() {
    setIsLoading(true)
    setError('')

    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : 'No se pudieron cargar usuarios'
      setError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  function updateFormValue(name: keyof UsuarioFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: name === 'id_rol' ? Number(value) : value,
    }))
  }

  function selectUsuario(usuario: Usuario) {
    setSelectedUser(usuario)
    setMessage('')
    setError('')
    setFormValues({
      codigo: usuario.codigo,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: '',
      pais: usuario.pais,
      id_rol: usuario.id_rol,
    })
  }

  function resetForm() {
    setSelectedUser(null)
    setFormValues(emptyForm)
    setMessage('')
    setError('')
  }

  async function saveUsuario() {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      if (selectedUser) {
        const { codigo, password, ...values } = formValues
        const payload = password ? { ...values, password } : values
        await actualizarUsuario(codigo, payload)
        setMessage('Usuario actualizado correctamente.')
      } else {
        await crearUsuario(formValues)
        setMessage('Usuario creado correctamente.')
      }

      await loadUsuarios()
      resetForm()
    } catch (saveError) {
      const detail = saveError instanceof Error ? saveError.message : 'No se pudo guardar el usuario'
      setError(detail)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeUsuario(usuario: Usuario) {
    const confirmed = window.confirm(`Eliminar usuario ${usuario.codigo}?`)

    if (!confirmed) {
      return
    }

    setMessage('')
    setError('')

    try {
      await eliminarUsuario(usuario.codigo)
      setMessage('Usuario eliminado correctamente.')
      await loadUsuarios()

      if (selectedUser?.codigo === usuario.codigo) {
        resetForm()
      }
    } catch (deleteError) {
      const detail = deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el usuario'
      setError(detail)
    }
  }

  return {
    error,
    filteredUsuarios,
    formValues,
    isLoading,
    isSaving,
    message,
    searchTerm,
    selectedUser,
    loadUsuarios,
    removeUsuario,
    resetForm,
    saveUsuario,
    selectUsuario,
    setSearchTerm,
    updateFormValue,
  }
}
