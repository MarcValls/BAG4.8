import ComposeBar from './ComposeBar'

function commandLines(entry) {
  const message = entry.response?.message || entry.response?.action || '(sin salida)'
  return String(message).split('\n').filter(Boolean)
}

export default function TerminalView({ control }) {
  const commandLog = [...control.commandLog].reverse()

  return (
    <section className="terminal-view">
      <header className="terminal-head">
        <div>
          <h1>Terminal</h1>
          <p>Comandos e historial de la sesión activa.</p>
        </div>
        <span>
          {control.session?.provider || 'sin provider'} / {control.session?.model || 'sin modelo'}
          {' · '}
          {control.session?.framework_root || 'sin framework'}
          {' · '}
          {control.session?.project_root || 'sin proyecto'}
          {' · '}
          {control.session?.workspace_state_root || 'sin workspace'}
          {' · '}
          {control.session?.workspace_scope_root || 'sin scope'}
          {' · '}
          {control.session?.workspace_state?.state || control.session?.status?.workspace_state?.state || control.session?.status?.workspace_state || 'unknown'}
          {' · '}
          {control.session?.binding_confirmed ? 'Contexto vinculado' : 'Contexto pendiente'}
        </span>
      </header>

      <div className="terminal-output">
        {control.history.map((item, index) => (
          <div key={`${item.role}-${index}`} className="terminal-line">
            <strong>{item.role}&gt;</strong>
            <span>{item.content}</span>
          </div>
        ))}
        {commandLog.map((entry) => (
          <div key={entry.id} className="terminal-command">
            <div className="terminal-line"><strong>cmd&gt;</strong><span>{entry.command}</span></div>
            {commandLines(entry).map((line, index) => (
              <div key={`${entry.id}-${index}`} className="terminal-line muted"><strong>out&gt;</strong><span>{line}</span></div>
            ))}
          </div>
        ))}
        {!control.history.length && !commandLog.length ? <div className="terminal-empty">Sin actividad todavía.</div> : null}
      </div>

      <div className="terminal-composer">
        <ComposeBar busy={control.busy} onSubmit={(value) => control.submit(value, 'terminal')} placeholder="Mensaje o /comando" />
      </div>
    </section>
  )
}
