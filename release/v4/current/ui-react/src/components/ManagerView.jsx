import { useEffect, useState } from 'react'

export default function ManagerView() {
  const [src, setSrc] = useState(null)
  const [ready, setReady] = useState(false)
  const [bridgeIssue, setBridgeIssue] = useState('')

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.bagoElectron : null
    let cancelled = false

    if (!api) {
      setReady(true)
      return () => {
        cancelled = true
      }
    }

    if (typeof api.getManagerUrl !== 'function') {
      setBridgeIssue('Electron está presente, pero window.bagoElectron.getManagerUrl no existe.')
      setReady(true)
      return () => {
        cancelled = true
      }
    }

    api.getManagerUrl()
      .then((url) => {
        if (cancelled) return
        if (url) {
          setSrc(String(url))
          setBridgeIssue('')
        } else {
          setBridgeIssue('Electron respondió sin URL para el gestor.')
        }
      })
      .catch((error) => {
        if (cancelled) return
        setBridgeIssue(error?.message || 'No se pudo resolver la URL del gestor desde Electron.')
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <section className="manager-view manager-state">
        <p>Cargando gestor...</p>
      </section>
    )
  }

  if (bridgeIssue) {
    return (
      <section className="manager-view overlay-placeholder">
        <div className="overlay-placeholder-mark" style={{ background: 'linear-gradient(135deg, var(--danger), var(--orange))' }}>!</div>
        <strong>Gestor de instalaciones no disponible</strong>
        <p>{bridgeIssue}</p>
        <p>El runtime detectó Electron, pero no pudo obtener la URL del gestor.</p>
        <small>Si esto ocurre en la app empaquetada, el bridge IPC está incompleto y no es un simple modo preview.</small>
      </section>
    )
  }

  if (!src) {
    return (
      <section className="manager-view overlay-placeholder">
        <div className="overlay-placeholder-mark">🖥️</div>
        <strong>Gestor de instalaciones</strong>
        <p>Disponible solo desde la aplicación Electron de BAGO.</p>
        <p className="manager-notice-hint">Lanza el .exe para acceder al Gestor, Patch Bay, Releases y más.</p>
        <small>En navegador se mantiene una vista informativa; en Electron debe aparecer el iframe del gestor.</small>
      </section>
    )
  }

  return (
    <section className="manager-view">
      <iframe
        src={src}
        title="BAGO · Gestor de Instalaciones"
        className="manager-frame overlay-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />
    </section>
  )
}
