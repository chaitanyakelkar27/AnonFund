// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVotingVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[7] calldata _pubSignals
    ) external view returns (bool);
}

contract Voting {
    struct VoteRecord {
        uint256 projectId;
        uint256 voteCount;
        uint256 timestamp;
    }

    struct VoterCredits {
        uint256 totalCredits;
        uint256 usedCredits;
        uint256 availableCredits;
    }

    IVotingVerifier public verifier;
    address public voterRegistry;
    uint256 public currentRoundId;
    uint256 public constant VOICE_CREDITS_PER_VOTER = 100;

    mapping(uint256 => bool) public usedNullifiers;
    mapping(uint256 => mapping(uint256 => uint256)) public projectVotes;
    mapping(uint256 => uint256) public projectTotalVotes;
    mapping(address => mapping(uint256 => VoterCredits)) public voterCreditsPerRound;
    mapping(uint256 => VoteRecord[]) public roundVotes;

    event VoteSubmitted(
        uint256 indexed roundId,
        uint256 indexed projectId,
        uint256 voteCount,
        uint256 nullifierHash,
        uint256 timestamp
    );
    
    event RoundStarted(uint256 indexed roundId, uint256 timestamp);
    event RoundEnded(uint256 indexed roundId, uint256 timestamp);

    error InvalidProof();
    error NullifierAlreadyUsed();
    error InvalidRoundId();
    error InvalidProjectId();
    error InsufficientCredits();
    error InvalidVoteCount();
    error RoundNotActive();

    constructor(address _verifier, address _voterRegistry) {
        verifier = IVotingVerifier(_verifier);
        voterRegistry = _voterRegistry;
        currentRoundId = 1;
    }

    function submitVote(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256 root,
        uint256 nullifierHash,
        uint256 signalHash,
        uint256 externalNullifier,
        uint256 roundId,
        uint256 projectId,
        uint256 voteCount
    ) external {
        if (roundId != currentRoundId) revert InvalidRoundId();
        if (projectId == 0) revert InvalidProjectId();
        if (voteCount == 0) revert InvalidVoteCount();
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed();

        // Public signals must match circuit output order: [root, nullifierHash, signalHash, roundId, projectId, voteCount, externalNullifier]
        uint256[7] memory pubSignals = [
            root,
            nullifierHash,
            signalHash,
            roundId,
            projectId,
            voteCount,
            externalNullifier
        ];

        bool isValid = verifier.verifyProof(pA, pB, pC, pubSignals);
        if (!isValid) revert InvalidProof();

        uint256 creditsRequired = voteCount * voteCount;
        
        VoterCredits storage credits = voterCreditsPerRound[msg.sender][roundId];
        if (credits.totalCredits == 0) {
            credits.totalCredits = VOICE_CREDITS_PER_VOTER;
            credits.availableCredits = VOICE_CREDITS_PER_VOTER;
        }

        if (credits.availableCredits < creditsRequired) revert InsufficientCredits();

        usedNullifiers[nullifierHash] = true;
        credits.usedCredits += creditsRequired;
        credits.availableCredits -= creditsRequired;

        projectVotes[roundId][projectId] += voteCount;
        projectTotalVotes[projectId] += voteCount;

        roundVotes[roundId].push(VoteRecord({
            projectId: projectId,
            voteCount: voteCount,
            timestamp: block.timestamp
        }));

        emit VoteSubmitted(roundId, projectId, voteCount, nullifierHash, block.timestamp);
    }

    function getProjectVotes(uint256 roundId, uint256 projectId) external view returns (uint256) {
        return projectVotes[roundId][projectId];
    }

    function getVoterCredits(address voter, uint256 roundId) external view returns (
        uint256 totalCredits,
        uint256 usedCredits,
        uint256 availableCredits
    ) {
        VoterCredits memory credits = voterCreditsPerRound[voter][roundId];
        return (credits.totalCredits, credits.usedCredits, credits.availableCredits);
    }

    function getRoundVotes(uint256 roundId) external view returns (VoteRecord[] memory) {
        return roundVotes[roundId];
    }

    function isNullifierUsed(uint256 nullifierHash) external view returns (bool) {
        return usedNullifiers[nullifierHash];
    }

    function startNewRound() external {
        currentRoundId++;
        emit RoundStarted(currentRoundId, block.timestamp);
    }

    function calculateQuadraticCost(uint256 votes) public pure returns (uint256) {
        return votes * votes;
    }
}
