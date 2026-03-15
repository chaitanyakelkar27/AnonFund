import fs from 'fs';
import path from 'path';
import { ethers, network } from 'hardhat';

async function main() {
    const networkName = network.name;
    console.log(`Deploying Voting contract to ${networkName}...`);

    const frontendPath = path.join(__dirname, '../../frontend/src/contracts');
    
    const verifierData = JSON.parse(
        fs.readFileSync(path.join(frontendPath, 'VotingVerifier.json'), 'utf8')
    );
    const voterRegistryData = JSON.parse(
        fs.readFileSync(path.join(frontendPath, 'VoterRegistry.json'), 'utf8')
    );

    const verifierAddress = verifierData.address;
    const voterRegistryAddress = voterRegistryData.address;

    console.log(`Using VotingVerifier at: ${verifierAddress}`);
    console.log(`Using VoterRegistry at: ${voterRegistryAddress}`);

    const Voting = await ethers.getContractFactory('Voting');
    const voting = await Voting.deploy(verifierAddress, voterRegistryAddress);

    await voting.waitForDeployment();
    const votingAddress = await voting.getAddress();

    console.log(`Voting deployed to: ${votingAddress}`);
    console.log(`Network: ${networkName}`);

    const contractData = {
        address: votingAddress,
        abi: JSON.parse(voting.interface.formatJson())
    };

    fs.mkdirSync(frontendPath, { recursive: true });
    fs.writeFileSync(
        path.join(frontendPath, 'Voting.json'),
        JSON.stringify(contractData, null, 2)
    );

    console.log(`Contract ABI and address saved to: ${path.join(frontendPath, 'Voting.json')}`);

    if (networkName !== 'hardhat' && networkName !== 'localhost') {
        console.log('Waiting for block confirmations...');
        await voting.deploymentTransaction()?.wait(5);
        console.log('Block confirmations received!');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
