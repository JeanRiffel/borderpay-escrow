const Lottery = artifacts.require("Lottery");

contract("Lottery", (accounts) => {
    let lottery;
    const [manager, player1, player2] = accounts;

    beforeEach(async () => {
        lottery = await Lottery.new();
    });

    it("should allow players to enter the lottery", async () => {
        await lottery.enter({ from: player1, value: web3.utils.toWei("0.02", "ether") });
        await lottery.enter({ from: player2, value: web3.utils.toWei("0.02", "ether") });

        const players = await lottery.getPlayers();
        assert.equal(players.length, 2);
        assert.equal(players[0], player1);
        assert.equal(players[1], player2);
    });

    it("should not allow entry with less than 0.01 ether", async () => {
        try {
            await lottery.enter({ from: player1, value: web3.utils.toWei("0.005", "ether") });
            assert.fail("Expected an error but did not get one");
        } catch (error) {
            assert(error.message.includes("Minimum bet is 0.01 ether"));
        }
    });

    it("should allow the manager to pick a winner", async () => {
      await lottery.enter({ from: player1, value: web3.utils.toWei("0.02", "ether") });
      await lottery.enter({ from: player2, value: web3.utils.toWei("0.02", "ether") });
  
      const initialBalance = await web3.eth.getBalance(player1);  
      const result = await lottery.pickWinner({ from: manager });
    
      const event = result.logs[0];
      assert.equal(event.event, "WinnerPicked", "WinnerPicked event should be emitted");
  
      
      const winner = event.args.winner;
      assert.equal(winner === player1 || winner === player2, true, "Winner should be one of the players");
  
      const finalBalance = await web3.eth.getBalance(winner);
      assert(finalBalance > initialBalance);
  });

    it("should not allow picking a winner when there are no players", async () => {
        try {
            await lottery.pickWinner({ from: manager });
            assert.fail("Expected an error but did not get one");
        } catch (error) {
            assert(error.message.includes("No players have entered yet"));
        }
    });

    it("should reset players after picking a winner", async () => {
        await lottery.enter({ from: player1, value: web3.utils.toWei("0.02", "ether") });
        await lottery.enter({ from: player2, value: web3.utils.toWei("0.02", "ether") });

        await lottery.pickWinner({ from: manager });
        const players = await lottery.getPlayers();
        assert.equal(players.length, 0);
    });
});
