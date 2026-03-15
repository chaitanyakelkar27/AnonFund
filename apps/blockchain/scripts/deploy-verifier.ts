import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

async function main() {
  const networkName = network.name;
  console.log(`Deploying VotingVerifier contract to ${networkName}...`);

  const VotingVerifier = await ethers.getContractFactory("VotingVerifier");
  const verifier = await VotingVerifier.deploy();

  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();

  console.log(`VotingVerifier deployed to: ${verifierAddress}`);
  console.log(`Network: ${networkName}`);

  const contractData = {
    address: verifierAddress,
    abi: JSON.parse(verifier.interface.formatJson()),
  };

  const frontendPath = path.join(__dirname, "../../frontend/src/contracts/VotingVerifier.json");

  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract ABI and address saved to: ${frontendPath}`);

  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    await verifier.deploymentTransaction()?.wait(5);
    console.log("Block confirmations received!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
