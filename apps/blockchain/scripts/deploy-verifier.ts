async function main(): Promise<void> {
    console.log("Verifier deployment script ready.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
