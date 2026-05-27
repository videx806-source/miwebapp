# VIDEX — React App

Plataforma de streaming en vivo. Deploy en Vercel.

## Deploy en Vercel (3 pasos)

### Opción A — Vercel CLI
```bash
npm install -g vercel
cd videx
npm install
vercel
```

### Opción B — GitHub + Vercel
1. Sube esta carpeta a un repositorio en GitHub
2. Ve a vercel.com → New Project → importa el repo
3. Build settings detectados automáticamente (Vite):
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy

El archivo `vercel.json` ya maneja el routing SPA.

## Dev local
```bash
npm install
npm run dev
```

## Estructura
```
src/
  pages/
    Home.jsx          ← Canales + Eventos
    Player.jsx        ← Reproductor HLS
    Recordings.jsx    ← Grabaciones
    Config.jsx        ← Configuración
  components/
    BottomNav.jsx
    EventCard.jsx
  data/
    channels.js       ← Lista de canales (~160)
  hooks/
    useRecordings.js  ← localStorage
```

## Eventos JSON
Sirve este endpoint desde tu API:
`GET https://api.videx.lol/eventos.json`

```json
{
  "eventos": [
    {
      "id": "evt_001",
      "titulo": "Champions League Final",
      "equipos": "Real Madrid vs Bayern",
      "liga": "UEFA Champions League",
      "fecha": "2026-05-28",
      "hora": "20:00",
      "zona_horaria": "CET",
      "imagen_url": "https://api.videx.lol/img/eventos/champ.jpg",
      "stream_url": "https://api.videx.lol/keyvidex.php?keyvidex=videx&stream=/eventos/videx.m3u8",
      "estado": "en_vivo",
      "destacado": true
    }
  ]
}
```

Estados posibles: `en_vivo`, `proximo`, `finalizado`
