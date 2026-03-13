# Workspace Configuration

**Created:** [YYYY-MM-DD]

## Repos

List all repositories in this workspace. Paths can be absolute or relative to this file's location.

```json
{
  "repos": [
    {
      "name": "repo-name",
      "path": "../repo-name",
      "description": "What this repo does",
      "tags": ["backend", "api"]
    }
  ]
}
```

## Tags Reference

Use tags to categorize repos for selective mapping:

- `backend` - Server-side services, APIs
- `frontend` - Web apps, SPAs, dashboards
- `mobile` - iOS, Android, React Native, Flutter
- `shared` - Shared libraries, packages, SDKs
- `infra` - Infrastructure, CI/CD, deployment configs
- `data` - Data pipelines, ETL, analytics
- `ai` - ML models, agent systems, AI services

## Cross-Repo Contracts

After mapping, the synthesizer identifies these automatically. You can also declare known contracts here:

```
[repo-a] --REST API--> [repo-b]
[repo-a] --Message Bus--> [repo-c]
[repo-a] --Shared Package--> [repo-b, repo-c]
```
