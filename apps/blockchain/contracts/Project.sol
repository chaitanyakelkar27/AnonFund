// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Project {
    string public name;
    address public owner;

    constructor(string memory _name, address _owner) {
        name = _name;
        owner = _owner;
    }
}
