// Inisialisasi React Refresh Preamble untuk kompatibilitas lingkungan browser sandbox & dev server
declare global {
  interface Window {
    $RefreshReg$?: (type: any, id: string) => void;
    $RefreshSig$?: () => (type: any) => any;
    __vite_plugin_react_preamble_installed__?: boolean;
  }
}

if (typeof window !== 'undefined') {
  if (!window.$RefreshReg$) {
    window.$RefreshReg$ = () => {};
  }
  if (!window.$RefreshSig$) {
    window.$RefreshSig$ = () => (type: any) => type;
  }
  window.__vite_plugin_react_preamble_installed__ = true;
}

export {};
