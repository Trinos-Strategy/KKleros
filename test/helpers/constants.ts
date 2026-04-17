/**
 * Shared constants for integration tests.
 * Keep these in sync with the contract-side literals — a mismatch almost
 * always means a lifecycle test is waiting the wrong amount of time.
 */

export const ONE_ETHER = 10n ** 18n;

// Staking / rewards
export const JUROR_MINT = 50_000n * ONE_ETHER;
export const JUROR_STAKE = 10_000n * ONE_ETHER;

// Governance test balances — voterA + voterB must clear the 4% quorum
export const VOTER_MINT = 50_000_000n * ONE_ETHER;
export const ADMIN_MINT = 100_000_000n * ONE_ETHER;

// KlerosCore periods (must match KlerosCore.sol)
export const EVIDENCE_PERIOD_SEC = 14 * 24 * 60 * 60;
export const DUAL_AWARD_PERIOD_SEC = 21 * 24 * 60 * 60;
export const COMMIT_PERIOD_SEC = 48 * 60 * 60;
export const REVEAL_PERIOD_SEC = 24 * 60 * 60;
export const SIGNING_PERIOD_SEC = 3 * 24 * 60 * 60;
export const APPEAL_PERIOD_SEC = 7 * 24 * 60 * 60;
export const UNSTAKING_COOLDOWN_SEC = 7 * 24 * 60 * 60;

// Courts
export const COURT_GENERAL = 0;

// Vote choices
export const Vote = { Refused: 0, AwardA: 1, AwardB: 2 } as const;

// Dispute status enum (mirror DataStructures.DisputeStatus)
export const DisputeStatus = {
    None: 0,
    Created: 1,
    Evidence: 2,
    DualAward: 3,
    Commit: 4,
    Reveal: 5,
    Resolved: 6,
    Appealable: 7,
    Appealed: 8,
    Executed: 9,
} as const;

// EscrowBridge status enum
export const EscrowStatus = {
    None: 0,
    Registered: 1,
    ReleaseRequested: 2,
    Released: 3,
    RefundRequested: 4,
    Refunded: 5,
    Failed: 6,
} as const;
