# Changelog

## [1.1.0] - 2026-03-13

### Added
- Multi-repo codebase mapping: `/team:map-codebase` auto-detects monorepo services, sibling git repos, or falls back to explicit `.planning/workspace.json`
- Cross-repo synthesis: CROSS-REPO-SYNTHESIS.md maps API contracts, shared packages, message bus topics, data stores, and deployment boundaries across repos
- workspace.md and cross-repo-synthesis.md templates
- Hooks now installed during postinstall (team-check-update, team-statusline, team-context-monitor)
- Opt-out for hooks (`AGENT_TEAMS_NO_HOOKS=1`) and update checker (`AGENT_TEAMS_NO_UPDATE_CHECK=1`)
- Network activity disclosure in SECURITY.md and README.md
- Update checker caches for 24h instead of checking every session

### Fixed
- USER-GUIDE.md: STATE.json references corrected to STATE.md
- USER-GUIDE.md: SETTINGS.json reference corrected to config.json
- USER-GUIDE.md: File naming conventions (RESEARCH-1.md, PLAN-1.md, VERIFY-1.md) corrected to match actual format (01-RESEARCH.md, 01-01-PLAN.md, 01-VERIFICATION.md)
- help.md: "/subagent" column renamed to "Standard Agent" to avoid confusion
- Template count corrected in README (26, not 24)

## [1.0.1] - 2026-03-13

### Fixed
- Minor packaging fixes

## [1.0.0] - 2026-03-13

### Added
- 10 agent definitions (planner, executor, verifier, researcher, mapper, orchestrator, debugger, plan-checker, roadmapper, research-synthesizer)
- 27 slash commands (full workflow lifecycle)
- 24 templates (.planning/ artifacts, research, summaries)
- 9 reference docs (checkpoints, TDD, git, verification)
- team-tools CLI (state management, plan validation, progress tracking)
- npm packaging with postinstall hook
- SECURITY.md, CONTRIBUTING.md
- install.sh for manual installation
