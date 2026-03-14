// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VoterRegistry {
    mapping(address => bool) public isRegistered;

    function register(address voter) external {
        isRegistered[voter] = true;
    }
}
