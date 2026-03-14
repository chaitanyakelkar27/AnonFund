import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ProofGenerator, type VotingInput } from "@/circuits";
import VotingABI from "@/contracts/Voting.json";

const VOTING_CONTRACT_ADDRESS = (VotingABI.address as `0x${string}`) ?? "0x0000000000000000000000000000000000000000";

interface VoteAllocation {
    projectId: number;
    votes: number;
}

export function useVoting() {
    const { address } = useAccount();
    const [isGeneratingProof, setIsGeneratingProof] = useState(false);
    const [proofError, setProofError] = useState<string | null>(null);

    const { data: hash, writeContract, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const submitVote = async (
        allocation: VoteAllocation,
        identity: { secret: bigint; nullifier: bigint },
        merkleProof: { pathIndices: number[]; siblings: bigint[] }
    ) => {
        if (!address) {
            setProofError("Wallet not connected");
            return;
        }

        if (VOTING_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
            setProofError("Voting contract address is not configured");
            return;
        }

        setIsGeneratingProof(true);
        setProofError(null);

        try {
            const roundId = 1n;
            const externalNullifier = BigInt(allocation.projectId);

            const input: VotingInput = {
                identitySecret: identity.secret,
                identityNullifier: identity.nullifier,
                treePathIndices: merkleProof.pathIndices,
                treeSiblings: merkleProof.siblings,
                roundId,
                projectId: BigInt(allocation.projectId),
                voteCount: BigInt(allocation.votes),
                externalNullifier,
            };

            const proofGenerator = new ProofGenerator();
            const proof = await proofGenerator.generateProof(input);

            setIsGeneratingProof(false);

            const pA: [bigint, bigint] = [BigInt(proof.proof.pi_a[0]), BigInt(proof.proof.pi_a[1])];

            const pB: [[bigint, bigint], [bigint, bigint]] = [
                [BigInt(proof.proof.pi_b[0][1]), BigInt(proof.proof.pi_b[0][0])],
                [BigInt(proof.proof.pi_b[1][1]), BigInt(proof.proof.pi_b[1][0])],
            ];

            const pC: [bigint, bigint] = [BigInt(proof.proof.pi_c[0]), BigInt(proof.proof.pi_c[1])];

            writeContract({
                address: VOTING_CONTRACT_ADDRESS,
                abi: VotingABI.abi,
                functionName: "submitVote",
                args: [
                    pA,
                    pB,
                    pC,
                    BigInt(proof.publicSignals.root),
                    BigInt(proof.publicSignals.nullifierHash),
                    BigInt(proof.publicSignals.signalHash),
                    BigInt(proof.publicSignals.externalNullifier),
                    BigInt(proof.publicSignals.roundId),
                    BigInt(proof.publicSignals.projectId),
                    BigInt(proof.publicSignals.voteCount),
                ],
                gas: 5000000n,
            });
        } catch (error) {
            setIsGeneratingProof(false);
            setProofError(error instanceof Error ? error.message : "Failed to generate proof");
            console.error("Proof generation error:", error);
        }
    };

    const calculateQuadraticCost = (votes: number): number => {
        return votes * votes;
    };

    const calculateTotalCost = (allocations: VoteAllocation[]): number => {
        return allocations.reduce((total, allocation) => {
            return total + calculateQuadraticCost(allocation.votes);
        }, 0);
    };

    return {
        submitVote,
        isGeneratingProof,
        isSubmitting: isPending,
        isConfirming,
        isSuccess,
        proofError,
        transactionHash: hash,
        calculateQuadraticCost,
        calculateTotalCost,
    };
}
