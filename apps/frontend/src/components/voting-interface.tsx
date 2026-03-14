"use client";

import { useEffect, useMemo, useState } from "react";
import { useVoting } from "@/hooks/useVoting";

interface Project {
    id: number;
    owner: string;
    title: string;
    description: string;
    category: string;
    requestedFunding: number;
    receivedFunding: number;
    totalVotes: number;
    createdAt: number;
    status: number;
    metadataURI: string;
}

interface VoteAllocation {
    projectId: number;
    votes: number;
}

const VOICE_CREDITS = 100;

export default function VotingInterface({ projects }: { projects: Project[] }) {
    const [allocations, setAllocations] = useState<Map<number, number>>(new Map());
    const [identity, setIdentity] = useState<{ secret: bigint; nullifier: bigint } | null>(null);
    const [merkleProof, setMerkleProof] = useState<{
        pathIndices: number[];
        siblings: bigint[];
    } | null>(null);
    const [merkleRoot, setMerkleRoot] = useState<bigint | null>(null);

    const {
        submitVote,
        isGeneratingProof,
        isSubmitting,
        isConfirming,
        isSuccess,
        proofError,
        transactionHash,
        calculateQuadraticCost,
        calculateTotalCost,
    } = useVoting();

    useEffect(() => {
        const storedIdentity = localStorage.getItem("voterIdentity");
        if (storedIdentity) {
            const parsed = JSON.parse(storedIdentity);
            setIdentity({
                secret: BigInt(parsed.secret),
                nullifier: BigInt(parsed.nullifier),
            });
        }

        const storedProof = localStorage.getItem("merkleProof");
        if (storedProof) {
            const parsed = JSON.parse(storedProof);
            setMerkleProof({
                pathIndices: parsed.pathIndices,
                siblings: parsed.siblings.map((s: string) => BigInt(s)),
            });
        }

        const storedRoot = localStorage.getItem("merkleRoot");
        if (storedRoot) {
            setMerkleRoot(BigInt(storedRoot));
        }
    }, []);

    const updateVotes = (projectId: number, change: number) => {
        const current = allocations.get(projectId) || 0;
        const newValue = Math.max(0, current + change);

        const newAllocations = new Map(allocations);
        if (newValue === 0) {
            newAllocations.delete(projectId);
        } else {
            newAllocations.set(projectId, newValue);
        }

        setAllocations(newAllocations);
    };

    const getAllocations = (): VoteAllocation[] => {
        return Array.from(allocations.entries()).map(([projectId, votes]) => ({
            projectId,
            votes,
        }));
    };

    const totalCost = useMemo(() => calculateTotalCost(getAllocations()), [allocations, calculateTotalCost]);
    const remainingCredits = VOICE_CREDITS - totalCost;

    const handleSubmitVote = async (projectId: number) => {
        if (!identity || !merkleProof || !merkleRoot) {
            alert("Please register as a voter first");
            return;
        }

        const votes = allocations.get(projectId);
        if (!votes) return;

        await submitVote({ projectId, votes }, identity, merkleProof);
    };

    return (
        <section style={{ marginTop: "2rem" }}>
            <h2>Vote on Projects</h2>
            <p style={{ marginBottom: "1rem", opacity: 0.8 }}>
                Allocate voice credits. Cost grows quadratically for each project.
            </p>

            <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
                <p><strong>Available Credits:</strong> {remainingCredits} / {VOICE_CREDITS}</p>
                <p><strong>Used Credits:</strong> {totalCost}</p>
            </div>

            {proofError && (
                <p style={{ color: "#e02424" }}>Vote failed: {proofError}</p>
            )}

            {isSuccess && transactionHash && (
                <p style={{ color: "#16a34a" }}>
                    Vote submitted. Tx: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
                {projects.map((project) => {
                    const votes = allocations.get(project.id) || 0;
                    const cost = calculateQuadraticCost(votes);
                    const canAdd = remainingCredits >= calculateQuadraticCost(votes + 1) - cost;

                    return (
                        <article key={project.id} style={{ border: "1px solid #3a3a3a", borderRadius: "0.5rem", padding: "1rem" }}>
                            <h3>{project.title}</h3>
                            <p style={{ opacity: 0.75 }}>{project.description}</p>
                            <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                                Votes: {project.totalVotes} | Owner: {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
                            </p>

                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => updateVotes(project.id, -1)}
                                    disabled={votes === 0 || isGeneratingProof || isSubmitting}
                                >
                                    -
                                </button>

                                <p><strong>{votes}</strong> votes ({cost} credits)</p>

                                <button
                                    type="button"
                                    onClick={() => updateVotes(project.id, 1)}
                                    disabled={!canAdd || isGeneratingProof || isSubmitting}
                                >
                                    +
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handleSubmitVote(project.id)}
                                    disabled={votes === 0 || isGeneratingProof || isSubmitting || isConfirming}
                                >
                                    {isGeneratingProof
                                        ? "Generating Proof..."
                                        : isSubmitting
                                            ? "Submitting..."
                                            : isConfirming
                                                ? "Confirming..."
                                                : "Submit Vote"}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
