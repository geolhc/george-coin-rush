import {defineConfig} from 'vite';
export default defineConfig({base:'/george-coin-rush/',build:{target:'es2020',rollupOptions:{input:{classic:'index.html',mega:'mega.html'}}}});
