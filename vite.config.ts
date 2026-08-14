import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    outDir: './dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2100,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'vendor-react', test: /[/\\]node_modules[/\\](react|react-dom|react-router)[/\\]/ },
            { name: 'vendor-antd', test: /[/\\]node_modules[/\\](@ant-design|antd)[/\\]/ },
            { name: 'vendor-utils', test: /[/\\]node_modules[/\\](axios|react-syntax-highlighter)[/\\]/ },
          ],
        },
      },
    },
    minify: 'oxc',
  },
  plugins: [react()],
  publicDir: 'public',
})
