import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Lottery", () => {
  let lottery;
  let manager;
  let player1;
  let player2;

  beforeEach(async () => {
    [manager, player1, player2] = await ethers.getSigners();
    lottery = await ethers.deployContract("Lottery");
  });

  it("should allow players to enter the lottery", async () => {
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.02") });
    await lottery.connect(player2).enter({ value: ethers.parseEther("0.02") });

    const players = await lottery.getPlayers();
    expect(players.length).to.equal(2);
    expect(players[0]).to.equal(player1.address);
    expect(players[1]).to.equal(player2.address);
  });

  it("should not allow entry with less than 0.01 ether", async () => {
    await expect(
      lottery.connect(player1).enter({ value: ethers.parseEther("0.005") })
    ).to.be.revertedWith("Minimum bet is 0.01 ether");
  });

  it("should not allow picking a winner when there are no players", async () => {
    await expect(lottery.connect(manager).pickWinner()).to.be.revertedWith(
      "No players have entered yet"
    );
  });

  it("should allow the manager to pick a winner", async () => {
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.02") });
    await lottery.connect(player2).enter({ value: ethers.parseEther("0.02") });

    const contractBalance = await ethers.provider.getBalance(
      await lottery.getAddress()
    );

    const tx = await lottery.connect(manager).pickWinner();
    const receipt = await tx.wait();

    const event = receipt.logs
      .map((log) => lottery.interface.parseLog(log))
      .find((parsed) => parsed && parsed.name === "WinnerPicked");

    expect(event).to.not.be.undefined;

    const winner = event.args.winner;
    expect([player1.address, player2.address]).to.include(winner);

    await expect(tx).to.changeEtherBalance(ethers, winner, contractBalance);
  });

  it("should reset players after picking a winner", async () => {
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.02") });
    await lottery.connect(player2).enter({ value: ethers.parseEther("0.02") });

    await lottery.connect(manager).pickWinner();

    const players = await lottery.getPlayers();
    expect(players.length).to.equal(0);
  });
});
