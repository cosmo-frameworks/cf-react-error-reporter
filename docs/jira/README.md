# Basic setup jira provider

```ts
import {
  ErrorBoundary,
  configureReporter,
  enableGlobalCapture,
} from "cf-react-error-reporter";

configureReporter({
  provider: 'jira',
  jiraDomain: 'your-domain.atlassian.net',
  jiraProjectKey: 'ABC',
  user: 'your-email@empresa.com',
  apiKey: 'your-api-key'
  onlyInProduction: true,
  mode: "backend", // 'frontend' | 'backend' | 'auto'
})

enableGlobalCapture(); // Enable global error capturing

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

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

## How to get the **jiraDomain**

The jira domain is the subdomain of your jira account, for example: `https://company.atlassian.net`, use only the `company.atlassian.net`

---

## How to get the **apiKey**

Go to [api tokens](https://id.atlassian.com/manage/api-tokens), click on **create api token**, take a name and then copy the token generated.

---

## How to get the **jiraProjectKey**

The **jiraProjectKey** is the name of your project, you can get this from the url, for example imagine this url: `https://company.atlassian.net/jira/software/projects/SCRUM/boards/1`, the key is **SCRUM**.