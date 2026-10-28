# SpecKit — Quick Start Guide

---

## Table of Contents

1. [What is SpecKit?](#1-what-is-speckit)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [The Workflow](#4-the-workflow)
5. [Complete Walkthrough](#5-complete-walkthrough)
6. [Pros & Cons](#6-pros--cons)
7. [Known Problems & Fixes](#7-known-problems--fixes)
8. [Tips & Tricks](#8-my-tips--tricks)
9. [Resources](#9-resources)

---

## 1. What is SpecKit?

SpecKit is GitHub's own **opinionated spec-driven development toolkit**. Where OpenSpec is a flexible methodology, SpecKit is a full workflow toolkit using fixed command sequence, defined file structure, and structured prompts optimised for AI agents to follow with maximum consistency.

**Core philosophy:**

- **Spec-first** —> specification is written before any code is generated
- **Constitution-driven** —> project-wide rules are defined first, and enforced automatically on every run
- **Explicit constraints** —> Both goals and non-goals are important. The AI should know what to do just as much as what not to do.

> **When should you choose SpecKit over OpenSpec:** Choose SpecKit when you are want a more structured workflow with built-in consistency checks. The upfront cost is higher (although this README should reduce it :) ), but it pays off for complex features, strict compliance needs, or when you want the AI to enforce project-wide rules without needing to prompt them every time. OpenSpec is better for quick iterations, exploratory work, or when you want more flexibility in how you structure your specifications.

---

## 2. Prerequisites

| Requirement            | Notes                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Git                    | SpecKit is git-aware. If your project is not a git repo, speckit will initialize one for you.                    |
| Any Supported AI Agent | See which ones are compatible [here](https://github.com/github/spec-kit#-supported-ai-coding-agent-integrations) |
| Python 3.11            |                                                                                                                  |
| VsCode                 | see note below                                                                                                   |

> **VsCode is required. IntelliJ was not compatible from my experience at the time of testing.** SpecKit slash commands did not register in IntelliJ during my testing phase. I suspect it is to do with the fact that IntelliJ is not developed by Microsoft, where VsCode is. This might have changed since then, if you are more familiar with IntelliJ, I recommend you try it out and see if it works for you.

---

## 3. Installation

### 1. Install UV:

[uv](https://docs.astral.sh/uv/) is a fast Python package manager by [Astral](https://astral.sh/). SpecKit uses `uv` (via `uvx` or `uv tool install`) to run the `specify` CLI without polluting your global Python environment.

### macOS and Linux

```bash
# macOS and Linux — Standalone Installer
curl -LsSf https://astral.sh/uv/install.sh | sh
```

After the script finishes, follow any instructions printed by the installer to add uv to your `PATH`, then open a new terminal.

### Windows

Run the following in **Command Prompt or PowerShell**:

```powershell
# Standalone Installer
# After the script finishes, open a new terminal so the `uv` binary is on your `PATH`.
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# WinGet
winget install --id=astral-sh.uv -e

#Scoop
scoop install uv
```

Confirm that uv is installed and on your `PATH`:

```bash
uv --version
```

You should see output similar to `uv 0.x.y (...)`.

### 2. Install Specify CLI

Install once and use everywhere:

```bash
# Install latest from main (may include unreleased changes)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# or install a specific stable release (recommended — replace vX.Y.Z with the latest tag)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z

# Alternative: using pipx (also works)
pipx install git+https://github.com/github/spec-kit.git@vX.Y.Z
pipx install git+https://github.com/github/spec-kit.git
```

Then verify the correct version is installed:

```bash
specify version
```

## Get Started:

```bash
# Create new project
specify init <PROJECT_NAME>

# Or initialize in existing project
specify init . --integration <AI_AGENT>
# or
specify init --here --integration <AI_AGENT>

# Check installed tools
specify check
```

#### Once you run the init commands, follow the on-screen instructions to complete the setup.

### ⚠️ Important: If you have a monorepo setup:

If your SpecKit working folder is inside a larger repository with a single ".git" file at the root: create a `.code-workspace` file in the SpecKit folder, and **always open VS Code via this file**, not via the repository root.
Without this, you run the risk of having all generated spec files land in the repository root instead of your working folder.<br>
See [section 7.1](#71-files-generated-in-the-wrong-directory-only-if-you-have-a-monorepo-setup) for the full explanation.

---

## 4. The Workflow

SpecKit defines a fixed five-command sequence. Each command builds on the previous. Running them out of order produces poor results.

| #   | Command                 | Artifact          | Purpose                                                                                                                                                               |
| --- | ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/speckit.constitution` | `constitution.md` | Governing principles: code quality, testing standards.... <br> No project-specific details.                                                                           |
| 2   | `/speckit.specify`      | `spec.md`         | WHAT to build and WHY. <br> No technology: focus on user needs and behaviour.                                                                                         |
| 3   | `/speckit.plan`         | `plan.md`         | Tech stack, architecture, implementation constraints, language, framework, file locations, coverage targets. <br> This is where you go all in on the app's tech specs |
| 4   | `/speckit.tasks`        | `tasks.md`        | AI generates an ordered task list from the plan. <br> **Human review and approval required before proceeding.**                                                       |
| 5   | `/speckit.implement`    | source code       | AI executes all tasks in sequence against all artifacts.                                                                                                              |

**Optional commands:**

| Command              | When to use                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/speckit.clarify`   | Resolve underspecified areas. Run after `/speckit.specify`, before `/speckit.plan`.                                                                                         |
| `/speckit.analyze`   | Cross-artifact consistency check. Run after `/speckit.tasks`, before `/speckit.implement`. Catches contradictions between spec, plan, and tasks before any code is written. |
| `/speckit.checklist` | Generate quality checklists for requirement completeness and clarity. Final review gate before `/speckit.implement`.                                                        |

---

## 5. Complete Walkthrough

A complete cycle based on actual my testing. All commands are issued in the VsCode Copilot Chat panel.

### Step 1 — Establish project principles

```
/speckit.constitution Create principles focused on code quality, testing standards, user experience consistency, and performance requirements.
```

SpecKit then generates `constitution.md`. This document governs all subsequent runs. Key sections: core principles, constraints, development workflow, governance rules.

> **My suggestion: Invest time here.** The constitution is one of the most influential documents in your repo: if you make sure it's up to your standards before starting anything else, it will pay off in the long run.

---

### Step 2 — Describe the feature

```
/speckit.specify Build an application that returns random quotes from an existing list in the project files named quotes.json.
```

---

### Step 3 — Define the technical plan

This is the most important step for quality and spec adherence. Be as detailed as possible about **everything**:

> The specs that you see here are the results of multiple iterations of refining and adding constraints to the prompt after testing the generated code and identifying issues. The more explicit you are in the plan, the better the implementation will be, and the less time you will spend fixing spec violations later on.

```
`/speckit.plan The application uses Java 25 and Spring Boot 4. The quotes list is in "quotes.json" (always present). No database or UI. Must be fully testable via HTTP, have meaningful unit tests, and reach at least 80% branch coverage.`
  - Warnings & Best Practices
    - Classpath Resource Loading:
      - When accessing files placed in `src/main/resources` (such as `quotes.json`), never use a direct file path (e.g., `src/main/resources/quotes.json`).
      - Always load resources using the classpath (e.g., with Spring's `ResourceLoader` and the prefix `classpath:quotes.json`).
      - This ensures files are accessible both in development and when packaged as a JAR.
      - If you use a file path, the application will not find the resource after packaging, resulting in errors like `No quotes available`.
      - After any change to resource files, always trigger a reload endpoint or restart the app to ensure changes are picked up.
    - For the tests, you must comply with:
      - Use JUnit 5 for all unit and integration tests.
      - Ensure tests cover all endpoints and edge cases.
      - Achieve at least 80% branch coverage (use JaCoCo for measurement).
      - Write assertions that check both status codes and response content.
    - For dependencies, you must:
      - Use `spring-boot-starter-web` and `spring-boot-starter-webmvc-test` for Spring Boot 4 compatibility.
      - Use `mockito-core` for mocking dependencies in tests.
      - Use only Java 25 compatible libraries (check Maven Central for compatibility).
      - Avoid legacy or deprecated Spring Boot starters.
    - For code quality:
      - Enforce UTF-8 encoding for all source files and HTTP responses.
      - Use clear, descriptive names for classes, methods, and variables.
      - Document all public classes and methods with Javadoc.
```

> ⚠️ **The plan step is where most implementation issues come from.** If the plan is vague, the AI makes assumptions that violate requirements. Be explicit about every dependency, file location, test convention, and coverage target.

---

### Step 4 — Review and approve the task list

```
/speckit.tasks Break down the plan into actionable tasks.
```

SpecKit generates `tasks.md`. **This is your human checkpoint:** review every task before running `/speckit.implement`. Check that:

- Tasks are specific and independently verifiable
- Nothing is missing
- No tasks are overly broad

> **Also fill in all checklists** in `checklists/` before implementing. Skipping this step frequently leads to missing tests or incomplete coverage.

---

### Step 5 — Execute

```
/speckit.implement the application, and update the tasks list as you go.
```

SpecKit reads all artifacts created in the previous steps, and implements everything.

---

## 6. Pros & Cons

### ✓ Advantages

- **Strongest AI compatibility**: the constitution model gives the AI project-wide rules it enforces automatically on every run, not just the current feature
- **Constitution governance**: encoding rules like "all API endpoints require 80%+ branch coverage" means the AI enforces them without prompting every time
- **Human checkpoint**: the task review step gives an explicit approval gate before any code is written
- **Token efficiency**: structured, optimised prompts produce consistent results with less context overhead compared to natural language
- **Best for complex projects**: the overhead pays off for bigger, more complex features with multiple components, strict compliance...

### ✗ Limitations

- **Heavy upfront cost**: Speckit requires a significant amount of specs to be written before the first line of code is written
- **IntelliJ IDEA incompatibility**: slash commands don't work in IntelliJ (at time of testing), forcing me to move to VsCode.
- **Git branch creation by default**: SpecKit creates a new branch on every `/speckit.specify` run (unless manually modified) (see [section 7.2](#72-a-new-git-branch-is-created-on-every-run))
- **File path anchoring in monorepos**: without the `.code-workspace` fix, all spec files land at the repo root (see [section 7.1](#71-files-generated-in-the-wrong-directory-only-if-you-have-a-monorepo-setup))
- **Overkill for simple tasks**: for a trivial fix, the full five-command cycle adds more friction than value
- **Not ideal for bug fixes**: the workflow is optimised for feature delivery rather than fixing small bugs. For quick bug fixes, OpenSpec or direct prompting may be more efficient.

---

## 7. Known Problems & Fixes

### 7.1 Files generated in the wrong directory (only if you have a monorepo setup)

**Symptom:** specs files appeared in the repository root instead of your module folder.

**Cause:** SpecKit anchors all file operations to the `.git` folder location. VsCode inherits this as the workspace root.

**Fix:** Create a `.code-workspace` file in your working folder and always open VS Code via this file.

```json
// your-folder/your-folder.code-workspace:
{
  "folders": [
    {
      "path": "."
    }
  ],
  "settings": {
    "speckit.rootDir": "${workspaceFolder}",
    "speckit.outputDir": "${workspaceFolder}/specs"
  }
}
```

Then to open VsCode, use the command line to navigate to your working folder and open the workspace file. Or double click on the `.code-workspace` file directly in your file explorer.

```bash
# macOS / Linux
code your-module/your-module.code-workspace

# Windows (PowerShell)
code .\your-module\your-module.code-workspace
```

---

### 7.2 A new git branch is created on every run

**Symptom:** `/speckit.specify` automatically creates and checks out a new git branch (e.g. `001-feature-name`) for "optimal" code management.

**Cause:** Step 2 of `speckit.specify.agent.md` runs a branch creation step, which creates and checks out a branch as part of its setup routine.

**Fix:** If you don't needs this level of git management: <br>
Find `.github/agents/speckit.specify.agent.md` and replace Step 2 with:

```markdown
2. **Branch management**: SKIP all git operations entirely. Do NOT run `git fetch`,
   do NOT create branches, do NOT checkout branches. When running
   `create-new-feature.ps1`, pass the `--no-git` flag if available. If the flag
   is not available, run the script solely for the purpose of setting up the spec
   folder structure, and ignore any branch-related output or side effects.
   The active branch must remain unchanged throughout the entire run.
```

**Note:** If you follow this step, you must also implement the fix in [section 7.3](#73-branch-validation-blocks-non-standard-branch-names) to prevent errors when running `/speckit.plan` on a non-standard named branch.

---

### 7.3 Branch validation blocks non-standard branch names

**Symptom:** If you decide to turn off the git branch creation feature, you will be running Speckit on your own branch, will most likely doesn't respect Speckit's branch-naming convention. Running `/speckit.plan` on a branch that does not match the `001-name` pattern fails with an error from `setup-plan.ps1`.

**Cause:** The `Test-FeatureBranch` function in `common.ps1` uses a strict regex (`^[0-9]{3}-`) and returns `false` for anything else, triggering `exit 1`.

**Fix:** In `.specify/scripts/powershell/common.ps1`, change the `Test-FeatureBranch` function to:

```powershell
function Test-FeatureBranch {
    param(
        [string]$Branch,
        [bool]$HasGit = $true
    )

    # For non-git repos, we can't enforce branch naming but still provide output
    if (-not $HasGit) {
        Write-Warning "[specify] Warning: Git repository not detected; skipped branch validation"
        return $true
    }

    if ($Branch -notmatch '^[0-9]{3}-') {
        Write-Warning "[specify] Warning: Not on a standard feature branch ($Branch). Continuing anyway."
        return $true
    }
    return $true
}
```

This will simply return a warning instead of an error, allowing you to continue with the workflow, even if your branch doesn't follow the Speckit defined pattern.

---

## 8. My Tips & Tricks

**Invest in the constitution.** It is the highest-leverage document in SpecKit. Include testing standards, coverage thresholds, naming conventions, dependency preferences, and any constraint that should apply project-wide. Time spent here pays off on every subsequent run.

**Be maximally explicit in the plan.** The AI fills in anything left unspecified, but it has a tendency to do it incorrectly. Based on testing, always specify: classpath resource loading, exact test framework and annotations, and explicit non-goals (it's more important than you might think).

**Run `/speckit.analyze` before implementing.** The cross-artifact consistency check catches cases where tasks contradict the spec before any code is written.
From testing: this step significantly reduced spec violations in generated code.

**Review `tasks.md` before running `/speckit.implement`.** This is your last meaningful checkpoint before the AI writes code. Make sure every task is specific, ordered correctly, and nothing is missing.

---

## 9. Resources

- [Official SpecKit GitHub](https://github.com/github/spec-kit/tree/main)
- [YouTube: SpecKit introduction walkthrough](https://www.youtube.com/watch?v=a9eR1xsfvHg)
- [Youtube: SpecKit with Copilot CLI](https://www.youtube.com/watch?v=7tjmA_0pl2c)

<br>

_Written by Simon Nawara_
_Last edit: 12/05/2026_
