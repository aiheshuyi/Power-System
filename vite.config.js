import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT ?? 3000);

  return {
    plugins: [vue()],
    server: {
      port,
      strictPort: true
    }
  };
});