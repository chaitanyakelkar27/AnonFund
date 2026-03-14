import Project from "./Project.json";
import VoterRegistry from "./VoterRegistry.json";
import Voting from "./Voting.json";
import VotingVerifier from "./VotingVerifier.json";

function parseAddress(value: unknown): `0x${string}` {
    if (typeof value === "string" && value.startsWith("0x") && value.length === 42) {
        return value as `0x${string}`;
    }

    return "0x0000000000000000000000000000000000000000";
}

export const PROJECT_ADDRESS = parseAddress((Project as { address?: string }).address);
export const PROJECT_ABI = (Project as { abi?: unknown[] }).abi ?? [];

export const VOTER_REGISTRY_ADDRESS = parseAddress((VoterRegistry as { address?: string }).address);
export const VOTER_REGISTRY_ABI = (VoterRegistry as { abi?: unknown[] }).abi ?? [];

export const VOTING_ADDRESS = parseAddress((Voting as { address?: string }).address);
export const VOTING_ABI = (Voting as { abi?: unknown[] }).abi ?? [];

export const VOTING_VERIFIER_ADDRESS = parseAddress((VotingVerifier as { address?: string }).address);
export const VOTING_VERIFIER_ABI = (VotingVerifier as { abi?: unknown[] }).abi ?? [];
