# CLAUDE.md - wzhmi2 Migration Project Guide

## 1. Project Context & Purpose
- **Objective:** Migrate the React-based HMI Editor & Viewer (`wzhmi`) into a pure jQuery & Vanilla JavaScript-based architecture (`wzhmi2`).
- **Source Reference:** The original React source code is located in the sibling directory: `../wzhmi/`.
- **Core Strategy:** Read and analyze the React components, hooks, and business logic from `../wzhmi/` first, then translate them into an imperative, high-performance jQuery structure in `wzhmi2`.

## 2. Technical Stack & Constraints
- **Allowed:** jQuery 3.x, HTML5 Canvas/SVG, Vanilla ES6+, Webpack/Vite (for bundling if applicable).
- **STRICTLY BANNED:** React, JSX, Virtual DOM libraries, or any modern framework hooks.
- **Architectural Shift:** 
  - Declarative State (`useState`, `useEffect`) → Imperative State (Centralized State Object / `data-*` attributes).
  - Component Lifecycle → Explicit Init/Render functions and jQuery Event Triggers.

## 3. UI Template Standard
- Do not build complex HTML structures via string concatenation in JavaScript.
- Always utilize `<script type="text/x-template">` for dynamic UI components (e.g., nodes, panels) and bind data imperatively.
- Implement Event Delegation for all dynamic elements rendered via templates.

## 4. Reference Mapping Rule
When analyzing `../wzhmi/`, map the React concepts to jQuery as follows:
- **Component Layout (JSX):** Translate to static HTML templates or dynamic dynamic string literals wrapped in `$()`.
- **State Management:** Maintain a global or module-scoped state object (e.g., `window.HMI_EDITOR_STATE`). 
- **Component Communication:** Use custom jQuery events (e.g., `$(document).trigger('hmi:nodeSelected', [data])`) instead of React props/callbacks.

## 5. Development & Coding Standards
- **Memory & Performance (Critical for HMI):**
  - Always prevent duplicate event listeners. Use `.off()` before `.on()` (e.g., `$el.off('click.hmi').on('click.hmi', handler)`).
  - For frequent HMI property updates, manipulate specific elements directly via IDs/Classes rather than re-rendering the entire DOM tree.
- **Data Integrity:** The HMI JSON schema (node data, canvas properties, event bindings) must remain 100% compatible with the original `wzhmi` schema.

## 6. Agent Instructions for Claude Code
- **Context Gathering:** Before creating or modifying files in `wzhmi2`, you are permitted and encouraged to use `grep` or `cat` commands on `../wzhmi/` to fully understand the original design and business logic.
- **Code Generation:** Do not hallucinate or simplify logic. Ensure complex HMI editor logic (drag-and-drop, alignment, resizing, property bindings) is faithfully restored using jQuery.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 7. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 8. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 9. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 10. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 11. No Closing Colons (Korean Output)

**End Korean sentences with a period, not a colon.**

When the user writes in Korean, your output is also Korean:
- Don't end sentences with `:` even if the next line is a list or example.
- LLMs trained on English docs leak the colon habit into Korean. Catch it.
- The test: every Korean sentence terminator should be `.`, `?`, or `!` — not `:`.
- Colons are fine inside code, key-value pairs, or labels. Not as sentence enders.

## 12. File Header Comments in Korean

**First line of every new source file: a one-line Korean comment stating its role.**

When creating a new file:
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang).
- Skip config files (`*.config.ts`, `package.json`, etc.).

Why: agents read files selectively, not whole codebases. A one-line Korean header gives instant context so the next session (human or agent) can navigate without re-reading the entire file.

## 13. Plan + Checklist + Context Notes

**Before any non-trivial task, produce three artifacts. Don't start coding without them.**

- **Plan** — what we're building and why.
- **Checklist** (`checklist.md`) — concrete tasks as checkboxes. Tick as you go.
- **Context Notes** (`context-notes.md`) — decisions made during the work and the reasoning behind them. Append continuously.

If the user gives only a plan and asks you to start coding, stop and ask: "Should I create the checklist and context notes first?" The next session — yours or someone else's — needs the notes to pick up where you left off without re-deriving every decision.

## 14. Run Tests Before Marking Complete

**If you touched code, run the tests before saying "done".**

- `npm test`, `pytest`, `cargo test`, whatever the project uses — run it.
- If tests pass, report results. If they fail, fix and re-run.
- No test setup? At minimum, verify the project builds/compiles.
- Run tests proactively, before the user signals "끝", "완료", "다 됐어" — not after.

This is the step LLMs skip most often. Treat it as non-negotiable.

## 15. Semantic Commits

**Commit when one logical change is complete. Don't wait for the user to ask.**

- The test: "Can I describe this commit in one sentence?" If yes, commit. If no, the changes are still mixed — split them.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate 20 unrelated edits and lose the ability to roll back individually.
- Don't commit just to commit — meaningful units only.

Note: For solo prototypes or throwaway scripts, group commits loosely if it slows you down. The point is reversibility, not ceremony.

## 16. Read Errors, Don't Guess

**Read the actual error/log line. Don't pattern-match from memory.**

When something fails:
- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state — then fix.

This is the step LLMs skip most often after "run tests". They guess from error keywords and apply the most-recent-pattern fix. That's how a one-line bug becomes a three-file refactor.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
