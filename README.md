# cf-react-error-reporter

[![Build Status](https://github.com/cosmo-frameworks/cf-react-error-reporter/actions/workflows/publish.yml/badge.svg)](https://github.com/cosmo-frameworks/cf-react-error-reporter/actions)
[![codecov](https://codecov.io/github/cosmo-frameworks/cf-react-error-reporter/branch/master/graph/badge.svg?token=qdcCsvksE0)](https://codecov.io/github/cosmo-frameworks/cf-react-error-reporter)
[![npm](https://img.shields.io/npm/v/cf-react-error-reporter)](https://www.npmjs.com/package/cf-react-error-reporter)

> 🛡️ A React library that detects runtime errors and automatically creates issues on platforms like GitHub. It also sends alerts via Discord, groups similar errors, and more.

---

## 🚀 Installation

```bash
npm install cf-react-error-reporter
```

---

## 📦 Key Features

- Error capture using `ErrorBoundary`
- Global error capture (`window.onerror`, `onunhandledrejection`)
- Smart grouping using fingerprint/hash
- Automatic reporting as GitHub issues
- Automatic fallback to backend if frontend fails
- Local storage of pending errors with retry logic
- Optional Discord notifications
- Manual hook `useErrorReporter()` and `reportTestError()` function

---

## 🔧 Basic Setup

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
  discordWebhook: import.meta.env.VITE_DISCORD_WEBHOOK, // optional
  onlyInProduction: true,
  mode: "auto", // 'frontend' | 'backend' | 'auto'
});

enableGlobalCapture(); // Enable global error capturing
```

In your render:

```tsx
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <App />
</ErrorBoundary>
```

---

## 🧠 Manual Usage with `useErrorReporter()`

```ts
const { reportError } = useErrorReporter();
reportError(new Error("Something went wrong"), "Optional description");
```

To test connectivity:

```ts
reportTestError();
```

---

## ⚙️ Configuration Options

| Option             | Type                                | Description                                 |
| ------------------ | ----------------------------------- | ------------------------------------------- |
| `provider`         | `'github'`                          | Currently only GitHub is supported          |
| `user`             | `string`                            | GitHub user or organization                 |
| `repo`             | `string`                            | Repository to create issues in              |
| `apiKey`           | `string`                            | GitHub Personal Access Token                |
| `backendUrl`       | `string`                            | Optional backend URL (for CORS or security) |
| `mode`             | `'frontend' \| 'backend' \| 'auto'` | Submission mode                             |
| `discordWebhook`   | `string`                            | Discord webhook for alerts                  |
| `onlyInProduction` | `boolean`                           | Only report if `NODE_ENV === 'production'`  |

---

## 🔧 Compatibility

The following table show the compatibility with de `mode` option with the diferents providers

| Provider | Frontend | Backend |
| -------- | -------- | ------- |
| Github   | ✅       | ✅      |
| Gitlab   | ✅       | ✅      |
| Trello   | ✅       | ✅      |
| Jira     | ❌       | ✅      |

---

## 🖥️ Optional Backend (Node.js)

If you can’t call the GitHub API from the browser (due to CORS or security concerns), you can set up a backend:

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
    `https://api.github.com/repos/USER/REPO/issues`,
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

app.listen(3001, () => console.log("Report backend running on port 3001"));
```

---

## 🔐 Security

- Never expose your `apiKey` in public environments unless using a backend.
- Use `onlyInProduction: true` to avoid reporting during development.

---

## ✅ Future Roadmap

- Support for GitLab, Jira, Trello
- Recent log capture (`console.log`, etc)
- UI for pending errors
- Export to formats like CSV or JSON
- Simultaneous multi-platform reporting

---

## 📄 License

MIT © 2025 — Made by [shakar](https://portfolio.shakarzr.com/)
