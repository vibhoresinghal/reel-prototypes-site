// Network-only prototypes avoid stale designs after each deployment.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.mode!=='navigate')return;
 const url=new URL(event.request.url);
 if(!url.href.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).catch(()=>new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flows - Offline</title><style>body{font:18px system-ui;margin:12vh auto;padding:24px;max-width:440px;color:#183b37;background:#f6f7f8}button{padding:12px 24px;font:inherit}</style><h1>You're offline</h1><p>Connect to the internet to open your prototypes.</p><button onclick="location.reload()">Try again</button>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
