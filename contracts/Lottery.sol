// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
      manager = msg.sender;
    }

    function enter() public payable {
      require(msg.value > 0.01 ether, "Minimum bet is 0.01 ether");
      players.push(msg.sender);
    }

    function random() private view returns (uint) {
      return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    event WinnerPicked(address winner);
    
    function pickWinner() public restricted {
      require(players.length > 0, "No players have entered yet");
      uint index = random() % players.length;
      address winner = players[index];
      address payable winnerPayable = payable(winner);
      winnerPayable.transfer(address(this).balance);
      
      emit WinnerPicked(winner);

      players = new address[](0);
    }

    modifier restricted() {
      require(msg.sender == manager, "Only the manager can call this function");
      _;
    }

    function getPlayers() public view returns (address[] memory) {
      return players;
    }

    function contractName() public pure returns(string memory ) {
      return "The Lottery Contract is OnLine";
    }

}
