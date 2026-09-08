export type Usuario = {
  codigo: string
  nombres: string
  apellidos: string
  email: string
  pais: string
  id_rol: number
}

export type UsuarioCreate = Usuario & {
  password: string
}

export type UsuarioUpdate = Partial<UsuarioCreate>

export type UsuarioFormValues = UsuarioCreate
