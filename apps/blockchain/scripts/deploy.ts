import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

async function main() {
  const networkName = network.name;
  let verifierAddress = process.env.ANON_AADHAAR_VERIFIER_ADDRESS;

  if (networkName === "hardhat" || networkName === "localhost") {
    console.log(
      `Deploying MockAnonAadhaarVerifier contract out to ${networkName}...`,
    );
    const MockVerifier = await ethers.getContractFactory(
      "MockAnonAadhaarVerifier",
    );
    const mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();
    verifierAddress = await mockVerifier.getAddress();
    console.log(`MockAnonAadhaarVerifier deployed to: ${verifierAddress}`);
  } else {
    if (!verifierAddress) {
      throw new Error(
        "ANON_AADHAAR_VERIFIER_ADDRESS is required for non-local deployments",
      );
    }
    console.log(`Using configured AnonAadhaar verifier: ${verifierAddress}`);
  }

  console.log(`Deploying VoterRegistry contract to ${networkName}...`);

  const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
  const voterRegistry = await VoterRegistry.deploy(verifierAddress);
  await voterRegistry.waitForDeployment();

  const address = await voterRegistry.getAddress();
  console.log(`VoterRegistry deployed to: ${address}`);
  console.log(`Network: ${networkName}`);

  const contractData = {
    address: address,
    abi: JSON.parse(voterRegistry.interface.formatJson()),
  };

  const frontendPath = path.join(
    __dirname,
    "../../frontend/src/contracts/VoterRegistry.json",
  );

  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract ABI and address saved to: ${frontendPath}`);

  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    await voterRegistry.deploymentTransaction()?.wait(5);
    console.log("Block confirmations received!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
