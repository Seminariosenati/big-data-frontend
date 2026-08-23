import { Mail, Building2, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Vista de interfaz: el envío real se conectará junto con el backend.
  }

  return (
    <section className="page">
      <span className="eyebrow page-eyebrow">Contacto</span>
      <h1>Hablemos sobre tus datos</h1>
      <p className="page-lead">
        Cuéntanos qué tipo de archivos manejas y qué te gustaría automatizar.
        Este formulario es solo de interfaz por ahora.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="field">
          <label className="field-label" htmlFor="contact-name">Nombre</label>
          <div className="input-wrap">
            <MessageSquare size={16} className="field-icon" />
            <input id="contact-name" className="input-field" placeholder="Tu nombre" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="contact-email">Correo electrónico</label>
          <div className="input-wrap">
            <Mail size={16} className="field-icon" />
            <input id="contact-email" type="email" className="input-field" placeholder="tucorreo@empresa.com" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="contact-company">Empresa</label>
          <div className="input-wrap">
            <Building2 size={16} className="field-icon" />
            <input id="contact-company" className="input-field" placeholder="Nombre de tu empresa" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="contact-message">Mensaje</label>
          <textarea
            id="contact-message"
            className="input-field"
            placeholder="Cuéntanos qué necesitas"
            rows={4}
            style={{ resize: 'vertical', paddingLeft: 14 }}
          />
        </div>

        <button type="submit" className="btn btn-primary">Enviar mensaje</button>
      </form>
    </section>
  )
}
