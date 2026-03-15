import { groth16 } from "snarkjs";
import { poseidon1, poseidon3 } from "poseidon-lite";

export interface VotingInput {
    roundId: bigint;
    projectId: bigint;
    voteCount: bigint;
    identitySecret: bigint;
    treeSiblings: bigint[];
    treePathIndices: number[];
    identityNullifier: bigint;
    externalNullifier: bigint;
}

export interface VotingProof {
    proof: {
        curve: string;
        pi_a: string[];
        pi_c: string[];
        protocol: string;
        pi_b: string[][];
    };
    publicSignals: {
        root: string;
        nullifierHash: string;
        signalHash: string;
        externalNullifier: string;
        roundId: string;
        projectId: string;
        voteCount: string;
    };
}

export class ProofGenerator {
    private wasmPath: string;
    private zkeyPath: string;

    constructor() {
        this.wasmPath = "/circuits/voting_js/voting.wasm";
        this.zkeyPath = "/circuits/voting.zkey";
    }

    async generateProof(input: VotingInput): Promise<VotingProof> {
        const fullInput = {
            identitySecret: input.identitySecret.toString(),
            identityNullifier: input.identityNullifier.toString(),
            treePathIndices: input.treePathIndices,
            treeSiblings: input.treeSiblings.map((s) => s.toString()),
            roundId: input.roundId.toString(),
            projectId: input.projectId.toString(),
            voteCount: input.voteCount.toString(),
            externalNullifier: input.externalNullifier.toString(),
        };

        const { proof, publicSignals } = await groth16.fullProve(
            fullInput,
            this.wasmPath,
            this.zkeyPath
        );

        return {
            proof,
            publicSignals: {
                root: publicSignals[0],
                nullifierHash: publicSignals[1],
                signalHash: publicSignals[2],
                externalNullifier: publicSignals[3],
                roundId: publicSignals[4],
                projectId: publicSignals[5],
                voteCount: publicSignals[6],
            },
        };
    }
}

export interface Identity {
    secret: bigint;
    nullifier: bigint;
    commitment: bigint;
}

export function generateIdentityCommitment(_secret: bigint): bigint {
    return poseidon1([_secret]);
}

export function generateNullifierHash(
    identityNullifier: bigint,
    externalNullifier: bigint,
    roundId: bigint
): bigint {
    return poseidon3([identityNullifier, externalNullifier, roundId]);
}

export function generateSignalHash(
    roundId: bigint,
    projectId: bigint,
    voteCount: bigint
): bigint {
    return poseidon3([roundId, projectId, voteCount]);
}

export function generateIdentity(): Identity {
    const secret = BigInt(
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join("")
    );

    const nullifier = BigInt(
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join("")
    );

    const commitment = generateIdentityCommitment(secret);

    return { secret, nullifier, commitment };
}
