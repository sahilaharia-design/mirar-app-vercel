// Release build gate only. No auth, infrastructure or deployment changes.
const {spawnSync}=require('node:child_process');
const entry=process.env.MIRAR_APP_ENTRY_URL;
if(process.env.MIRAR_DESTINATIONS_VERIFIED!=='1'||!entry){throw new Error('Claude must supply MIRAR_APP_ENTRY_URL and confirm MIRAR_DESTINATIONS_VERIFIED=1 before a release build. Use Vite directly for local visual review.');}
const url=new URL(entry);if(url.protocol!=='https:')throw new Error('App entry must be the verified HTTPS destination.');
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','landing/vite.config.ts'],{stdio:'inherit',env:{...process.env,VITE_MIRAR_APP_ENTRY_URL:url.href}});process.exit(result.status??1);
