import { Link } from 'react-router-dom'
import { Database } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link to="/" className="brand">
              <span className="brand-mark">
                <Database size={17} strokeWidth={2.3} />
              </span>
              Datalume
            </Link>
            <p>
              Plataforma para cargar, limpiar y visualizar datos empresariales
              en un solo lugar. Esta es una vista de interfaz; la conexión con
              el backend llegará en la siguiente etapa.
            </p>
          </div>

          <div className="footer-col">
            <h4>Producto</h4>
            <ul>
              <li><Link to="/servicios">Servicios</Link></li>
              <li><Link to="login">Iniciar sesión</Link></li>
              <li><Link to="/login?modo=crear">Crear cuenta</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Compañía</h4>
            <ul>
              <li><Link to="/nosotros">Nosotros</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Términos de uso</a></li>
              <li><a href="#">Privacidad</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Datalume. Todos los derechos reservados.</span>
          <span>Hecho para equipos que trabajan con datos.</span>
        </div>
      </div>
    </footer>
  )
}
