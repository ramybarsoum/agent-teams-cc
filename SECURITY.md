# Security Policy

## Responsible Disclosure

If you discover a security vulnerability in Agent Teams, please report it through GitHub Issues. Tag the issue with the `security` label.

For vulnerabilities that involve credential exposure or could enable unauthorized access, please use GitHub's private security advisory feature instead of creating a public issue.

## Security Considerations

Agent Teams spawns Claude Code instances as teammates. Each teammate is a full Claude Code session with file system access and command execution capabilities. This means:

**File system access.** Every teammate can read, write, and modify files in the working directory and beyond. A misconfigured agent could overwrite critical files, read sensitive data, or create files in unexpected locations.

**Command execution.** Teammates execute shell commands directly via Bash. There is no sandbox between teammates and the host system. Any command a teammate runs has the same permissions as the user who launched Claude Code.

**Inherited context.** Teammates auto-load CLAUDE.md, MCP servers, and skills from the project. If CLAUDE.md contains instructions that reference secrets or credentials, teammates will have access to that information.

**No isolation between teammates.** All teammates operate in the same working directory and can read each other's outputs. There is no access control between agent roles.

## Forbidden Files

Agents should never read or quote contents from sensitive files. The mapper agent (`team-mapper.md`) defines a `<forbidden_files>` section that all agents should respect:

- `.env`, `.env.*`, `*.env` - Environment variables with secrets
- `credentials.*`, `secrets.*`, `*secret*`, `*credential*` - Credential files
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks` - Certificates and private keys
- `id_rsa*`, `id_ed25519*`, `id_dsa*` - SSH private keys
- `.npmrc`, `.pypirc`, `.netrc` - Package manager auth tokens
- `config/secrets/*`, `.secrets/*`, `secrets/` - Secret directories
- `*.keystore`, `*.truststore` - Java keystores
- `serviceAccountKey.json`, `*-credentials.json` - Cloud service credentials

If an agent encounters these files, it should note their existence only. Never quote contents, even partially. Never include values like `API_KEY=...` or `sk-...` in any output.

Agent outputs get committed to git. Leaked secrets in `.planning/` artifacts create a security incident.

## Planning Artifacts

The `.planning/` directory may contain project-specific information including:

- **ROADMAP.md, STATE.md** - Project structure, phase goals, progress
- **PLAN.md files** - Detailed implementation plans with file paths, action descriptions
- **RESEARCH.md files** - Technology analysis, architecture findings
- **SUMMARY.md files** - Execution logs with code snippets and decisions
- **DEBUG files** - Investigation notes, error messages, hypothesis tracking

These artifacts describe your codebase in detail. Treat them as sensitive project documentation. If your repository is public, consider adding `.planning/` to `.gitignore` or using a separate private branch for planning artifacts.

## Recommendations

1. **Review agent outputs before pushing.** Check `.planning/` files for accidentally included secrets or sensitive paths.
2. **Use `.gitignore` for secrets.** Ensure `.env` and credential files are gitignored before running any agent commands.
3. **Limit MCP server permissions.** Connected MCP servers give teammates access to external services. Only connect servers you trust.
4. **Audit custom agents.** If you modify agent definitions, review them for instructions that could cause unintended file access or command execution.

## Contact

Report security issues via GitHub Issues on this repository.
