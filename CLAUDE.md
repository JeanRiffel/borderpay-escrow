# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational Ethereum smart contract implementing a lottery: users bet Ether on a contract, and a manager-triggered function picks a pseudo-random winner who receives the full contract balance. This repo is the contract-only piece of a 3-repo project:

- This repo (`lottery-smart-contract`): the Solidity contract and its Truffle project.
- [back-end-lottery-smart-contract](https://github.com/JeanRiffel/back-end-lottery-smart-contract): API layer that talks to the contract.
- [front-end-lottery-smart-contract](https://github.com/JeanRiffel/front-end-lottery-smart-contract): user-facing UI.

Stack: Solidity ^0.8.0, Truffle (dev framework), Ganache (local chain).

## Commands

No `truffle` binary is a local dependency — install it globally first: `npm install -g truffle`.

- `npm run build` / `truffle compile` — compile contracts.
- `npm run migrate` / `truffle migrate` — deploy via `migrations/1_lottery.js`.
- `truffle test` — run all tests in `test/`.
- `truffle test test/Loterry.test.js` — run a single test file.
- `truffle console` — interactive console against the configured network; after deploying, `let lottery = await Lottery.deployed()` gives a handle to the deployed instance.

`truffle test`/`truffle migrate` need a network. `truffle-config.js` currently has no networks uncommented, so truffle falls back to spinning up its own in-memory development chain on port 9545 — no separate Ganache process is required unless you want a persistent one. If you do run Ganache separately, uncomment/add a matching entry in `truffle-config.js`'s `networks` block first.

## Architecture

Everything of substance lives in `contracts/Lottery.sol`, a single contract:

- `manager` — set to the deployer in the constructor; the only address that can call `pickWinner()` (enforced by the `restricted` modifier).
- `players` — dynamic array of addresses that have entered; append-only until a winner is picked, then reset to empty.
- `enter()` — payable; requires `msg.value > 0.01 ether`; pushes `msg.sender` onto `players`.
- `random()` — private; derives pseudo-randomness from `block.difficulty`, `block.timestamp`, and `players` via `keccak256`. This is not secure randomness (miner-manipulable) — acceptable here only because the project is educational.
- `pickWinner()` — restricted to `manager`; picks `players[random() % players.length]`, transfers the entire contract balance to the winner, emits `WinnerPicked(address)`, then resets `players` to an empty array.
- `getPlayers()` — read-only accessor for the current player list.
- `contractName()` — pure sanity-check function returning `"The Lottery Contract is OnLine"`, used in the README's manual console walkthrough to confirm a successful deploy.

Migration (`migrations/1_lottery.js`) deploys `Lottery` with no constructor args. Tests (`test/Loterry.test.js`) use Truffle's `artifacts.require`/`contract()` pattern against `accounts[0]` as manager and `accounts[1..2]` as players, covering: entry accounting, minimum-bet enforcement, winner selection + payout, and player-list reset after a win.
