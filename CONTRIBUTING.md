# Contributing

Thanks for your interest in contributing to BorderPay Escrow. This is an educational Solidity project, so clarity and correctness matter more than speed.

## Getting started

```bash
npm install
npm run build   # compile contracts
npm test        # run the test suite
```

See the [README](README.md) for the full setup and console walkthrough.

## Workflow

1. Branch off `main` (e.g. `feature/short-description`, `fix/short-description`, `chore/short-description`).
2. Make your change. If you touch `contracts/PaymentEscrow.sol`, add or update tests in `test/` to cover it — untested contract changes won't be merged.
3. Make sure the full suite passes locally:
   ```bash
   npm run build
   npm test
   ```
4. Open a PR against `main` and fill in the PR template (what changed, why, how it was tested).

## CI

Every push and PR runs [.github/workflows/ci.yml](.github/workflows/ci.yml): it compiles the contracts and runs the test suite on Node 20.x and 22.x. A PR won't be merged with a failing CI run.

## Code style

- Solidity: follow the existing style in `contracts/PaymentEscrow.sol` (checks-effects-interactions, pull-payment withdrawals, custom `require` messages).
- JS/tests: this project is ESM (`"type": "module"`) — use `import`/`export`, not `require`. Follow the existing pattern in `test/PaymentEscrow.test.js` (per-file `network.create()`, named signers for `arbiter`/`sender`/`beneficiary`/`other`).

## Reporting issues

Open a GitHub issue describing the bug or proposal. For anything touching fund custody or the arbiter's authority, please include the scenario/attack you're concerned about — this is a security-sensitive contract even though it's educational.
