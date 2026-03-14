async function main(): Promise<void> {
    console.log("Deploy entry script ready.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
