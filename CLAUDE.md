# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational Ethereum smart contract implementing a lottery: users bet Ether on a contract, and a manager-triggered function picks a pseudo-random winner who receives the full contract balance. This repo is the contract-only piece of a 3-repo project:

- This repo (`lottery-smart-contract`): the Solidity contract and its Hardhat project.
- [back-end-lottery-smart-contract](https://github.com/JeanRiffel/back-end-lottery-smart-contract): API layer that talks to the contract.
- [front-end-lottery-smart-contract](https://github.com/JeanRiffel/front-end-lottery-smart-contract): user-facing UI.

Stack: Solidity ^0.8.0, Hardhat 3 (dev framework, ESM-only), ethers v6 + Mocha/Chai (via `@nomicfoundation/hardhat-toolbox-mocha-ethers`), Hardhat Ignition (deployment).

The project is ESM (`"type": "module"` in `package.json`) — config, scripts, and tests use `import`/`export`, not `require`.

## Commands

- `npm run build` / `npx hardhat compile` — compile contracts.
- `npm run migrate` / `npx hardhat ignition deploy ignition/modules/Lottery.js` — deploy via Hardhat Ignition. Defaults to Hardhat's in-process simulated network; pass `--network <name>` for a configured network (see `hardhat.config.js`).
- `npm test` / `npx hardhat test` — run all tests in `test/`.
- `npx hardhat test test/Lottery.test.js` — run a single test file.
- `npx hardhat console` — interactive console against the configured network; `const lottery = await ethers.deployContract("Lottery")` deploys a throwaway instance to play with.

Tests instantiate their own network handle per file via `const { ethers } = await network.create();` (see `test/Lottery.test.js`) rather than relying on injected globals.

## Architecture

Everything of substance lives in `contracts/Lottery.sol`, a single contract:

- `manager` — set to the deployer in the constructor; the only address that can call `pickWinner()` (enforced by the `restricted` modifier).
- `players` — dynamic array of addresses that have entered; append-only until a winner is picked, then reset to empty.
- `enter()` — payable; requires `msg.value > 0.01 ether`; pushes `msg.sender` onto `players`.
- `random()` — private; derives pseudo-randomness from `block.difficulty`, `block.timestamp`, and `players` via `keccak256`. This is not secure randomness (miner-manipulable) — acceptable here only because the project is educational.
- `pickWinner()` — restricted to `manager`; reverts if `players` is empty; otherwise picks `players[random() % players.length]`, transfers the entire contract balance to the winner, emits `WinnerPicked(address)`, then resets `players` to an empty array.
- `getPlayers()` — read-only accessor for the current player list.
- `contractName()` — pure sanity-check function returning `"The Lottery Contract is OnLine"`, used in the README's manual console walkthrough to confirm a successful deploy.

The Ignition module (`ignition/modules/Lottery.js`) deploys `Lottery` with no constructor args. Tests (`test/Lottery.test.js`) use Hardhat's `ethers.deployContract`/`ethers.getSigners()` pattern against `manager` and `player1`/`player2` signers, covering: entry accounting, minimum-bet enforcement, the no-players guard on `pickWinner()`, winner selection + payout, and player-list reset after a win. Note the `changeEtherBalance` and similar Hardhat chai matchers in this version take `ethers` as their first argument, e.g. `expect(tx).to.changeEtherBalance(ethers, winner, amount)`.
