// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@anon-aadhaar/contracts/interfaces/IAnonAadhaar.sol";

contract MockAnonAadhaarVerifier is IAnonAadhaar {
    bool public shouldVerify = true;

    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }

    function verifyAnonAadhaarProof(
        uint256, /* nullifierSeed */
        uint256, /* nullifier */
        uint256, /* timestamp */
        uint256, /* signal */
        uint256[4] memory, /* revealArray */
        uint256[8] memory /* groth16Proof */
    ) external view override returns (bool) {
        // For local testing, always return true. 
        // In production, the real verifier checks the SNARK proof.
        return shouldVerify;
    }
}
