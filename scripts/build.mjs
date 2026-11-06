import {build} from 'esbuild';
await build({entryPoints:['src/main.tsx'],bundle:true,format:'esm',jsx:'automatic',outfile:'docs/app.js',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
