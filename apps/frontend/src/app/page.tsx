import { Manrope, Space_Grotesk } from "next/font/google";
import styles from "./page.module.css";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

const headingFont = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "700"],
    variable: "--font-heading"
});

const bodyFont = Manrope({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-body"
});

const features = [
    {
        title: "Sybil Resistant",
        description:
            "Human verification ensures one person equals one vote without exposing identity."
    },
    {
        title: "Complete Privacy",
        description:
            "Zero-knowledge flows keep ballots private while preserving public verifiability."
    },
    {
        title: "Quadratic Fairness",
        description:
            "Small contributors get amplified impact so a few whales cannot dominate allocation."
    },
    {
        title: "Automated Distribution",
        description:
            "Smart contracts settle outcomes transparently and distribute treasury funds automatically."
    },
    {
        title: "Proof-Driven Integrity",
        description:
            "Cryptographic proofs validate every step of the process without leaking private data."
    },
    {
        title: "Community Governance",
        description:
            "Funding decisions are governed by participants, not centralized operators."
    }
];

const steps = [
    {
        id: "01",
        title: "Register Once",
        points: [
            "Connect wallet",
            "Complete human verification",
            "Receive voting credits",
            "No personal data on-chain"
        ]
    },
    {
        id: "02",
        title: "Browse Projects",
        points: [
            "Review active proposals",
            "Compare impact metrics",
            "Track community sentiment",
            "Prepare your allocation"
        ]
    },
    {
        id: "03",
        title: "Vote Privately",
        points: [
            "Allocate credits",
            "Generate private proof",
            "Submit anonymously",
            "Verify transaction receipt"
        ]
    },
    {
        id: "04",
        title: "Distribute Fairly",
        points: [
            "Quadratic scores computed",
            "Contract enforces rules",
            "Transparent fund release",
            "Public audit trail"
        ]
    }
];

const layers = [
    {
        id: "1",
        title: "Identity Layer",
        subtitle: "Human Verification",
        description: "Prevents fake accounts while preserving participant privacy.",
        tag: "Sybil Safety"
    },
    {
        id: "2",
        title: "Privacy Layer",
        subtitle: "ZK Protocol",
        description: "Protects voting choices through proofs, not trust assumptions.",
        tag: "Private by Design"
    },
    {
        id: "3",
        title: "Distribution Layer",
        subtitle: "Quadratic Funding",
        description: "Turns broad community support into fair treasury allocation.",
        tag: "Fair Allocation"
    }
];

export default function HomePage(): React.JSX.Element {
    return (
        <main className={`${styles.page} ${headingFont.variable} ${bodyFont.variable}`}>
            <div className={styles.backgroundGlow} aria-hidden="true" />

            <header className={styles.header}>
                <a href="#home" className={styles.brand}>
                    <Image src="/logo.svg" alt="AnonFund Logo" width={30} height={30} className={styles.brandLogo} />
                    <span>AnonFund</span>
                </a>

                <nav className={styles.nav}>
                    <a href="#features">Features</a>
                    <a href="#process">How It Works</a>
                    <a href="#architecture">Architecture</a>
                </nav>

                <a className={styles.launchLink} href="/connect">
                    Launch App
                </a>

                <div className={styles.themeToggle}>
                    <ModeToggle />
                </div>
            </header>

            <section id="home" className={styles.hero}>
                <p className={styles.kicker}>Privacy-Preserving Quadratic Funding</p>
                <h1>
                    Fair Funding.
                    <br />
                    Private Voting.
                    <br />
                    <span>Verified Humans.</span>
                </h1>
                <p className={styles.lead}>
                    Build trust in community capital allocation with identity guarantees, anonymous ballots,
                    and transparent on-chain distribution.
                </p>

                <div className={styles.heroActions}>
                    <a href="/connect" className={styles.primaryBtn}>
                        Get Started
                    </a>
                    <a href="#architecture" className={styles.secondaryBtn}>
                        Explore Architecture
                    </a>
                </div>
            </section>

            <section id="features" className={styles.section}>
                <div className={styles.sectionTitleWrap}>
                    <p className={styles.kicker}>Key Features</p>
                    <h2>Why AnonFund?</h2>
                    <p>Advanced cryptography meets democratic capital allocation.</p>
                </div>
                <div className={styles.gridThree}>
                    {features.map((feature) => (
                        <article key={feature.title} className={styles.card}>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="process" className={styles.section}>
                <div className={styles.sectionTitleWrap}>
                    <p className={styles.kicker}>Process</p>
                    <h2>How It Works</h2>
                    <p>Four simple stages from onboarding to distribution.</p>
                </div>
                <div className={styles.gridFour}>
                    {steps.map((step) => (
                        <article key={step.id} className={styles.stepCard}>
                            <span className={styles.stepBadge}>{step.id}</span>
                            <h3>{step.title}</h3>
                            <ul>
                                {step.points.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section id="architecture" className={styles.section}>
                <div className={styles.sectionTitleWrap}>
                    <p className={styles.kicker}>Technology</p>
                    <h2>Three-Layer Architecture</h2>
                    <p>Modular layers designed for fairness, privacy, and auditability.</p>
                </div>
                <div className={styles.gridThree}>
                    {layers.map((layer) => (
                        <article key={layer.id} className={styles.layerCard}>
                            <div className={styles.layerHeader}>
                                <span className={styles.stepBadge}>{layer.id}</span>
                                <h3>{layer.title}</h3>
                            </div>
                            <strong>{layer.subtitle}</strong>
                            <p>{layer.description}</p>
                            <span className={styles.pill}>{layer.tag}</span>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.cta}>
                <h2>Ready To Launch Fair Funding?</h2>
                <p>
                    Join communities allocating treasury capital with better privacy and stronger legitimacy.
                </p>
                <div className={styles.heroActions}>
                    <a href="/connect" className={styles.primaryBtn}>
                        Launch App
                    </a>
                    <a href="/dashboard" className={styles.secondaryBtn}>
                        View Dashboard
                    </a>
                </div>
            </section>

            <footer className={styles.footer}>
                <span>AnonFund</span>
                <span>Built for transparent, privacy-first governance.</span>
            </footer>
        </main>
    );
}
