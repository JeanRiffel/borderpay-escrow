# Lottery Smart Contract

## Project Overview

This project serves educational purposes, offering a web application that allows users to place bets on randomly generated numbers using Ether. A smart contract manages the bets, receives Ether, and determines the winning number randomly. The participant with the correct number receives the accumulated Ether sum.

The project is divided into 3 projects:

- Lottery Smart Contract*: This handle the bets and decided the winner of the bets. Also reward the winner with all money available;
- [Back-end Lottery Smart Contract](https://github.com/JeanRiffel/back-end-lottery-smart-contract):  This handle the requests from the user and send it to the smart contract.
- [Front-end Lottery Smart Contract](https://github.com/JeanRiffel/front-end-lottery-smart-contract): This is the user interface that the use perform actions.

## For this project I used

- [Solidity](https://soliditylang.org/): 
Solidity is the programming language for writing smart contracts on the Ethereum blockchain. Learn more about Solidity.
- [Hardhat](https://hardhat.org/): Hardhat is the chosen framework for smart contract development, testing, and deployment. It also runs a local, in-process Ethereum network for development.


#### Installation and Execution Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a new Solidity file in the contracts folder.

3. Compile the Solidity program:

```bash
npm run build
```

4. Deploy the smart contract (via Hardhat Ignition):

```bash
npm run migrate
```

5. Access the Hardhat console:

```bash
npx hardhat console
```

6. Unit testing of the contract
```bash
npm test
```

### Running the contract 

Whether you followed the previous steps: 3, 4 and 5.

You are now at the Hardhat console, so type these commands:
- const lottery = await ethers.deployContract("Lottery")
- await lottery.contractName()

As output you should see the message: The Lottery Contract is OnLine