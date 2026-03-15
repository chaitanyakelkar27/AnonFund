// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@anon-aadhaar/contracts/interfaces/IAnonAadhaar.sol";

contract VoterRegistry {
  struct NullifierInfo {
    bool isUsed;
    uint256 registeredAt;
  }

  mapping(uint256 => NullifierInfo) public nullifiers;

  uint256 public totalRegisteredVoters;
  uint256 public constant INITIAL_VOICE_CREDITS = 100;
  address public anonAadhaarVerifier;

  event VoterRegistered(uint256 indexed nullifier, uint256 timestamp);

  error NullifierAlreadyUsed(uint256 nullifier);
  error InvalidNullifier();
  error InvalidProof();

  constructor(address _verifier) {
      anonAadhaarVerifier = _verifier;
  }

  function registerVoter(
      uint256 nullifierSeed,
      uint256 nullifier,
      uint256 timestamp,
      uint256 signal,
      uint256[4] memory revealArray,
      uint256[8] memory groth16Proof
  ) external {
    if (nullifier == 0) {
      revert InvalidNullifier();
    }

    if (nullifiers[nullifier].isUsed) {
      revert NullifierAlreadyUsed(nullifier);
    }

    bool isValid = IAnonAadhaar(anonAadhaarVerifier).verifyAnonAadhaarProof(
        nullifierSeed,
        nullifier,
        timestamp,
        signal,
        revealArray,
        groth16Proof
    );

    if (!isValid) revert InvalidProof();

    nullifiers[nullifier] = NullifierInfo({registeredAt: block.timestamp, isUsed: true});

    totalRegisteredVoters++;

    emit VoterRegistered(nullifier, block.timestamp);
  }

  function isNullifierUsed(uint256 nullifier) external view returns (bool) {
    return nullifiers[nullifier].isUsed;
  }

  function getNullifierData(
    uint256 nullifier
  ) external view returns (uint256 registeredAt, bool isUsed) {
    NullifierInfo memory info = nullifiers[nullifier];
    return (info.registeredAt, info.isUsed);
  }

  function getTotalRegisteredVoters() external view returns (uint256) {
    return totalRegisteredVoters;
  }

  function getInitialVoiceCredits() external pure returns (uint256) {
    return INITIAL_VOICE_CREDITS;
  }
}