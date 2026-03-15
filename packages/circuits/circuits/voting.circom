pragma circom 2.1.9;

include "./merkle-tree.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template VotingCircuit(levels) {
    signal input identitySecret;
    signal input identityNullifier;
    signal input treePathIndices[levels];
    signal input treeSiblings[levels];
    
    signal input roundId;
    signal input projectId;
    signal input voteCount;
    
    signal input externalNullifier;
    
    signal output root;
    signal output nullifierHash;
    signal output signalHash;
    
    component identityHasher = Poseidon(1);
    identityHasher.inputs[0] <== identitySecret;
    
    signal identityCommitment;
    identityCommitment <== identityHasher.out;
    
    component merkleProof = MerkleTreeInclusionProof(levels);
    merkleProof.leaf <== identityCommitment;
    for (var i = 0; i < levels; i++) {
        merkleProof.pathIndices[i] <== treePathIndices[i];
        merkleProof.siblings[i] <== treeSiblings[i];
    }
    root <== merkleProof.root;
    
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== identityNullifier;
    nullifierHasher.inputs[1] <== externalNullifier;
    nullifierHasher.inputs[2] <== roundId;
    nullifierHash <== nullifierHasher.out;
    
    component signalHasher = Poseidon(3);
    signalHasher.inputs[0] <== roundId;
    signalHasher.inputs[1] <== projectId;
    signalHasher.inputs[2] <== voteCount;
    signalHash <== signalHasher.out;
    
    component identityVerifier = Poseidon(2);
    identityVerifier.inputs[0] <== identitySecret;
    identityVerifier.inputs[1] <== identityNullifier;
    
    signal identityCheck;
    identityCheck <== identityVerifier.out;
}

component main {public [externalNullifier, roundId, projectId, voteCount]} = VotingCircuit(20);