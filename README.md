# AnonFund

AnonFund is a privacy-preserving quadratic funding platform for public goods.
It combines human verification, anonymous voting, and on-chain fund allocation.

## Problem Statement

Traditional crowdfunding and grant voting systems face three recurring issues:

- Sybil attacks (one person controlling many wallets)
- Voter privacy risks (publicly visible voting intent)
- Unfair capital influence (large holders dominating outcomes)

AnonFund addresses these by combining zero-knowledge identity proof, one-person registration constraints, and quadratic voting mechanics.

## Key Features

- One person, one registration using Anon Aadhaar nullifiers
- Anonymous participation flow with zero-knowledge proof tooling
- Quadratic funding model for fairer capital distribution
- Smart contract based project submission and voting workflows
- IPFS-backed metadata storage for project payloads
- Admin workflows for project lifecycle management

## Monorepo Structure

- apps/blockchain: Solidity contracts, Hardhat config, deployment scripts, tests
- apps/frontend: Next.js frontend, API routes, wallet integration, UI flows
- packages/circuits: Circom circuits and proof tooling assets
- config: Shared TypeScript and framework config packages

## Tech Stack

- Smart contracts: Solidity, Hardhat, Ethers, TypeChain
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Web3 UX: Wagmi, RainbowKit, Viem
- Privacy and ZK: Anon Aadhaar, Circom, SnarkJS, Poseidon
- Storage: IPFS via Pinata API


### 1) Innovation

- Original approach to combine quadratic funding with privacy-preserving voter eligibility
- Clear focus on a real governance/funding fairness problem
- Creative use of ZK identity primitives in a practical dApp flow

### 2) Technical Implementation

- Structured monorepo with separated blockchain, frontend, and circuits layers
- Type-safe integration across contracts and frontend consumers
- Functional working prototype with registration, project submission, browsing, and voting flows

### 3) Web3 Integration

- Meaningful on-chain logic for voter registry, project lifecycle, and voting
- Smart contracts used as core business logic, not as a superficial add-on
- Wallet-based authentication and transaction signing in user flows

### 4) Practical Value

- Useful for DAOs, ecosystem grants, and public goods funding rounds
- Encourages broad participation while reducing plutocratic influence
- Can be extended to multiple rounds, categories, and governance contexts

### 5) Product and UX

- End-to-end flow from wallet connect to project funding interaction
- Clear navigation across connect, register, dashboard, project, and admin screens
- Consistent theming and interface components across pages

### 6) Documentation

- This README includes architecture, setup, scripts, and deployment instructions
- Clear local development and production build guidance
- Explicit environment variable references and troubleshooting notes

## Architecture Overview

1. Identity and eligibility
	- Users prove eligibility and derive a nullifier
	- Voter registry enforces uniqueness

2. Project pipeline
	- Builders submit project metadata (IPFS CID + funding target)
	- Admin approves projects for active rounds

3. Voting and allocation
	- Voters allocate credits using quadratic cost rules
	- On-chain accounting tracks participation and allocation

4. Distribution layer
	- Smart contracts compute and apply final funding outcomes
	- Funding data remains auditable on-chain

## Smart Contracts

Primary contracts under apps/blockchain/contracts:

- VoterRegistry.sol: voter uniqueness and registration state
- Project.sol: project submission and lifecycle control
- Voting.sol: vote accounting and round-level credit logic
- VotingVerifier.sol: proof verification integration points

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Environment Variables

Create environment files as needed for local and deployment contexts.

Frontend required values:

- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
- NEXT_PUBLIC_PINATA_GATEWAY (optional, defaults to Pinata gateway)
- PINATA_JWT (required by server API routes for uploads)

Blockchain required values for Sepolia deployment:

- SEPOLIA_RPC_URL
- PRIVATE_KEY

Optional script value used in status update script:

- PROJECT_ID

## Run Locally

### Frontend

```bash
pnpm --filter @anonfund/frontend dev
```

Open http://localhost:3000/connect

### Blockchain tests

```bash
pnpm --filter @anonfund/blockchain test
```

### Compile contracts

```bash
pnpm --filter @anonfund/blockchain build
```

### Build circuits

```bash
pnpm --filter @anonfund/circuits build
```

## Deployment

### Frontend (Vercel)

This repository includes vercel.json configured for monorepo deployment:

- framework: nextjs
- build command: pnpm --filter @anonfund/frontend build
- output directory: apps/frontend/.next

If Vercel UI settings override this file, ensure the same values are set in Project Settings.

### Contracts (Sepolia)

```bash
pnpm --filter @anonfund/blockchain deploy:sepolia
```

Additional deployment scripts are available for verifier and voting modules.

## Monorepo Scripts (Root)

- pnpm dev: run workspace dev tasks
- pnpm build: run all package builds through Turbo
- pnpm type-check: run type checks across workspace
- pnpm lint: run formatting checks across workspace

## Current Status

- Frontend production build passes
- Type checks pass
- Known warning during build from transitive snarkjs/web-worker dependency (non-fatal)

## Future Improvements

- Multi-round governance and historical analytics
- Advanced anti-collusion constraints and proof optimizations
- Gas optimizations and batched operations for larger rounds
- Improved observability and protocol-level monitoring dashboards


