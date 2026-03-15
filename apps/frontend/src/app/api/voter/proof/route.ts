import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { poseidon1, poseidon2 } from "poseidon-lite";
import VoterRegistry from "@/contracts/VoterRegistry.json";

export const runtime = "nodejs";

const TREE_LEVELS = 20;
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "voter-registry.json");

const VOTER_REGISTRY_ABI = [
  {
    type: "function",
    name: "isNullifierUsed",
    stateMutability: "view",
    inputs: [{ name: "nullifier", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type PersistedVoter = {
  anonNullifier: string;
  identitySecret: string;
  identityNullifier: string;
  commitment: string;
  createdAt: number;
};

type PersistedState = {
  voters: PersistedVoter[];
};

type ProofPayload = {
  anonNullifier?: unknown;
  identitySecret?: unknown;
  identityNullifier?: unknown;
};

function isNumericString(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

function getRegistryAddress(): `0x${string}` | null {
  const fromEnv = process.env.NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS ?? process.env.VOTER_REGISTRY_ADDRESS;
  const fromContract = (VoterRegistry as { address?: string }).address;
  const candidate = fromEnv ?? fromContract;

  if (typeof candidate !== "string" || !candidate.startsWith("0x") || candidate.length !== 42) {
    return null;
  }

  return candidate as `0x${string}`;
}

function buildZeroValues(levels: number): bigint[] {
  const zeroValues: bigint[] = [0n];

  for (let i = 1; i <= levels; i++) {
    zeroValues.push(poseidon2([zeroValues[i - 1], zeroValues[i - 1]]));
  }

  return zeroValues;
}

function computeMerkleProof(commitments: bigint[], leafIndex: number, levels: number) {
  const zeroValues = buildZeroValues(levels);
  const pathIndices: number[] = [];
  const siblings: bigint[] = [];

  let currentLevel = new Map<number, bigint>();
  commitments.forEach((commitment, index) => {
    currentLevel.set(index, commitment);
  });

  let currentIndex = leafIndex;

  for (let level = 0; level < levels; level++) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    const sibling = currentLevel.get(siblingIndex) ?? zeroValues[level];

    pathIndices.push(currentIndex % 2);
    siblings.push(sibling);

    const nextLevel = new Map<number, bigint>();
    const visited = new Set<number>();

    for (const [index, value] of currentLevel.entries()) {
      if (visited.has(index)) {
        continue;
      }

      const leftIndex = index % 2 === 0 ? index : index - 1;
      const rightIndex = leftIndex + 1;
      const left = currentLevel.get(leftIndex) ?? (index === leftIndex ? value : zeroValues[level]);
      const right = currentLevel.get(rightIndex) ?? zeroValues[level];

      nextLevel.set(Math.floor(leftIndex / 2), poseidon2([left, right]));
      visited.add(leftIndex);
      visited.add(rightIndex);
    }

    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  const root = currentLevel.get(0) ?? zeroValues[levels];

  return {
    root,
    pathIndices,
    siblings,
  };
}

async function readState(): Promise<PersistedState> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as PersistedState;

    if (!parsed || !Array.isArray(parsed.voters)) {
      return { voters: [] };
    }

    return parsed;
  } catch {
    return { voters: [] };
  }
}

async function writeState(state: PersistedState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

async function verifyOnChainRegistration(anonNullifier: bigint): Promise<boolean> {
  const registryAddress = getRegistryAddress();

  if (!registryAddress) {
    return false;
  }

  const rpcUrl = process.env.RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const isUsed = await client.readContract({
    address: registryAddress,
    abi: VOTER_REGISTRY_ABI,
    functionName: "isNullifierUsed",
    args: [anonNullifier],
  });

  return Boolean(isUsed);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProofPayload;

    if (!isNumericString(body.anonNullifier) || !isNumericString(body.identitySecret) || !isNumericString(body.identityNullifier)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const anonNullifier = body.anonNullifier;
    const identitySecret = body.identitySecret;
    const identityNullifier = body.identityNullifier;

    const isRegistered = await verifyOnChainRegistration(BigInt(anonNullifier));
    if (!isRegistered) {
      return NextResponse.json(
        { error: "Identity is not registered on-chain yet" },
        { status: 403 },
      );
    }

    const state = await readState();
    const existingIndex = state.voters.findIndex((voter) => voter.anonNullifier === anonNullifier);

    if (existingIndex >= 0) {
      const existing = state.voters[existingIndex];
      if (existing.identitySecret !== identitySecret || existing.identityNullifier !== identityNullifier) {
        return NextResponse.json(
          { error: "Identity mismatch for registered nullifier" },
          { status: 409 },
        );
      }
    } else {
      state.voters.push({
        anonNullifier,
        identitySecret,
        identityNullifier,
        commitment: poseidon1([BigInt(identitySecret)]).toString(),
        createdAt: Date.now(),
      });

      await writeState(state);
    }

    const voterIndex = state.voters.findIndex((voter) => voter.anonNullifier === anonNullifier);
    if (voterIndex < 0) {
      return NextResponse.json({ error: "Unable to locate voter in registry" }, { status: 500 });
    }

    const commitments = state.voters.map((voter) => BigInt(voter.commitment));
    const merkle = computeMerkleProof(commitments, voterIndex, TREE_LEVELS);

    return NextResponse.json({
      identity: {
        secret: identitySecret,
        nullifier: identityNullifier,
      },
      merkleProof: {
        pathIndices: merkle.pathIndices,
        siblings: merkle.siblings.map((value) => value.toString()),
      },
      merkleRoot: merkle.root.toString(),
      leafIndex: voterIndex,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
