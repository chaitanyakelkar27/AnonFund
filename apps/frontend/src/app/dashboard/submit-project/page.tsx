"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { PROJECT_ABI, PROJECT_ADDRESS } from "@/contracts";
import styles from "../dashboard.module.css";

type Milestone = {
    title: string;
    description: string;
    fundingAmount: string;
    deadline: string;
    deliverables: string[];
};

type TeamMember = {
    name: string;
    role: string;
};

type ProjectMetadata = {
    title: string;
    description: string;
    milestones: Milestone[];
    teamInfo: TeamMember[];
    requestedFunding: string;
    category: string;
    imageUrl?: string;
};

type LocalStoredProject = {
    id: number;
    title: string;
    description: string;
    category: string;
    requestedFunding: string;
    imageUrl?: string;
    milestonesCount: number;
    createdAt: number;
};

function isConfiguredContract(address: `0x${string}`, abi: unknown[]): boolean {
    return address !== "0x0000000000000000000000000000000000000000" && abi.length > 0;
}

function storeProjectLocally(project: LocalStoredProject): void {
    if (typeof window === "undefined") {
        return;
    }

    const raw = window.localStorage.getItem("anonfund.projects");
    const current: LocalStoredProject[] = raw ? (JSON.parse(raw) as LocalStoredProject[]) : [];
    window.localStorage.setItem("anonfund.projects", JSON.stringify([project, ...current]));
}

export default function SubmitProjectPage(): React.JSX.Element {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [requestedFunding, setRequestedFunding] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [milestoneDescription, setMilestoneDescription] = useState("");
    const [milestoneDeadline, setMilestoneDeadline] = useState("");

    const [teamName, setTeamName] = useState("");
    const [teamRole, setTeamRole] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [localSuccess, setLocalSuccess] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const hasProjectContract = isConfiguredContract(PROJECT_ADDRESS, PROJECT_ABI);

    useEffect(() => {
        if (isSuccess || localSuccess) {
            const timeout = window.setTimeout(() => {
                router.push("/dashboard/projects");
            }, 1800);

            return () => window.clearTimeout(timeout);
        }

        return;
    }, [isSuccess, localSuccess, router]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setImageFile(file);

        if (!file) {
            setImagePreview("");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(String(reader.result));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        setLocalError(null);

        try {
            const metadata: ProjectMetadata = {
                title,
                description,
                milestones: milestoneTitle
                    ? [
                        {
                            title: milestoneTitle,
                            description: milestoneDescription,
                            fundingAmount: requestedFunding,
                            deadline: milestoneDeadline,
                            deliverables: milestoneDescription ? [milestoneDescription] : [],
                        },
                    ]
                    : [],
                teamInfo: teamName
                    ? [
                        {
                            name: teamName,
                            role: teamRole,
                        },
                    ]
                    : [],
                requestedFunding,
                category,
                imageUrl: imagePreview || undefined,
            };

            const localProject: LocalStoredProject = {
                id: Date.now(),
                title: metadata.title,
                description: metadata.description,
                category: metadata.category,
                requestedFunding: metadata.requestedFunding,
                imageUrl: metadata.imageUrl,
                milestonesCount: metadata.milestones.length,
                createdAt: Date.now(),
            };

            storeProjectLocally(localProject);

            if (hasProjectContract) {
                writeContract({
                    address: PROJECT_ADDRESS,
                    abi: PROJECT_ABI,
                    functionName: "submitProject",
                    args: [JSON.stringify(metadata), parseEther(requestedFunding || "0")],
                });
            } else {
                setLocalSuccess(true);
            }
        } catch (submitError) {
            const fallbackMessage = submitError instanceof Error ? submitError.message : "Failed to submit project";
            setLocalError(fallbackMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const isSubmitting = isSaving || isPending || isConfirming;

    const submitLabel = useMemo(() => {
        if (isSaving) {
            return "Saving project...";
        }

        if (isPending) {
            return "Confirm in wallet...";
        }

        if (isConfirming) {
            return "Submitting on-chain...";
        }

        return "Submit project";
    }, [isSaving, isPending, isConfirming]);

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
                            <ModeToggle className={styles.navBtn} />
                        </div>
                    </div>
                </nav>

                <section className={`${styles.shell} ${styles.main}`}>
                    <div>
                        <Link href="/dashboard" className={styles.backLink}>
                            Back to dashboard
                        </Link>
                        <h1 className={styles.title}>New project</h1>
                        <p className={styles.subtitle}>Describe your project and submit it for quadratic funding.</p>
                    </div>

                    {(isSuccess || localSuccess) && (
                        <div className={styles.bannerSuccess}>
                            Project submitted. Redirecting to projects...
                        </div>
                    )}

                    {(error || localError) && (
                        <div className={styles.bannerError}>{error?.message ?? localError}</div>
                    )}

                    {!hasProjectContract && (
                        <div className={styles.bannerWarn}>
                            Contract is not configured. Submission will be stored locally for demo mode.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <section className={`${styles.panel} ${styles.formPanel}`}>
                            <h2 className={styles.panelTitle}>Project details</h2>
                            <p className={styles.panelLead}>What are you building and how much funding do you need?</p>

                            <div className={styles.fields}>
                                <div className={styles.field}>
                                    <label htmlFor="title">Title</label>
                                    <input
                                        id="title"
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        className={styles.input}
                                        placeholder="Decentralized identity toolkit"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        required
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        className={`${styles.input} ${styles.textarea}`}
                                        placeholder="What does your project do and who benefits from it?"
                                    />
                                </div>

                                <div className={styles.gridTwo}>
                                    <div className={styles.field}>
                                        <label htmlFor="category">Category</label>
                                        <select id="category" required value={category} onChange={(event) => setCategory(event.target.value)} className={styles.select}>
                                            <option value="">Pick one</option>
                                            <option value="infrastructure">Infrastructure</option>
                                            <option value="tools">Developer tools</option>
                                            <option value="education">Education</option>
                                            <option value="community">Community</option>
                                            <option value="research">Research</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="funding">Funding needed (ETH)</label>
                                        <input
                                            id="funding"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={requestedFunding}
                                            onChange={(event) => setRequestedFunding(event.target.value)}
                                            className={styles.input}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label htmlFor="image">Cover image (optional)</label>
                                    <input id="image" type="file" accept="image/*" onChange={handleImageChange} className={styles.input} />
                                    {imageFile && <p className={styles.fileInfo}>Selected: {imageFile.name}</p>}
                                    {imagePreview && (
                                        <div className={styles.preview}>
                                            <img src={imagePreview} alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className={`${styles.panel} ${styles.formPanel}`}>
                            <h2 className={styles.panelTitle}>First milestone</h2>
                            <p className={styles.panelLead}>Optional. You can add more milestones later.</p>

                            <div className={styles.fields}>
                                <div className={styles.field}>
                                    <label htmlFor="milestone-title">Milestone title</label>
                                    <input
                                        id="milestone-title"
                                        type="text"
                                        value={milestoneTitle}
                                        onChange={(event) => setMilestoneTitle(event.target.value)}
                                        className={styles.input}
                                        placeholder="Beta launch"
                                    />
                                </div>

                                <div className={styles.gridDate}>
                                    <div className={styles.field}>
                                        <label htmlFor="milestone-description">What will you deliver?</label>
                                        <input
                                            id="milestone-description"
                                            type="text"
                                            value={milestoneDescription}
                                            onChange={(event) => setMilestoneDescription(event.target.value)}
                                            className={styles.input}
                                            placeholder="Prototype, docs, and open testnet deployment"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="milestone-deadline">Deadline</label>
                                        <input
                                            id="milestone-deadline"
                                            type="date"
                                            value={milestoneDeadline}
                                            onChange={(event) => setMilestoneDeadline(event.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className={`${styles.panel} ${styles.formPanel}`}>
                            <h2 className={styles.panelTitle}>Team lead</h2>
                            <p className={styles.panelLead}>Who is responsible for this project?</p>

                            <div className={styles.gridTwo}>
                                <div className={styles.field}>
                                    <label htmlFor="team-name">Name</label>
                                    <input
                                        id="team-name"
                                        type="text"
                                        value={teamName}
                                        onChange={(event) => setTeamName(event.target.value)}
                                        className={styles.input}
                                        placeholder="Your name"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label htmlFor="team-role">Role</label>
                                    <input
                                        id="team-role"
                                        type="text"
                                        value={teamRole}
                                        onChange={(event) => setTeamRole(event.target.value)}
                                        className={styles.input}
                                        placeholder="Lead developer"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className={styles.formActions}>
                            <Link href="/dashboard" className={styles.ghostBtn}>
                                Cancel
                            </Link>
                            <button type="submit" disabled={isSubmitting} className={styles.buttonPrimary}>
                                {submitLabel}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </ProtectedRoute>
    );
}
