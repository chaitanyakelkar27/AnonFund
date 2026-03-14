declare module "snarkjs" {
    export const groth16: {
        fullProve: (
            input: Record<string, unknown>,
            wasmPath: string,
            zkeyPath: string
        ) => Promise<{
            proof: {
                curve: string;
                pi_a: string[];
                pi_b: string[][];
                pi_c: string[];
                protocol: string;
            };
            publicSignals: string[];
        }>;
    };
}
