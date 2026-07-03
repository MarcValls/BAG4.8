/**
 * Contratos de frontera de BAGO Manager React.
 *
 * Este archivo no contiene datos de ejemplo. Documenta la forma mínima que
 * debe exponer el backend compartido por Terminal y React.
 */

export const UI_CONTRACT_VERSION = 'bago.ui/v1';
export const COMMAND_CONTRACT_VERSION = 'bago.command/v1';
export const SURFACE_ID = 'manager';

export const EXECUTION_STATES = Object.freeze([
  'pending',
  'running',
  'done',
  'failed',
  'blocked',
]);

export const PRESENTATION_STATES = Object.freeze([
  'unknown',
  'loading',
  'degraded',
  'error',
  'confirmed',
]);

/**
 * @typedef {'unknown'|'loading'|'degraded'|'error'|'confirmed'} PresentationState
 * @typedef {'pending'|'running'|'done'|'failed'|'blocked'} ExecutionState
 * @typedef {'status'|'boolean'|'number'|'percentage'|'metric'|'identifier'|'path'|'list'|'object'|'text'|'long-text'} DataPresentation
 *
 * @typedef {Object} DataDescriptor
 * @property {string=} id
 * @property {string} label
 * @property {unknown} value
 * @property {string=} classification Unidad o clasificación heredada.
 * @property {DataPresentation=} presentation Sugerencia visual cerrada; el frontend conserva la decisión final.
 * @property {'positive'|'negative'=} polarity Indica si un valor alto es favorable o desfavorable.
 * @property {string=} semantic_role Resultado, diagnóstico, evidencia, restricción o metadato.
 * @property {string=} help Explicación breve y no redundante.
 *
 * @typedef {Object} CenterAction
 * @property {string} command_id Identificador canónico, compartido con Terminal.
 * @property {string} label Etiqueta de presentación suministrada por backend.
 * @property {string=} description
 * @property {string=} contract_id Contrato que ejecutará la acción.
 * @property {'primary'|'normal'|'danger'=} emphasis
 * @property {boolean=} modifies_state
 * @property {boolean=} requires_approval
 * @property {string=} approval_id
 * @property {boolean=} enabled
 * @property {string=} blocked_reason
 * @property {Object<string, unknown>=} arguments_schema
 *
 * @typedef {Object} CenterState
 * @property {string=} center_id
 * @property {string|number=} state_revision
 * @property {PresentationState|ExecutionState} status
 * @property {string=} summary
 * @property {Object<string, unknown>=} active_entity
 * @property {Array<DataDescriptor|{label:string,value:string|number|null,classification?:string}>=} metrics
 * @property {Array<{id?:string,label:string,description?:string,status?:string}>=} items
 * @property {CenterAction[]=} recommended_actions
 * @property {CenterAction[]=} available_actions
 * @property {CenterAction[]=} blocked_actions
 * @property {Array<Object>=} recent_activity
 * @property {Array<Object>=} evidence_refs
 * @property {Array<Object|string>=} warnings
 * @property {Object<string, unknown>=} detail
 *
 * @typedef {Object} BagoUiSnapshot
 * @property {string} contract_version
 * @property {string|number=} state_revision
 * @property {string|number=} source_revision
 * @property {string=} generated_at
 * @property {{status:PresentationState, backend_version?:string, bridge?:string, error?:Object}=} connection
 * @property {{framework_version?:string,framework_root?:string,project_root?:string,workspace_id?:string,workspace_root?:string,workspace_scope_root?:string,session_id?:string,context_revision?:string|number}=} authorities
 * @property {{status?:PresentationState|ExecutionState,objective?:string,decisions?:string[],restrictions?:string[],next_step?:string,active_execution?:Object}=} task
 * @property {{status?:PresentationState,session_id?:string,persisted?:boolean,last_saved_at?:string,linked?:boolean}=} session
 * @property {{status?:PresentationState|ExecutionState,summary?:string,current_iteration?:string,roadmap_version?:string,iterations?:Array<Object>,detail?:Object}=} roadmap
 * @property {{status?:PresentationState,state?:string,manifest_status?:string,index_status?:string}=} workspace
 * @property {{status?:PresentationState,configured_context?:number,occupied_context?:number,available_context?:number,reserve?:number,limiting_factor?:string,last_receipt_id?:string}=} context
 * @property {{status?:PresentationState,provider?:string,adapter?:string,runtime?:string,configured_model?:string,effective_model?:string}=} model
 * @property {{status?:PresentationState,operating_mode?:string,pipeline_status?:ExecutionState}=} system
 * @property {{status?:PresentationState,enabled?:boolean,messages?:ChatMessage[]}=} chat
 * @property {Object<string, CenterState>=} centers
 * @property {{recommended_actions?:CenterAction[], available_actions?:CenterAction[]}=} menu
 * @property {{status?:ExecutionState,steps?:Array<Object>,execution_id?:string}=} pipeline
 * @property {Array<Object>=} recent_activity
 *
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user'|'assistant'|'system'|'tool'} role
 * @property {string} content
 * @property {string=} created_at
 * @property {string=} execution_id
 * @property {string=} receipt_id
 * @property {Array<Object>=} evidence
 * @property {string[]=} warnings
 *
 * @typedef {Object} CommandRequest
 * @property {string} request_id
 * @property {string} command_id
 * @property {string} contract_version
 * @property {string} source_surface
 * @property {string=} session_id
 * @property {string=} workspace_id
 * @property {string|number=} expected_state_revision
 * @property {Object<string, unknown>} arguments
 * @property {string=} idempotency_key
 * @property {string=} approval_id
 * @property {string} requested_at
 *
 * @typedef {Object} CommandResult
 * @property {string} request_id
 * @property {string=} execution_id
 * @property {ExecutionState} status
 * @property {string|number=} state_revision
 * @property {Object=} data
 * @property {Array<Object>=} warnings
 * @property {Object=} error
 * @property {string=} receipt_id
 * @property {string=} completed_at
 */

export function assertSnapshotShape(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new TypeError('El backend no devolvió un snapshot de UI válido.');
  }

  if (snapshot.contract_version !== UI_CONTRACT_VERSION) {
    throw new TypeError(
      `Contrato UI incompatible: ${String(snapshot.contract_version ?? 'ausente')}. Se esperaba ${UI_CONTRACT_VERSION}.`,
    );
  }

  return snapshot;
}

export function assertCommandResultShape(result) {
  if (!result || typeof result !== 'object') {
    throw new TypeError('El backend no devolvió un CommandResult válido.');
  }

  if (!result.request_id || !EXECUTION_STATES.includes(result.status)) {
    throw new TypeError('CommandResult incompleto: faltan request_id o status canónico.');
  }

  return result;
}
