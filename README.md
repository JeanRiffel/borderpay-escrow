# Payment Escrow Smart Contract

## Project Overview

This project is an educational Ethereum smart contract implementing a conditional payment escrow. A `sender` opens a payment for a `beneficiary` and funds it with Ether; the funds are held in the contract until a trusted `arbiter` confirms — off-chain — that the underlying transfer settled (`releasePayment`) or failed/was cancelled (`refundPayment`). Released and refunded funds are credited to the recipient's balance and withdrawn via a pull payment (`withdraw()`), rather than pushed directly, so a misbehaving recipient can never block the settlement of other payments.

The domain (hold funds until a cross-border transfer is confirmed, then release or refund) mirrors the settlement flow of [money-across-borders](https://github.com/JeanRiffel/money-across-borders), a Clean Architecture/DDD demo of a cross-border payments backend. This repo is not part of that project — it's a standalone contract exploring the same idea (custody funds, confirm off-chain, settle on-chain) on Solidity.

> This repo previously hosted a different contract — a pseudo-random lottery — and had two sibling repos (a back-end and a front-end) built against it. Those repos target the old `Lottery` contract and are not compatible with `PaymentEscrow`.

## For this project I used

- [Solidity](https://soliditylang.org/): the programming language for writing smart contracts on the Ethereum blockchain.
- [Hardhat](https://hardhat.org/): the chosen framework for smart contract development, testing, and deployment. It also runs a local, in-process Ethereum network for development.

#### Installation and Execution Instructions

1. Install dependencies:

```bash
npm install
```

2. Compile the Solidity program:

```bash
npm run build
```

3. Deploy the smart contract (via Hardhat Ignition). By default the deploying account acts as the arbiter; pass `--parameters` to use a dedicated arbiter address instead:

```bash
npm run migrate
# or, with a dedicated arbiter address:
npx hardhat ignition deploy ignition/modules/PaymentEscrow.js --parameters '{"PaymentEscrowModule":{"arbiter":"0x..."}}'
```

4. Access the Hardhat console:

```bash
npx hardhat console
```

5. Unit testing of the contract:

```bash
npm test
```

### Running the contract

Whether you followed the previous steps: 2, 3 and 4.

You are now at the Hardhat console, so type these commands:

```js
const escrow = await ethers.deployContract("PaymentEscrow", [(await ethers.getSigners())[0].address])
await escrow.contractName()
```

As output you should see the message: `The PaymentEscrow Contract is OnLine`

### Payment lifecycle

```
createPayment(id, beneficiary)  -> Pending
fundPayment(id) { value }       -> Funded
releasePayment(id)  [arbiter]   -> Released  (beneficiary can withdraw())
refundPayment(id)   [arbiter]   -> Refunded  (sender can withdraw())
```
