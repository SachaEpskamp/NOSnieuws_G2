import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command, mode }) => {
  // Pass `--mode evenhub` to inline everything into a single self-contained
  // index.html (nice for packaging with `evenhub pack`).
  const isEvenHubBuild = mode === 'evenhub';

  return {
    server: {
      host: '0.0.0.0',
      // Allow the dev server to be reached from the phone / evenhub tooling by
      // any hostname or IP. Dev-only; the production build is static files.
      allowedHosts: true,
      // Same-origin proxy for the NOS feeds so dev/simulator sessions don't
      // depend on external CORS proxies (the Tauri simulator WebView is
      // rejected by corsproxy.io). Dev-only; unused in installed builds.
      proxy: {
        '/feeds': {
          target: 'https://feeds.nos.nl',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/feeds/, ''),
        },
      },
    },

    // Relative paths so the built app works both from a hosted subpath and
    // from a locally-loaded Even Hub package.
    base: command === 'serve' ? '/' : './',

    plugins: isEvenHubBuild ? [viteSingleFile()] : [],

    build: isEvenHubBuild
      ? { target: 'esnext', emptyOutDir: true }
      : { emptyOutDir: true },
  };
});
