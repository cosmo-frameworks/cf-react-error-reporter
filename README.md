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

| Option             | Type                                         | Description                                 |
| ------------------ | -------------------------------------------- | ------------------------------------------- |
| `provider`         | `'github' \| 'gitlab' \| 'trello' \| 'jira'` | Integration method                          |
| `user`             | `string`                                     | GitHub user or organization                 |
| `repo`             | `string`                                     | Repository to create issues in              |
| `apiKey`           | `string`                                     | GitHub Personal Access Token                |
| `backendUrl`       | `string`                                     | Optional backend URL (for CORS or security) |
| `mode`             | `'frontend' \| 'backend' \| 'auto'`          | Submission mode                             |
| `discordWebhook`   | `string`                                     | Discord webhook for alerts                  |
| `onlyInProduction` | `boolean`                                    | Only report if `NODE_ENV === 'production'`  |

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

Jira has stricter CORS policies, so using the `mode` **front** option will result in a CORS error. We can work around this by using the `backendUrl` option as a fallback. In case of an error with the front option, it will then attempt to use the back option, as long as it has the corresponding property defined.

```ts
import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post("/report-error", async (req, res) => {
  const { title, body } = req.body;

  const response = await fetch(
    `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.JIRA_USER}:${process.env.JIRA_TOKEN}`
        ).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: process.env.JIRA_PROJECT },
          summary: title,
          description: body,
          issuetype: { name: "Bug" },
        },
      }),
    }
  );

  const data = await response.json();
  res.status(response.status).json(data);
});

app.listen(3001, () =>
  console.log("Jira error reporter backend running on port 3001")
);
```

---

## 📄 Documentation

For more information on how to configure or obtain the necessary values to set up the report, please refer to the provider's documentation.

| Provider | Documentation                   |
| -------- | ------------------------------- |
| Gitlab   | [DOCS](./docs/gitlab/README.md) |
| Trello   | [DOCS](./docs/trello/README.md) |
| Jira     | [DOCS](./docs/jira/README.md)   |

---

## 🔐 Security

- Never expose your `apiKey` in public environments unless using a backend.
- Use `onlyInProduction: true` to avoid reporting during development.

---

## ✅ Future Roadmap

- Recent log capture (`console.log`, etc)
- UI for pending errors
- Export to formats like CSV or JSON
- Simultaneous multi-platform reporting

---

## 📄 License

MIT © 2025 — Made by [shakar](https://portfolio.shakarzr.com/)
