# cf-react-error-reporter

> 🛡️ Librería para React que detecta errores en tiempo de ejecución y crea automáticamente issues en plataformas como GitHub, además de enviar alertas por Discord, agrupar errores, y más.

---

## 🚀 Instalación

```bash
npm install cf-react-error-reporter
```

Para capturas visuales:

```bash
npm install html2canvas
```

---

## 📦 Características principales

- Captura de errores con `ErrorBoundary`
- Captura global (`window.onerror`, `onunhandledrejection`)
- Agrupación inteligente por huella digital (hash/fingerprint)
- Reporte automático como issue en GitHub
- Fallback automático a backend si falla el frontend
- Almacenamiento local de errores pendientes con reintento
- Notificaciones opcionales por Discord
- Hook manual `useErrorReporter()` y función `reportTestError()`
- Plugin para Vite que configura todo automáticamente

---

## 🔧 Configuración básica

```ts
import {
  ErrorBoundary,
  configureReporter,
  enableGlobalCapture,
  useErrorReporter,
  reportTestError,
} from "cf-react-error-reporter";

configureReporter({
  provider: "github",
  user: "mi-usuario",
  repo: "mi-repo",
  apiKey: import.meta.env.VITE_GITHUB_TOKEN,
  discordWebhook: import.meta.env.VITE_DISCORD_WEBHOOK, // opcional
  onlyInProduction: true,
  mode: "auto", // 'frontend' | 'backend' | 'auto'
});

enableGlobalCapture(); // Captura errores globales
```

En tu render:

```tsx
<ErrorBoundary fallback={<div>Algo salió mal 😓</div>}>
  <App />
</ErrorBoundary>
```

---

## 🧠 Uso manual con `useErrorReporter()`

```ts
const { reportError } = useErrorReporter();
reportError(new Error("Algo falló"), "Descripción opcional");
```

Para probar conectividad:

```ts
reportTestError();
```

---

## ⚙️ Opciones de configuración

| Opción             | Tipo                                | Descripción                                    |
| ------------------ | ----------------------------------- | ---------------------------------------------- |
| `provider`         | `'github'`                          | Actualmente solo GitHub soportado              |
| `user`             | `string`                            | Usuario u organización GitHub                  |
| `repo`             | `string`                            | Repositorio donde crear issues                 |
| `apiKey`           | `string`                            | GitHub Personal Access Token                   |
| `backendUrl`       | `string`                            | URL a backend opcional (para CORS o seguridad) |
| `mode`             | `'frontend' \| 'backend' \| 'auto'` | Modo de envío                                  |
| `discordWebhook`   | `string`                            | Webhook de Discord para alertas                |
| `onlyInProduction` | `boolean`                           | Solo reportar si `NODE_ENV === 'production'`   |

---

## 🖥️ Backend opcional (Node.js)

Si no puedes llamar a la API de GitHub desde el navegador (CORS, seguridad), monta un backend:

```ts
// server.js (Express)
import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/report-error", async (req, res) => {
  const { title, body } = req.body;
  const response = await fetch(
    `https://api.github.com/repos/USUARIO/REPO/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body }),
    }
  );
  const data = await response.json();
  res.status(response.status).json(data);
});

app.listen(3001, () => console.log("Report backend activo en puerto 3001"));
```

---

## 🔐 Seguridad

- Nunca expongas el `apiKey` en entornos públicos si no usas backend.
- Usa `onlyInProduction: true` para evitar reportes en desarrollo.

---

## ✅ Roadmap futuro

- Soporte para GitLab, Jira, Trello
- Captura de logs recientes (`console.log`, etc)
- UI de errores pendientes
- Exportación a formatos como CSV o JSON
- Envío a múltiples plataformas simultáneamente

---

## 📄 Licencia

MIT © 2025 — Hecho con 💻 por tu equipo favorito.
