/**
 * Configure WASM loader.
 */
// WASM documents loader
const WASMLoader = (module: any, filename: any) => {
  // eslint-disable-next-line no-param-reassign
  module.exports = filename;
};

// allow loading of WASM documents
require.extensions['.wasm'] = WASMLoader;
