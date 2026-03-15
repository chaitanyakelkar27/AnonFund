import VoterRegistryData from "./VoterRegistry.json";
import ProjectData from "./Project.json";

export const VOTER_REGISTRY_ABI = VoterRegistryData.abi;
export const VOTER_REGISTRY_ADDRESS = VoterRegistryData.address as `0x${string}`;

export const PROJECT_ABI = ProjectData.abi;
export const PROJECT_ADDRESS = ProjectData.address as `0x${string}`;

export type NullifierData = {
  isUsed: boolean;
  registeredAt: bigint;
};
