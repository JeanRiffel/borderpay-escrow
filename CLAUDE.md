# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational Ethereum smart contract implementing a conditional payment escrow: a `sender` opens and funds a payment for a `beneficiary`, and a trusted `arbiter` — confirming off-chain that the underlying (e.g. cross-border) transfer settled or failed — releases the funds to the beneficiary or refunds them to the sender. Recipients withdraw via a pull payment rather than being paid via a direct push transfer.

This repo (renamed `borderpay-escrow`, part of the **BorderPay** project) previously held a different contract (a pseudo-random lottery) with two sibling repos built against it — now renamed `borderpay-api` and `borderpay-app`. Both targeted the old `Lottery` contract's ABI and are **not** compatible with `PaymentEscrow`; treat this repo as standalone until/unless a new consumer is wired up. The domain intentionally echoes [money-across-borders](https://github.com/JeanRiffel/money-across-borders) (hold funds, confirm settlement off-chain, release or refund) but the two projects are not integrated — no shared code, network calls, or dependency between them.

Stack: Solidity ^0.8.0, Hardhat 3 (dev framework, ESM-only), ethers v6 + Mocha/Chai (via `@nomicfoundation/hardhat-toolbox-mocha-ethers`), Hardhat Ignition (deployment).

The project is ESM (`"type": "module"` in `package.json`) — config, scripts, and tests use `import`/`export`, not `require`.

## Commands

- `npm run build` / `npx hardhat compile` — compile contracts.
- `npm run migrate` / `npx hardhat ignition deploy ignition/modules/PaymentEscrow.js` — deploy via Hardhat Ignition. Defaults to the deploying account as `arbiter` and Hardhat's in-process simulated network; pass `--parameters '{"PaymentEscrowModule":{"arbiter":"0x..."}}'` for a dedicated arbiter address and `--network <name>` for a configured network (see `hardhat.config.js`).
- `npm test` / `npx hardhat test` — run all tests in `test/`.
- `npx hardhat test test/PaymentEscrow.test.js` — run a single test file.
- `npx hardhat console` — interactive console against the configured network; `const escrow = await ethers.deployContract("PaymentEscrow", [arbiterAddress])` deploys a throwaway instance to play with.
- `npm run lint:sol` / `npx solhint 'contracts/**/*.sol'` — Solhint (`solhint:recommended`, config in `.solhint.json`).
- `npm run format` / `npm run format:check` — Prettier with `prettier-plugin-solidity` (config in `.prettierrc.json`); `format` writes, `format:check` only verifies.

Tests instantiate their own network handle per file via `const { ethers } = await network.create();` (see `test/PaymentEscrow.test.js`) rather than relying on injected globals.

## Tooling

- **Pre-commit hook** (Husky, `.husky/pre-commit`): runs `lint:sol`, `format:check`, then `test` on every `git commit`; registered via the `prepare` script on `npm install`.
- **CI** (`.github/workflows/`): `ci.yml` runs a `lint` job (Solhint + Prettier check) and a `test` job (compile + full suite, Node 20.x/22.x) on push/PR to `main`. `slither.yml` runs Slither static analysis but is currently non-blocking (`continue-on-error: true` — current findings are Low/Informational/Optimization, consistent with this contract's intentional low-level-call pull-payment design).
- **Dependabot** (`.github/dependabot.yml`): weekly PRs for `npm` and `github-actions` dependency updates.
- **VS Code debugging** (`.vscode/launch.json`): "Debug Hardhat tests" and "Debug current test file" configs run the Mocha suite under Node's debugger for breakpoints in `test/*.test.js`. There's no source-level Solidity step debugger wired up (no such mature/pluggable tool exists for Hardhat 3 yet); use `hardhat/console.sol` + `console.log(...)` inside the contract to inspect values during a test run instead.

## Architecture

Everything of substance lives in `contracts/PaymentEscrow.sol`, a single contract:

- `arbiter` — set in the constructor; the only address that can call `releasePayment()` / `refundPayment()` (enforced by the `onlyArbiter` modifier). Not transferable.
- `payments` — `mapping(bytes32 paymentId => Payment)`, where `Payment` is `{ sender, beneficiary, amount, status }` and `status` is `Pending → Funded → Released | Refunded`.
- `pendingWithdrawals` — `mapping(address => uint256)` of credited-but-unclaimed balances; this is the pull-payment ledger `withdraw()` drains.
- `createPayment(paymentId, beneficiary)` — opens a `Pending` payment for the given id; caller becomes `sender`; reverts on zero-address beneficiary or a reused `paymentId`.
- `fundPayment(paymentId)` — payable; only the original `sender` may call it, only while `Pending`, only with `msg.value > 0`; moves the payment to `Funded`.
- `releasePayment(paymentId)` — `onlyArbiter`; requires `Funded`; moves to `Released` and credits `payment.amount` to the beneficiary's `pendingWithdrawals`.
- `refundPayment(paymentId)` — `onlyArbiter`; requires `Funded`; moves to `Refunded` and credits `payment.amount` back to the sender's `pendingWithdrawals`.
- `withdraw()` — pulls the caller's full `pendingWithdrawals` balance via a low-level `call`; zeroes the ledger entry before sending (checks-effects-interactions). This exists so a beneficiary/sender that reverts on receive can never block `releasePayment`/`refundPayment` for *other* payments — unlike the old `Lottery.pickWinner()`, which pushed funds directly and could be griefed this way.
- `getPayment(paymentId)` — read-only struct accessor (the public `payments` mapping already exposes a tuple getter; this returns the same data as a named struct).
- `contractName()` — pure sanity-check function returning `"The PaymentEscrow Contract is OnLine"`, used in the README's manual console walkthrough to confirm a successful deploy.

There is no randomness anywhere in this contract — the old `Lottery.random()` (miner-manipulable `block.difficulty`/`block.timestamp` entropy) does not carry over; if a lottery-style feature returns, re-derive it (Chainlink VRF or commit-reveal) rather than reusing that pattern.

The Ignition module (`ignition/modules/PaymentEscrow.js`) deploys `PaymentEscrow` with one constructor arg, `arbiter`, defaulted via `m.getParameter("arbiter", m.getAccount(0))` to the deploying account. Tests (`test/PaymentEscrow.test.js`) use Hardhat's `ethers.deployContract`/`ethers.getSigners()` pattern against `arbiter`, `sender`, `beneficiary`, and `other` signers, covering: payment creation (including zero-address and duplicate-id guards), funding (sender-only, positive-value, not-already-funded), arbiter-only release/refund with correct status transitions and crediting, and withdrawal (correct payout, zeroing, and the no-balance revert). Note the `changeEtherBalance` and similar Hardhat chai matchers in this version take `ethers` as their first argument, e.g. `expect(tx).to.changeEtherBalance(ethers, beneficiary, amount)`.
