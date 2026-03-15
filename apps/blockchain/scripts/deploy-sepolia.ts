import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function waitConfirmations(
  tx: { wait: (confirmations?: number) => Promise<unknown> } | null | undefined,
) {
  if (!tx) {
    return;
  }

  // Wait for 5 confirmations on public networks.
  await tx.wait(5);
}

async function main() {
  if (network.name !== "sepolia") {
    throw new Error(`deploy-sepolia.ts must run on sepolia network, got: ${network.name}`);
  }

  const sepoliaRpcUrl = requireEnv("SEPOLIA_RPC_URL");
  const privateKey = requireEnv("PRIVATE_KEY");
  const anonAadhaarVerifier = requireEnv("ANON_AADHAAR_VERIFIER_ADDRESS");

  if (!anonAadhaarVerifier.startsWith("0x") || anonAadhaarVerifier.length !== 42) {
    throw new Error("ANON_AADHAAR_VERIFIER_ADDRESS must be a valid 0x address");
  }

  console.log("Sepolia deployment preflight passed.");
  console.log(`Using RPC: ${sepoliaRpcUrl.slice(0, 32)}...`);
  console.log(`Using deployer key: ${privateKey.slice(0, 6)}...${privateKey.slice(-4)}`);
  console.log(`Using real AnonAadhaar verifier: ${anonAadhaarVerifier}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  console.log("\nDeploying VoterRegistry...");
  const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
  const voterRegistry = await VoterRegistry.deploy(anonAadhaarVerifier);
  await voterRegistry.waitForDeployment();
  await waitConfirmations(voterRegistry.deploymentTransaction());
  const voterRegistryAddress = await voterRegistry.getAddress();
  console.log(`VoterRegistry: ${voterRegistryAddress}`);

  console.log("\nDeploying VotingVerifier...");
  const VotingVerifier = await ethers.getContractFactory("VotingVerifier");
  const votingVerifier = await VotingVerifier.deploy();
  await votingVerifier.waitForDeployment();
  await waitConfirmations(votingVerifier.deploymentTransaction());
  const votingVerifierAddress = await votingVerifier.getAddress();
  console.log(`VotingVerifier: ${votingVerifierAddress}`);

  console.log("\nDeploying Voting...");
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(votingVerifierAddress, voterRegistryAddress);
  await voting.waitForDeployment();
  await waitConfirmations(voting.deploymentTransaction());
  const votingAddress = await voting.getAddress();
  console.log(`Voting: ${votingAddress}`);

  console.log("\nDeploying Project...");
  const Project = await ethers.getContractFactory("Project");
  const project = await Project.deploy();
  await project.waitForDeployment();
  await waitConfirmations(project.deploymentTransaction());
  const projectAddress = await project.getAddress();
  console.log(`Project: ${projectAddress}`);

  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  fs.mkdirSync(frontendContractsDir, { recursive: true });

  fs.writeFileSync(
    path.join(frontendContractsDir, "VoterRegistry.json"),
    JSON.stringify(
      {
        address: voterRegistryAddress,
        abi: JSON.parse(voterRegistry.interface.formatJson()),
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(frontendContractsDir, "VotingVerifier.json"),
    JSON.stringify(
      {
        address: votingVerifierAddress,
        abi: JSON.parse(votingVerifier.interface.formatJson()),
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(frontendContractsDir, "Voting.json"),
    JSON.stringify(
      {
        address: votingAddress,
        abi: JSON.parse(voting.interface.formatJson()),
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(frontendContractsDir, "Project.json"),
    JSON.stringify(
      {
        address: projectAddress,
        abi: JSON.parse(project.interface.formatJson()),
      },
      null,
      2,
    ),
  );

  console.log("\nDeployment complete. Frontend contract artifacts updated.");
  console.log("Summary:");
  console.log(`- VoterRegistry: ${voterRegistryAddress}`);
  console.log(`- VotingVerifier: ${votingVerifierAddress}`);
  console.log(`- Voting: ${votingAddress}`);
  console.log(`- Project: ${projectAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
