import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  GitBranch,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Moon,
  User,
  Sparkles,
  Sun,
  UsersRound,
} from 'lucide-react'
import { loginUser } from './services/authService'
import { crearUsuario } from './services/usuarioService'
import './LoginPage.css'

type LoginPageProps = {
  theme: 'dark' | 'light'
  onBack: () => void
  onToggleTheme: () => void
  onLoginSuccess: (token: string) => void
}

const pageAnimation = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const leftPanelAnimation = {
  hidden: { opacity: 0, x: -34 },
  visible: { opacity: 1, x: 0 },
}

const formAnimation = {
  hidden: { opacity: 0, x: 34 },
  visible: { opacity: 1, x: 0 },
}

const formItemAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const STUDENT_ROLE_ID = 5

function LoginPage({ theme, onBack, onLoginSuccess, onToggleTheme }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [codigo, setCodigo] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [pais, setPais] = useState('Bolivia')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      if (mode === 'register') {
        await crearUsuario({
          codigo,
          nombres,
          apellidos,
          email,
          password,
          pais,
          id_rol: STUDENT_ROLE_ID,
        })

        setSuccessMessage('Usuario creado correctamente. Ya puedes iniciar sesion.')
        setMode('login')
        setPassword('')
        return
      }

      const response = await loginUser({ email, password })

      localStorage.setItem('token', response.access_token)
      onLoginSuccess(response.access_token)
      setSuccessMessage('Sesion iniciada correctamente.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesion'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setErrorMessage('')
    setSuccessMessage('')
    setShowPassword(false)
  }

  return (
    <motion.main
      animate="visible"
      className={`login-page ${theme === 'light' ? 'login-page-light' : ''}`}
      initial="hidden"
      transition={{ duration: 0.45, ease: 'easeOut' }}
      variants={pageAnimation}
    >
      <button
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="login-theme-toggle"
        onClick={onToggleTheme}
        type="button"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.section
        className="login-info"
        transition={{ duration: 0.6, ease: 'easeOut' }}
        variants={leftPanelAnimation}
      >
        <div className="login-ambient login-ambient-one"></div>
        <div className="login-ambient login-ambient-two"></div>

        <motion.button
          className="login-back"
          onClick={onBack}
          type="button"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft size={16} /> Volver
        </motion.button>

        <div>
          <motion.p className="login-pill" variants={formItemAnimation}>
            <Sparkles size={14} /> built for thinking together
          </motion.p>

          <motion.h1 variants={formItemAnimation}>
            Tu base de datos,
            <br />
            pensada en equipo.
          </motion.h1>

          <motion.p className="login-description" variants={formItemAnimation}>
            Disena esquemas complejos con claridad. Conecta ideas, ordena
            decisiones y convierte diagramas en productos reales.
          </motion.p>
        </div>

        <motion.div
          animate={{ y: [0, -8, 0] }}
          className="login-preview-card"
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div>
            <Database size={18} />
            <strong>product_schema</strong>
          </div>
          <span>users → projects → tasks</span>
        </motion.div>

        <motion.p className="login-stats" variants={formItemAnimation}>
          <UsersRound size={16} /> 4,280 equipos disenando mejor
        </motion.p>
      </motion.section>

      <motion.section
        className="login-form-section"
        transition={{ duration: 0.6, ease: 'easeOut' }}
        variants={formAnimation}
      >
        <motion.form
          className="login-form"
          onSubmit={handleSubmit}
          transition={{ staggerChildren: 0.08, delayChildren: 0.14 }}
          variants={{
            hidden: {},
            visible: {},
          }}
        >
          <motion.div className="login-logo" variants={formItemAnimation}>
            <GitBranch size={19} />
          </motion.div>

          <motion.p className="login-kicker" variants={formItemAnimation}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </motion.p>

          <motion.h2 variants={formItemAnimation}>
            {mode === 'login' ? 'Inicia sesion' : 'Crea tu usuario'}
          </motion.h2>

          <motion.p className="login-subtitle" variants={formItemAnimation}>
            {mode === 'login'
              ? 'Continua donde dejaste tu proyecto.'
              : 'Completa tus datos para entrar al workspace.'}
          </motion.p>

          {mode === 'register' ? (
            <>
              <motion.label
                className={codigo ? 'floating-field has-value' : 'floating-field'}
                variants={formItemAnimation}
              >
                <User className="field-icon" size={18} />
                <input
                  onChange={(event) => setCodigo(event.target.value)}
                  placeholder=" "
                  required
                  value={codigo}
                />
                <span>Codigo</span>
              </motion.label>

              <div className="login-form-row">
                <motion.label
                  className={nombres ? 'floating-field has-value' : 'floating-field'}
                  variants={formItemAnimation}
                >
                  <User className="field-icon" size={18} />
                  <input
                    onChange={(event) => setNombres(event.target.value)}
                    placeholder=" "
                    required
                    value={nombres}
                  />
                  <span>Nombres</span>
                </motion.label>

                <motion.label
                  className={apellidos ? 'floating-field has-value' : 'floating-field'}
                  variants={formItemAnimation}
                >
                  <User className="field-icon" size={18} />
                  <input
                    onChange={(event) => setApellidos(event.target.value)}
                    placeholder=" "
                    required
                    value={apellidos}
                  />
                  <span>Apellidos</span>
                </motion.label>
              </div>
            </>
          ) : null}

          <motion.label
            className={email ? 'floating-field has-value' : 'floating-field'}
            variants={formItemAnimation}
          >
            <Mail className="field-icon" size={18} />
            <input
              onChange={(event) => setEmail(event.target.value)}
              placeholder=" "
              required
              type="email"
              value={email}
            />
            <span>Email</span>
          </motion.label>

          <motion.label
            className={password ? 'floating-field has-value' : 'floating-field'}
            variants={formItemAnimation}
          >
            <Lock className="field-icon" size={18} />
            <input
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder=" "
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <span>Contrasena</span>
            <button
              aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </motion.label>

          {mode === 'register' ? (
            <motion.label
              className={pais ? 'floating-field has-value' : 'floating-field'}
              variants={formItemAnimation}
            >
              <MapPin className="field-icon" size={18} />
              <input
                onChange={(event) => setPais(event.target.value)}
                placeholder=" "
                required
                value={pais}
              />
              <span>Pais</span>
            </motion.label>
          ) : null}

          {errorMessage ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="login-message login-message-error"
              initial={{ opacity: 0, y: 8 }}
            >
              {errorMessage}
            </motion.p>
          ) : null}
          {successMessage ? (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="login-message login-message-success"
              initial={{ opacity: 0, y: 8 }}
            >
              {successMessage}
            </motion.p>
          ) : null}

          <motion.button
            className="login-submit"
            disabled={isLoading}
            type="submit"
            variants={formItemAnimation}
            whileHover={isLoading ? undefined : { y: -3, scale: 1.01 }}
            whileTap={isLoading ? undefined : { scale: 0.98 }}
          >
            {isLoading ? (
              <>
                {mode === 'login' ? 'Entrando...' : 'Creando...'}{' '}
                <Loader2 className="loading-icon" size={18} />
              </>
            ) : (
              <>
                {mode === 'login' ? 'Entrar al workspace' : 'Crear usuario'}{' '}
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>

          <motion.p className="login-terms" variants={formItemAnimation}>
            Al continuar aceptas nuestros terminos, condiciones y politica de privacidad.
          </motion.p>

          <motion.p className="login-register" variants={formItemAnimation}>
            {mode === 'login' ? 'No tienes cuenta? ' : 'Ya tienes cuenta? '}
            <button
              className="mode-switch"
              onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
              type="button"
            >
              {mode === 'login' ? 'Registrate' : 'Inicia sesion'}
            </button>
          </motion.p>
        </motion.form>
      </motion.section>
    </motion.main>
  )
}

export default LoginPage
