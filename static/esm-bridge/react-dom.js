const ReactDOM = globalThis.ReactDOM;

ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.usingClientEntryPoint = true;

export const createPortal = ReactDOM.createPortal;
export const createRoot = ReactDOM.createRoot;
export const findDOMNode = ReactDOM.findDOMNode;
export const flushSync = ReactDOM.flushSync;
export const hydrate = ReactDOM.hydrate;
export const hydrateRoot = ReactDOM.hydrateRoot;
export const render = ReactDOM.render;
export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode;
export const unstable_batchedUpdates = ReactDOM.unstable_batchedUpdates;
export const unstable_renderSubtreeIntoContainer =
  ReactDOM.unstable_renderSubtreeIntoContainer;
export const version = ReactDOM.version;

export default ReactDOM;
