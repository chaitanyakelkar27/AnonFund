"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ProtectedRoute } from "@/components/protected-route";
import { ModeToggle } from "@/components/mode-toggle";
import { PROJECT_ABI, PROJECT_ADDRESS } from "@/contracts";
import { useVoting } from "@/hooks/useVoting";
import { useWallet } from "@/hooks/use-wallet";
import styles from "../dashboard.module.css";

type ProjectStatus = "Pending" | "Active" | "Funded" | "Completed";

type ProjectItem = {
    id: number;
    title: string;
    description: string;
    category: string;
    requestedFunding: string;
    currentFunding: string;
    status: ProjectStatus;
    contributorsCount: number;
    milestonesCount: number;
    imageUrl?: string;
};

type VoterIdentity = {
    secret: bigint;
    nullifier: bigint;
};

type MerkleProof = {
    pathIndices: number[];
    siblings: bigint[];
};

type LocalStoredProject = {
    id: number;
    title: string;
    description: string;
    category: string;
    requestedFunding: string;
    imageUrl?: string;
    milestonesCount?: number;
};

function isConfiguredContract(address: `0x${string}`, abi: unknown[]): boolean {
    return address !== "0x0000000000000000000000000000000000000000" && abi.length > 0;
}

function normalizeIpfsUrl(value: string | undefined): string {
    if (!value) {
        return "";
    }

    if (value.startsWith("ipfs://")) {
        return `https://ipfs.io/ipfs/${value.replace("ipfs://", "")}`;
    }

    return value;
}

function parseStatus(status: number): ProjectStatus {
    switch (status) {
        case 1:
            return "Active";
        case 2:
            return "Funded";
        case 3:
            return "Completed";
        default:
            return "Pending";
    }
}

// Read local projects removed as requested

function getStatusClass(status: ProjectStatus): string {
    switch (status) {
        case "Active":
            return `${styles.statusBadge} ${styles.statusActive}`;
        case "Funded":
            return `${styles.statusBadge} ${styles.statusFunded}`;
        case "Completed":
            return `${styles.statusBadge} ${styles.statusCompleted}`;
        default:
            return `${styles.statusBadge} ${styles.statusPending}`;
    }
}

export default function ProjectsPage(): React.JSX.Element {
    const { address } = useAccount();
    const { isConnected, voiceCredits, connect, disconnect } = useWallet();

    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [allocations, setAllocations] = useState<Map<number, number>>(new Map());
    const [projectVotes, setProjectVotes] = useState<Map<number, number>>(new Map());

    const [identity, setIdentity] = useState<VoterIdentity | null>(null);
    const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null);

    const hasProjectContract = isConfiguredContract(PROJECT_ADDRESS, PROJECT_ABI);

    const { data: allProjectsData, isLoading } = useReadContract({
        address: PROJECT_ADDRESS,
        abi: PROJECT_ABI,
        functionName: "getAllProjects",
        query: {
            enabled: hasProjectContract,
        },
    });

    const {
        submitVote,
        isGeneratingProof,
        isSubmitting,
        isConfirming,
        isSuccess,
        proofError,
        calculateTotalCost,
    } = useVoting();

    useEffect(() => {

        const storedIdentity = window.localStorage.getItem("voterIdentity");
        const storedProof = window.localStorage.getItem("merkleProof");

        if (storedIdentity) {
            try {
                const parsed = JSON.parse(storedIdentity) as { secret: string; nullifier: string };
                setIdentity({
                    secret: BigInt(parsed.secret),
                    nullifier: BigInt(parsed.nullifier),
                });
            } catch {
                setIdentity(null);
            }
        }

        if (storedProof) {
            try {
                const parsed = JSON.parse(storedProof) as { pathIndices: number[]; siblings: string[] };
                setMerkleProof({
                    pathIndices: parsed.pathIndices,
                    siblings: parsed.siblings.map((value) => BigInt(value)),
                });
            } catch {
                setMerkleProof(null);
            }
        }
    }, []);

    useEffect(() => {
        if (!allProjectsData || !Array.isArray(allProjectsData)) {
            return;
        }

        const chainProjects = (allProjectsData as Array<Record<string, unknown>>)
            .map((projectData): ProjectItem | null => {
                const id = Number(projectData.id);
                const requestedFundingRaw = projectData.requestedFunding as bigint | undefined;
                const currentFundingRaw = projectData.receivedFunding as bigint | undefined;
                const statusRaw = Number(projectData.status ?? 0);
                const metadataUri = String(projectData.metadataURI ?? "");

                if (!id) {
                    return null;
                }

                let parsedMetadata: any = null;
                try {
                    if (metadataUri.startsWith("{")) {
                        parsedMetadata = JSON.parse(metadataUri);
                    }
                } catch {
                    // Ignore parsing errors for old/invalid test data
                }

                const title = parsedMetadata?.title;
                const description = parsedMetadata?.description;

                // Filter out dummy/test projects that don't have proper parsed metadata
                if (!title || !description) {
                    return null;
                }

                return {
                    id,
                    title: title,
                    description: description,
                    category: parsedMetadata.category || "other",
                    requestedFunding: requestedFundingRaw ? (Number(requestedFundingRaw) / 1e18).toFixed(2) : "0",
                    currentFunding: currentFundingRaw ? (Number(currentFundingRaw) / 1e18).toFixed(2) : "0",
                    status: parseStatus(statusRaw),
                    contributorsCount: 0,
                    milestonesCount: Array.isArray(parsedMetadata.milestones) ? parsedMetadata.milestones.length : 0,
                    imageUrl: parsedMetadata.imageUrl ? normalizeIpfsUrl(parsedMetadata.imageUrl) : undefined,
                };
            })
            .filter((project): project is ProjectItem => project !== null);

        if (chainProjects.length > 0) {
            setProjects(chainProjects);
        }
    }, [allProjectsData]);

    useEffect(() => {
        if (!isSuccess) {
            return;
        }

        setProjectVotes((current) => {
            const updated = new Map(current);
            for (const [projectId, votes] of allocations.entries()) {
                updated.set(projectId, (updated.get(projectId) ?? 0) + votes);
            }
            return updated;
        });

        setAllocations(new Map());
    }, [isSuccess, allocations]);

    const filteredProjects = useMemo(() => {
        let current = projects;

        if (searchTerm) {
            const normalized = searchTerm.toLowerCase();
            current = current.filter(
                (project) =>
                    project.title.toLowerCase().includes(normalized) ||
                    project.description.toLowerCase().includes(normalized)
            );
        }

        if (categoryFilter !== "all") {
            current = current.filter((project) => project.category === categoryFilter);
        }

        if (statusFilter !== "all") {
            current = current.filter((project) => project.status === statusFilter);
        }

        return current;
    }, [projects, searchTerm, categoryFilter, statusFilter]);

    const totalCost = calculateTotalCost(
        Array.from(allocations.entries()).map(([projectId, votes]) => ({
            projectId,
            votes,
        }))
    );

    const totalCredits = Math.max(0, voiceCredits);
    const remainingCredits = totalCredits - totalCost;

    const updateVotes = (projectId: number, change: number) => {
        setAllocations((current) => {
            const next = new Map(current);
            const newValue = Math.max(0, (next.get(projectId) ?? 0) + change);
            if (newValue === 0) {
                next.delete(projectId);
            } else {
                next.set(projectId, newValue);
            }
            return next;
        });
    };

    const submitVoteForProject = async (projectId: number) => {
        if (!identity || !merkleProof) {
            window.alert("Please register as a voter first.");
            return;
        }

        const votes = allocations.get(projectId);
        if (!votes) {
            return;
        }

        await submitVote({ projectId, votes }, identity, merkleProof);
    };

    const handleWalletButton = () => {
        if (isConnected) {
            disconnect();
            return;
        }

        void connect();
    };

    return (
        <ProtectedRoute>
            <main className={styles.page}>
                <nav className={styles.nav}>
                    <div className={styles.navInner}>
                        <Link href="/dashboard" className={styles.brand}>
                            <span className={styles.brandMark}>A</span>
                            <span>AnonFund</span>
                        </Link>
                        <div className={styles.navActions}>
                            <Link href="/dashboard" className={styles.navBtn}>
                                Dashboard
                            </Link>
                            <button
                                type="button"
                                className={styles.navBtn}
                                onClick={handleWalletButton}
                            >
                                {isConnected ? "Disconnect" : "Connect wallet"}
                            </button>
                            <span className={styles.chip}>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</span>
                            <ModeToggle className={styles.navBtn} />
                        </div>
                    </div>
                </nav>

                <section className={`${styles.shell} ${styles.main}`}>
                    <Link href="/dashboard" className={styles.backLink}>
                        Back to dashboard
                    </Link>

                    <div className={styles.heroRow}>
                        <div>
                            <h1 className={styles.title}>Public goods projects</h1>
                            <p className={styles.subtitle}>Discover and support projects building the future of Web3</p>
                        </div>
                        <Link href="/dashboard/submit-project" className={styles.buttonPrimary}>
                            Submit project
                        </Link>
                    </div>

                    <section className={`${styles.panel} ${styles.filterBar}`}>
                        <input
                            type="text"
                            placeholder="Search projects"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className={styles.input}
                        />
                        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={styles.select}>
                            <option value="all">All categories</option>
                            <option value="infrastructure">Infrastructure</option>
                            <option value="tools">Developer tools</option>
                            <option value="education">Education</option>
                            <option value="community">Community</option>
                            <option value="research">Research</option>
                            <option value="other">Other</option>
                        </select>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={styles.select}>
                            <option value="all">All status</option>
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Funded">Funded</option>
                            <option value="Completed">Completed</option>
                        </select>
                        <div className={styles.infoChip}>Credits: {Math.max(0, remainingCredits)} / {totalCredits}</div>
                    </section>

                    <p className={styles.countText}>Showing {filteredProjects.length} of {projects.length} projects</p>

                    {proofError && <div className={styles.bannerError}>{proofError}</div>}

                    {isLoading && hasProjectContract ? (
                        <section className={styles.panel}>Loading projects...</section>
                    ) : filteredProjects.length === 0 ? (
                        <section className={styles.panel}>
                            <h3 className={styles.sectionTitle}>No projects found</h3>
                            <p className={styles.sectionLead}>Be the first to submit a project proposal.</p>
                            <Link href="/dashboard/submit-project" className={styles.buttonPrimary}>
                                Submit your project
                            </Link>
                        </section>
                    ) : (
                        <section className={styles.projectGrid}>
                            {filteredProjects.map((project) => {
                                const allocatedVotes = allocations.get(project.id) ?? 0;
                                const canIncrease = remainingCredits >= allocatedVotes * 2 + 1;

                                return (
                                    <article key={project.id} className={styles.projectCard}>
                                        {project.imageUrl ? (
                                            <img src={project.imageUrl} alt={project.title} className={styles.projectImage} />
                                        ) : (
                                            <div className={styles.projectFallback}>{project.title}</div>
                                        )}

                                        <div className={styles.projectBody}>
                                            <div className={styles.projectHead}>
                                                <h2 className={styles.projectTitle}>{project.title}</h2>
                                                <span className={getStatusClass(project.status)}>{project.status}</span>
                                            </div>

                                            <p className={styles.projectDescription}>{project.description}</p>

                                            <div className={styles.progressRow}>
                                                <span>Funding progress</span>
                                                <span>{project.currentFunding} / {project.requestedFunding} ETH</span>
                                            </div>

                                            <div className={styles.progressTrack}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (Number(project.currentFunding || "0") / Number(project.requestedFunding || "1")) * 100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.metaRow}>
                                                <div>
                                                    <span className={styles.metaLabel}>Contributors</span>
                                                    <span className={styles.metaValue}>{project.contributorsCount}</span>
                                                </div>
                                                <div>
                                                    <span className={styles.metaLabel}>Votes</span>
                                                    <span className={styles.metaValue}>{projectVotes.get(project.id) ?? 0}</span>
                                                </div>
                                                <div>
                                                    <span className={styles.metaLabel}>Milestones</span>
                                                    <span className={styles.metaValue}>{project.milestonesCount}</span>
                                                </div>
                                            </div>

                                            <div className={styles.metaFooter}>
                                                <span className={styles.categoryTag}>{project.category}</span>
                                                <span className={styles.projectId}>Project #{project.id}</span>
                                            </div>
                                        </div>

                                        {identity ? (
                                            <div className={styles.votePanel}>
                                                <div className={styles.voteHead}>
                                                    <p className={styles.voteTitle}>Allocate your votes</p>
                                                    {allocatedVotes > 0 && <span className={styles.voteCost}>Cost: {allocatedVotes ** 2} credits</span>}
                                                </div>

                                                <div className={styles.voteControls}>
                                                    <button type="button" className={styles.smallBtn} onClick={() => updateVotes(project.id, -1)} disabled={allocatedVotes <= 0}>
                                                        -
                                                    </button>
                                                    <span className={styles.counter}>{allocatedVotes}</span>
                                                    <button type="button" className={styles.smallBtn} onClick={() => updateVotes(project.id, 1)} disabled={!canIncrease}>
                                                        +
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.voteBtn}
                                                        onClick={() => void submitVoteForProject(project.id)}
                                                        disabled={!allocatedVotes || isGeneratingProof || isSubmitting || isConfirming}
                                                    >
                                                        {isGeneratingProof ? "Proving..." : isSubmitting || isConfirming ? "Submitting..." : "Submit vote"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.registerNote}>
                                                <Link href="/register">Register as a voter</Link> to participate in voting.
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </section>
            </main>
        </ProtectedRoute>
    );
}
