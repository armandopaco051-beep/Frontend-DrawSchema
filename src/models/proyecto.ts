export type Proyecto = {
  id: number
  nombre: string
  descripcion?: string | null
  creado_en?: string | null
}

export type ProyectoCreate = {
  nombre: string
  descripcion?: string
  usuario_codigo: string
  id_rol: number
}

export type ProyectoUpdate = {
  nombre?: string
  descripcion?: string
}

export type ProyectoMiembro = {
  usuario_codigo: string
  id_proyecto: number
  id_rol: number
}

export type ProyectoFormValues = {
  nombre: string
  descripcion: string
  usuario_codigo: string
  id_rol: number
}

export type MiembroFormValues = {
  usuario_codigo: string
  id_rol: number
}