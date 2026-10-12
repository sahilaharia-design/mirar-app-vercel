import path from 'node:path';
export default {
 root: __dirname,
 resolve: { extensions: ['.web.ts','.web.tsx','.web.js','.ts','.tsx','.js','.jsx','.json'], alias: { 'react-native': path.resolve(__dirname, '../node_modules/react-native-web') }, dedupe: ['react','react-dom'] },
 define: { __DEV__: 'true', 'process.env.NODE_ENV': '"development"' },
 optimizeDeps: { esbuildOptions: { resolveExtensions: ['.web.ts','.web.tsx','.web.js','.ts','.tsx','.js','.jsx','.json'] } },
 esbuild: { jsx: 'automatic' },
 server: { host:'127.0.0.1', port:5176, fs:{allow:[path.resolve(__dirname,'..')]} },
 build: { outDir:'dist', emptyOutDir:true },
};
