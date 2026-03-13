# Cross-Repo Synthesis

**Analysis Date:** [YYYY-MM-DD]
**Repos Mapped:** [count]

## Workspace Overview

| Repo | Stack | Primary Role | Entry Points |
|------|-------|-------------|-------------|
| [repo] | [languages/frameworks] | [what it does] | [key files] |

## API Contracts

**[Caller Repo] -> [Provider Repo]:**
- Protocol: [REST/gRPC/GraphQL]
- Base URL / Service Name: [how caller finds provider]
- Key endpoints:
  - `[METHOD] [path]` - [purpose]
- Auth: [how authenticated]
- Schema location: [where contract is defined]

## Shared Packages & Libraries

**[Package Name]:**
- Location: [repo/path or npm package]
- Used by: [list of repos]
- Purpose: [what it provides]
- Version sync: [pinned/floating]

## Message Bus / Event Contracts

**[Event Name]:**
- Publisher: [repo]
- Subscribers: [repos]
- Schema: [location or inline shape]
- Transport: [Kafka/RabbitMQ/SQS/etc]

## Shared Data Stores

**[Database/Store]:**
- Type: [Postgres/Mongo/Redis/etc]
- Owner: [repo responsible for schema]
- Readers: [repos with read access]
- Writers: [repos with write access]
- Schema location: [migrations path]

## Deployment Boundaries

| Repo | Deploys As | Runtime | Scales Independently |
|------|-----------|---------|---------------------|
| [repo] | [container/lambda/static] | [where it runs] | [yes/no] |

## Cross-Repo Dependencies

```
[repo-a] --depends on--> [repo-b] (via [mechanism])
[repo-c] --depends on--> [repo-a] (via [mechanism])
```

## Integration Risk Areas

**[Risk]:**
- Repos involved: [list]
- What could break: [scenario]
- Current protection: [tests/contracts/none]
- Recommendation: [what to add]

## Naming & Convention Mismatches

**[Mismatch]:**
- Repo A uses: [convention]
- Repo B uses: [different convention]
- Impact: [confusion/bugs/none]
- Recommendation: [align or document]

---

*Cross-repo synthesis: [date]*
