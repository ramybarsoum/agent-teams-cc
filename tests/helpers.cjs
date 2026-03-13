/**
 * Shared test utilities for Agent Teams CLI tests
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

/** Create a unique temp directory for a test suite */
function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `at-test-${prefix}-`));
}

/** Remove a temp directory recursively */
function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

/** Create .planning directory structure with optional files */
function scaffoldPlanning(cwd, options = {}) {
  const planningDir = path.join(cwd, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });

  if (options.config !== false) {
    const configData = options.config || {
      commit_docs: true,
      search_gitignored: false,
      branching_strategy: 'none',
      phase_branch_template: 'team/phase-{phase}-{slug}',
      milestone_branch_template: 'team/{milestone}-{slug}',
      research: true,
      plan_checker: true,
      verifier: true,
      nyquist_validation: true,
      parallelization: true,
      brave_search: false,
    };
    fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(configData, null, 2), 'utf-8');
  }

  if (options.roadmap) {
    fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), options.roadmap, 'utf-8');
  }

  if (options.state) {
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), options.state, 'utf-8');
  }

  if (options.project) {
    fs.writeFileSync(path.join(planningDir, 'PROJECT.md'), options.project, 'utf-8');
  }

  if (options.requirements) {
    fs.writeFileSync(path.join(planningDir, 'REQUIREMENTS.md'), options.requirements, 'utf-8');
  }

  return planningDir;
}

/** Create a phase directory with optional plan/summary files */
function scaffoldPhase(cwd, phaseNum, name, options = {}) {
  const padded = String(phaseNum).padStart(2, '0');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const dirName = `${padded}-${slug}`;
  const phaseDir = path.join(cwd, '.planning', 'phases', dirName);
  fs.mkdirSync(phaseDir, { recursive: true });

  if (options.plans) {
    for (const plan of options.plans) {
      const planContent = plan.content || `---\nphase: "${padded}"\nplan: "${plan.id || '01'}"\ntype: implement\nwave: ${plan.wave || 1}\ndepends_on: []\nfiles_modified: []\nautonomous: true\nmust_haves:\n  truths: []\n  artifacts: []\n  key_links: []\n---\n\n# Plan ${plan.id || '01'}\n\n<task>\n<name>Task 1</name>\n<action>Do something</action>\n<verify>Check it</verify>\n<done>It works</done>\n</task>\n`;
      const fileName = `${padded}-${plan.id || '01'}-PLAN.md`;
      fs.writeFileSync(path.join(phaseDir, fileName), planContent, 'utf-8');
    }
  }

  if (options.summaries) {
    for (const summary of options.summaries) {
      const summaryContent = summary.content || `---\nphase: "${padded}"\nplan: "${summary.id || '01'}"\nsubsystem: test\ntags: [test]\nduration: 5m\ncompleted: true\none-liner: "Did the thing"\n---\n\n# Summary\n\nDone.\n`;
      const fileName = `${padded}-${summary.id || '01'}-SUMMARY.md`;
      fs.writeFileSync(path.join(phaseDir, fileName), summaryContent, 'utf-8');
    }
  }

  if (options.research) {
    fs.writeFileSync(path.join(phaseDir, `${padded}-RESEARCH.md`), '# Research\n\nFindings here.\n', 'utf-8');
  }

  if (options.context) {
    fs.writeFileSync(path.join(phaseDir, `${padded}-CONTEXT.md`), '# Context\n\nDecisions here.\n', 'utf-8');
  }

  return { dirName, phaseDir };
}

/** Create a minimal STATE.md with standard fields */
function createStateMd(cwd, overrides = {}) {
  const defaults = {
    currentPhase: '1',
    currentPhaseName: 'setup',
    totalPhases: '3',
    currentPlan: '1',
    totalPlans: '3',
    status: 'Executing',
    progress: '[##########] 33%',
    lastActivity: '2026-01-01',
  };
  const d = { ...defaults, ...overrides };
  const content = `# Session State

## Position

**Current Phase:** ${d.currentPhase}
**Current Phase Name:** ${d.currentPhaseName}
**Total Phases:** ${d.totalPhases}
**Current Plan:** ${d.currentPlan}
**Total Plans in Phase:** ${d.totalPlans}
**Status:** ${d.status}
**Progress:** ${d.progress}
**Last Activity:** ${d.lastActivity}

### Decisions

None yet.

### Blockers

None.

## Session

**Last Date:** None
**Stopped At:** None
**Resume File:** None
`;

  const statePath = path.join(cwd, '.planning', 'STATE.md');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, content, 'utf-8');
  return content;
}

/** Create a minimal ROADMAP.md */
function createRoadmapMd(cwd, phases = []) {
  let content = `# Roadmap\n\n## v1.0 Initial Release\n\n`;

  for (const p of phases) {
    content += `### Phase ${p.num}: ${p.name}\n\n**Goal:** ${p.goal || 'TBD'}\n**Requirements**: TBD\n**Depends on:** ${p.depends || 'None'}\n**Plans:** ${p.planCount || 0} plans\n\n`;
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  fs.mkdirSync(path.dirname(roadmapPath), { recursive: true });
  fs.writeFileSync(roadmapPath, content, 'utf-8');
  return content;
}

module.exports = {
  createTempDir,
  cleanup,
  scaffoldPlanning,
  scaffoldPhase,
  createStateMd,
  createRoadmapMd,
};
