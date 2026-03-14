async function main(): Promise<void> {
    console.log("Voting deployment script ready.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
