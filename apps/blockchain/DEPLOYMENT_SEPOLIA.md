# Sepolia Deployment Checklist

## 1. Preflight
- Ensure wallet has Sepolia ETH for gas.
- Ensure you have a real AnonAadhaar verifier address on Sepolia.
- Use Node.js LTS (recommended v20) for Hardhat stability.

## 2. Configure Environment
Copy `.env.example` to `.env` in `apps/blockchain` and set:
- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY`
- `ANON_AADHAAR_VERIFIER_ADDRESS`

## 3. Build and Validate
Run from repo root:

```bash
pnpm --filter @anonfund/blockchain build
pnpm --filter @anonfund/blockchain test
```

## 4. Deploy All Contracts to Sepolia
Run from repo root:

```bash
pnpm --filter @anonfund/blockchain deploy:sepolia:all
```

This deploys in order:
1. `VoterRegistry` (with real `ANON_AADHAAR_VERIFIER_ADDRESS`)
2. `VotingVerifier`
3. `Voting`
4. `Project`

It also updates frontend artifacts under `apps/frontend/src/contracts`.

## 5. Post-Deployment
- Verify deployed addresses printed in terminal.
- Confirm frontend uses updated artifacts in `apps/frontend/src/contracts`.
- Set frontend envs as needed:
  - `NEXT_PUBLIC_VOTER_REGISTRY_ADDRESS`
  - `NEXT_PUBLIC_RPC_URL`

## 6. Optional Etherscan Verification
If verification is configured in Hardhat, run contract verification using constructor args:
- `VoterRegistry`: real AnonAadhaar verifier address
- `Voting`: `VotingVerifier` + `VoterRegistry` addresses
- `Project`: no args
- `VotingVerifier`: no args
