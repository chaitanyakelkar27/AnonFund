import { ethers } from "hardhat";
import ProjectArtifact from "../artifacts/contracts/Project.sol/Project.json";

// Update this with your deployed Project contract address
const PROJECT_ADDRESS = "0x76bbECaae5d377DE991a9e61670DF6A79593a8A9";

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("Updating project status with account:", owner.address);

    // Get the contract instance
    const project = await ethers.getContractAt(ProjectArtifact.abi, PROJECT_ADDRESS);

    // Get the project ID from command line args or default to 3
    const projectId = process.env.PROJECT_ID ? BigInt(process.env.PROJECT_ID) : 3n;
    
    console.log(`\nUpdating project ${projectId} to Active status...`);
    
    try {
        // ProjectStatus enum: 0=Pending, 1=Active, 2=Funded, 3=Completed, 4=Cancelled
        const tx = await project.updateProjectStatus(projectId, 1); // 1 = Active
        console.log("Transaction hash:", tx.hash);
        
        await tx.wait();
        console.log("✅ Project status updated to Active!");
        
        // Verify the update
        const projectData = await project.getProject(projectId);
        console.log("\nProject details:");
        console.log("- ID:", projectData.id.toString());
        console.log("- Status:", projectData.status, "(0=Pending, 1=Active, 2=Funded, 3=Completed, 4=Cancelled)");
        console.log("- Metadata URI:", projectData.metadataURI);
    } catch (error: any) {
        console.error("Error:", error.message);
        
        if (error.message.includes("Only contract owner")) {
            console.log("\n❌ You are not the contract owner!");
            console.log("Current account:", owner.address);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
