pragma circom 2.1.9;

include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathIndices[levels];
    signal input siblings[levels];
    
    signal output root;
    
    component hashers[levels];
    component mux[levels];
    
    signal hashes[levels + 1];
    hashes[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;
        
        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== hashes[i];
        mux[i].c[0][1] <== siblings[i];
        mux[i].c[1][0] <== siblings[i];
        mux[i].c[1][1] <== hashes[i];
        mux[i].s <== pathIndices[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];
        
        hashes[i + 1] <== hashers[i].out;
    }
    
    root <== hashes[levels];
}