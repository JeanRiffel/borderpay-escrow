# Contributing

Thanks for your interest in contributing to BorderPay Escrow. This is an educational Solidity project, so clarity and correctness matter more than speed.

## Getting started

```bash
npm install
npm run build   # compile contracts
npm test        # run the test suite
```

`npm install` also registers a Husky pre-commit hook (see below). See the [README](README.md) for the full setup and console walkthrough.

## Workflow

1. Branch off `main` (e.g. `feature/short-description`, `fix/short-description`, `chore/short-description`).
2. Make your change. If you touch `contracts/PaymentEscrow.sol`, add or update tests in `test/` to cover it — untested contract changes won't be merged.
3. Make sure the full suite passes locally:
   ```bash
   npm run build
   npm run lint:sol
   npm run format:check   # or `npm run format` to auto-fix
   npm test
   ```
4. Open a PR against `main` and fill in the PR template (what changed, why, how it was tested).

## Pre-commit hook

This repo uses [Husky](https://typicode.github.io/husky/). Every `git commit` runs `lint:sol`, `format:check`, and `test` automatically (see `.husky/pre-commit`) — a commit is rejected if any of them fail. Run `npm run format` first if `format:check` blocks you on style-only diffs.

## CI

Every push and PR to `main` runs two workflows:

- [ci.yml](.github/workflows/ci.yml) — a `lint` job (Solhint + Prettier check) and a `test` job (compile + full suite) on Node 20.x and 22.x. A PR won't be merged with either failing.
- [slither.yml](.github/workflows/slither.yml) — static analysis via [Slither](https://github.com/crytic/slither). Currently **report-only** (`continue-on-error: true`): read the job log for findings, but it won't block a merge on its own yet.

[Dependabot](.github/dependabot.yml) opens weekly PRs for npm and GitHub Actions dependency updates.

## Debugging

`.vscode/launch.json` has two ready-made VS Code debug configs ("Debug Hardhat tests" and "Debug current test file") for stepping through test code with breakpoints. To inspect what a contract call is doing, add `import "hardhat/console.sol";` and `console.log(...)` calls inside the `.sol` file — output shows up wherever `npm test` runs.

## Code style

- Solidity: follow the existing style in `contracts/PaymentEscrow.sol` (checks-effects-interactions, pull-payment withdrawals, custom `require` messages).
- JS/tests: this project is ESM (`"type": "module"`) — use `import`/`export`, not `require`. Follow the existing pattern in `test/PaymentEscrow.test.js` (per-file `network.create()`, named signers for `arbiter`/`sender`/`beneficiary`/`other`).

## Reporting issues

Open a GitHub issue describing the bug or proposal. For anything touching fund custody or the arbiter's authority, please include the scenario/attack you're concerned about — this is a security-sensitive contract even though it's educational.
