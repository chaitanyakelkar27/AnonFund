import fs from "fs";
import path from "path";
import { groth16 } from "snarkjs";
import { webcrypto } from "crypto";
import { poseidon2, poseidon3 } from "poseidon-lite";

export interface VotingInput {
  roundId: bigint;
  projectId: bigint;
  voteCount: bigint;
  treeSiblings: bigint[];
  identitySecret: bigint;
  identityNullifier: bigint;
  treePathIndices: number[];
  externalNullifier: bigint;
}

export interface VotingProof {
  proof: {
    curve: string;
    pi_a: string[];
    pi_c: string[];
    pi_b: string[][];
    protocol: string;
  };
  publicSignals: {
    root: string;
    roundId: string;
    voteCount: string;
    projectId: string;
    signalHash: string;
    nullifierHash: string;
    externalNullifier: string;
  };
}

export class ProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;
  private vkeyPath: string;

  constructor(artifactsDir: string) {
    this.wasmPath = path.join(artifactsDir, "voting_js", "voting.wasm");
    this.zkeyPath = path.join(artifactsDir, "voting.zkey");
    this.vkeyPath = path.join(artifactsDir, "voting_vkey.json");
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

  async verifyProof(proof: VotingProof): Promise<boolean> {
    const vkey = JSON.parse(fs.readFileSync(this.vkeyPath, "utf8"));

    const publicSignals = [
      proof.publicSignals.root,
      proof.publicSignals.nullifierHash,
      proof.publicSignals.signalHash,
      proof.publicSignals.externalNullifier,
      proof.publicSignals.roundId,
      proof.publicSignals.projectId,
      proof.publicSignals.voteCount,
    ];

    return await groth16.verify(vkey, publicSignals, proof.proof);
  }
}

export function generateIdentityCommitment(secret: bigint): bigint {
  return poseidon2([secret, BigInt(0)]);
}

export function generateNullifierHash(
  identityNullifier: bigint,
  externalNullifier: bigint,
  roundId: bigint
): bigint {
  return poseidon3([identityNullifier, externalNullifier, roundId]);
}

export function generateSignalHash(roundId: bigint, projectId: bigint, voteCount: bigint): bigint {
  return poseidon3([roundId, projectId, voteCount]);
}

export interface Identity {
  secret: bigint;
  nullifier: bigint;
  commitment: bigint;
}

export function generateIdentity(): Identity {
  const secret = BigInt(
    "0x" +
      Array.from(webcrypto.getRandomValues(new Uint8Array(32)))
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("")
  );

  const nullifier = BigInt(
    "0x" +
      Array.from(webcrypto.getRandomValues(new Uint8Array(32)))
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("")
  );

  const commitment = generateIdentityCommitment(secret);

  return { secret, nullifier, commitment };
}