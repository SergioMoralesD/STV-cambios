import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MenuButton from '../../Components/MenuButton/menuButton'
import { useAuth } from '../../Context/AuthContext'
import { remoteLog } from '../../utils/logger'
import './login.css'

// Configuración global de axios para permitir cookies en todas las peticiones
axios.defaults.withCredentials = true;

const Login = () => {
  const navigate = useNavigate();
  const { checkAuth, user, loading, logoutAll } = useAuth();
  const [showActiveSessionPrompt, setShowActiveSessionPrompt] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoginSuccessRef = useRef(false);
  const [pendingUser, setPendingUser] = useState<{ usuario: string, pass: string } | null>(null);

  useEffect(() => {
    if (!loading && user && !isLoginSuccessRef.current) {
      navigate('/hub', { replace: true });
    }
  }, [user, loading, navigate]);
  const [userValue, setUserValue] = useState<string>("");
  const [userPlaceholder, setUserPlaceholder] = useState<string>("Usuario");
  const [passValue, setPassValue] = useState<string>("");
  const [passPlaceholder, setPassPlaceholder] = useState<string>("Contraseña");

  const [animateUser, setAnimateUser] = useState(false);
  const [animatePass, setAnimatePass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimerRef = useRef<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const activeTimeoutRef = useRef<number | null>(null);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const isUserError = userPlaceholder !== "Usuario";
  const isPassError = passPlaceholder !== "Contraseña";

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorMsg(null);
      errorTimerRef.current = null;
    }, 8000);
  };

  const manejarInicio = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    activarBoton();

    const userEmpty = !userValue.trim();
    const passEmpty = !passValue.trim();

    if (userEmpty || passEmpty) {
      if (userEmpty) {
        setUserPlaceholder("Usuario no puede estar vacío");
        activarAnimacion(setAnimateUser);
      }
      if (passEmpty) {
        setPassPlaceholder("Contraseña no puede estar vacía");
        activarAnimacion(setAnimatePass);
      }

      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);

      timeoutRef.current = setTimeout(() => {
        setUserPlaceholder('Usuario');
        setPassPlaceholder('Contraseña');
        timeoutRef.current = null;
      }, 30000);
    } else {
      try {
        // 1. Petición de login
        await axios.post('/auth/login', {
          usuario: userValue,
          password: passValue
        }, { withCredentials: true });

        // 2. Marcar éxito para evitar el prompt en el re-render provocado por checkAuth
        isLoginSuccessRef.current = true;

        // 3. Actualizar estado global y navegar
        await checkAuth();
        navigate('/hub', { replace: true });

      } catch (error: any) {
        remoteLog(`Error en login: ${error.response?.data?.message || error.message}`, { level: 'ERROR' });

        if (error.response?.data?.message === 'SESSION_ALREADY_ACTIVE') {
          setPendingUser({ usuario: userValue, pass: passValue });
          setShowActiveSessionPrompt(true);
        } else if (error.response?.status === 429) {
          showError('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.');
          activarAnimacion(setAnimateUser);
          activarAnimacion(setAnimatePass);
        } else {
          showError('Usuario o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.');
          activarAnimacion(setAnimateUser);
          activarAnimacion(setAnimatePass);

          timeoutRef.current = setTimeout(() => {
            setUserPlaceholder('Usuario');
            timeoutRef.current = null;
          }, 30000);
        }
      } finally {
        isSubmittingRef.current = false;
      }
    }
  }

  const handleContinue = () => {
    navigate('/hub', { replace: true });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // Si estamos logueados (user != null), usamos logoutAll normal
      if (user) {
        await logoutAll();
        setShowActiveSessionPrompt(false);
        setUserValue("");
        setPassValue("");
      }
      // Si NO estamos logueados pero hay un login pendiente (SESSION_ALREADY_ACTIVE)
      else if (pendingUser) {
        await axios.post('/auth/login', {
          usuario: pendingUser.usuario,
          password: pendingUser.pass,
          force: true
        }, { withCredentials: true });

        await checkAuth();
        isLoginSuccessRef.current = true;
        navigate('/hub', { replace: true });
      }
    } catch (error) {
      remoteLog(`Error al cerrar sesiones: ${error}`, { level: 'ERROR' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const activarAnimacion = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    setTimeout(() => {
      setter(false);
    }, 400);
  }

  const activarBoton = () => {
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);

    setIsButtonActive(true);
    activeTimeoutRef.current = setTimeout(() => {
      setIsButtonActive(false);
      activeTimeoutRef.current = null;
    }, 150)
  };

  const dismissError = () => {
    setErrorMsg(null);
    if (errorTimerRef.current) { clearTimeout(errorTimerRef.current); errorTimerRef.current = null; }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserValue(e.target.value);
    if (isUserError) {
      setUserPlaceholder("Usuario");

      if (!isPassError && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.repeat) {
      e.preventDefault();
    }
  }

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassValue(e.target.value);
    if (isPassError) {
      setPassPlaceholder("Contraseña");

      if (!isUserError && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }

  /* RENDER */
  if (showActiveSessionPrompt && (user || pendingUser)) {
    const displayUser = user?.usuario || pendingUser?.usuario;
    return (
      <div className="login-container prompt-container">
        <h1 id="login-title" style={{ borderBottom: 'none', marginBottom: '2rem' }}>
          Sesión activa: <strong>{displayUser}</strong>
        </h1>
        <div className="prompt-actions">
          {user && <MenuButton texto='Continuar en esta sesión' onClick={handleContinue} tipo='button' className={isLoggingOut ? 'disabled' : ''} />}
          <button
            type="button"
            className={`logout-secondary-btn-cerrar ${isLoggingOut ? 'disabled' : ''}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Cerrando...' : 'Cerrar sesiones activas'}
          </button>
          {!user && <button type="button" className="logout-secondary-btn" onClick={() => setShowActiveSessionPrompt(false)}>Volver al login</button>}
        </div>
      </div>
    );
  }

  return (
    <form className="login-container" onSubmit={manejarInicio} onKeyDown={handleKeyDown} method="post">

      <h1 id="login-title">Inicio de sesión</h1>

      <div className={`input-group ${userValue || userFocused ? 'focused' : ''} ${isUserError ? 'error' : ''}`}>
        <label htmlFor="username" className={`floating-label ${animateUser ? 'shake' : ''}`}>
          {isUserError ? userPlaceholder : "Usuario"}
        </label>
        <input
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          maxLength={32}
          className={`login-input ${animateUser ? 'shake' : ''}`}
          value={userValue}
          onChange={handleUserChange}
          onFocus={() => setUserFocused(true)}
          onBlur={() => setUserFocused(false)}
          autoFocus
          aria-required="true"
          aria-invalid={isUserError}
        />
      </div>

      <div className={`input-group ${passValue || passFocused ? 'focused' : ''} ${isPassError ? 'error' : ''}`}>
        <label htmlFor="current-password" className={`floating-label ${animatePass ? 'shake' : ''}`}>
          {isPassError ? passPlaceholder : "Contraseña"}
        </label>
        <input
          id="current-password"
          type="password"
          name="current-password"
          autoComplete="current-password"
          maxLength={25}
          className={`login-input ${animatePass ? 'shake' : ''}`}
          value={passValue}
          onChange={handlePassChange}
          onFocus={() => setPassFocused(true)}
          onBlur={() => setPassFocused(false)}
          aria-required="true"
          aria-invalid={isPassError}
        />
      </div>

      {errorMsg && (
        <div className="login-error-banner" role="alert">
          <span className="login-error-icon">⚠️</span>
          <span className="login-error-text">{errorMsg}</span>
          <button type="button" className="login-error-dismiss" onClick={dismissError} aria-label="Cerrar">✕</button>
        </div>
      )}

      <div className="text-section">
        <a className="menu-link" href="https://www.google.com/">¿Olvidaste tú contraseña?</a>
      </div>
      <MenuButton texto='Iniciar sesión' tipo='submit' className={isButtonActive ? 'active' : ''} />
    </form>
  )
}

export default Login

  