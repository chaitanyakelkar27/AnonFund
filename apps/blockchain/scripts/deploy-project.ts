async function main(): Promise<void> {
    console.log("Project deployment script ready.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
