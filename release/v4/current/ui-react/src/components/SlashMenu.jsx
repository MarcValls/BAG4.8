import { useMemo } from 'react'

function run(control, command) {
  void control.submit(command, control.mode)
}

export default function SlashMenu({ control, menu, context }) {
  const centers = menu?.centros_operativos || menu?.centers || []
  const directCommands = menu?.comandos_directos_disponibles || []
  const selected = menu?.elemento_seleccionado || menu?.selected_item || ''
  const activeCenter = menu?.centro_activo || menu?.active_center || ''
  const visibleSections = menu?.secciones_visibles || menu?.visible_sections || centers.map((center) => center.center_id)
  const visibleCommands = useMemo(() => {
    const source = directCommands.length ? directCommands : (menu?.acciones_permitidas || [])
    return [...new Set(source)].slice(0, 8)
  }, [directCommands, menu])

  return (
    <aside className="utility-popover" aria-label="Acciones rápidas">
      <div className="utility-head">
        <strong>Acciones rápidas</strong>
        <span>
          {context?.viewLabel
            ? `Gestor: ${context.viewLabel}`
            : `${centers.length} centros · ${visibleSections.length} visibles`}
        </span>
      </div>

      <div className="utility-actions">
        {visibleCommands.map((command) => (
          <button
            key={command}
            type="button"
            onClick={() => run(control, command)}
            disabled={control.busy}
            aria-label={`Ejecutar ${command}`}
            title={selected ? `Aplica sobre ${selected}` : command}
          >
            {command}
          </button>
        ))}
      </div>

      {selected ? <p>Selección: {selected}</p> : null}
      {activeCenter ? <p>Centro activo: {activeCenter}</p> : null}
      {context?.installations != null ? (
        <p>{context.installations} instalaciones · {context.pieces ?? '?'} piezas en el gestor activo.</p>
      ) : null}
      {centers.length ? (
        <p>{centers.map((center) => center.nombre || center.center_id).join(' · ')}</p>
      ) : null}
    </aside>
  )
}
