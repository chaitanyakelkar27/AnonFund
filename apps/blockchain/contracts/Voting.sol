// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    event VoteCast(address indexed voter, uint256 projectId, uint256 amount);

    function castVote(uint256 projectId, uint256 amount) external {
        emit VoteCast(msg.sender, projectId, amount);
    }
}
