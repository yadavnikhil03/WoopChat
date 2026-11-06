# Agent Guidelines for WhopChat

This document configures conventions, guidelines, and skills for agents working on WhopChat.

## Agent skills

### Issue tracker

Local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

## Project Constraints

- Maintain zero comments in all TypeScript, JavaScript, and code files throughout the codebase.
- Strictly adhere to established MongoDB compound indexes, ObjectId validation, and connection management.
- Test changes using automated tests or verify both backend and frontend builds prior to committing.

