export enum ProjectStatus {
    Pending = 0,
    Active = 1,
    Funded = 2,
    Completed = 3,
    Cancelled = 4,
}

export type ProjectMetadata = {
    title: string;
    description: string;
    milestones: Milestone[];
    teamInfo: TeamMember[];
    requestedFunding: string;
    revenueSharing?: RevenueSharing;
    category: string;
    imageUrl?: string;
    links?: ProjectLinks;
};

export type Milestone = {
    title: string;
    description: string;
    fundingAmount: string;
    deadline: string;
    deliverables: string[];
};

export type TeamMember = {
    name: string;
    role: string;
    bio?: string;
    twitter?: string;
    github?: string;
};

export type RevenueSharing = {
    enabled: boolean;
    percentage: number;
    description: string;
};

export type ProjectLinks = {
    website?: string;
    github?: string;
    twitter?: string;
    discord?: string;
};

export type ProjectOnChain = {
    id: bigint;
    submitter: string;
    metadataURI: string;
    requestedFunding: string;
    currentFunding: string;
    votingPower: string;
    contributorsCount: number;
    status: ProjectStatus;
};

export type Project = ProjectMetadata & {
    id: number;
    status: ProjectStatus;
    submitter: string;
    currentFunding: string;
    votingPower: string;
    contributorsCount: number;
};
