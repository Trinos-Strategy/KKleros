// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEscrowBridge
 * @notice XRPL↔EVM Sidechain escrow bridge via Axelar GMP
 */
interface IEscrowBridge {

    // ──────────── Events ────────────

    event EscrowRegistered(
        bytes32 indexed escrowID,
        uint256 indexed disputeID,
        uint256 amount,
        address claimant,
        address respondent
    );

    event FundsReleaseRequested(
        bytes32 indexed escrowID,
        uint256 indexed disputeID,
        address winner,
        uint256 amount
    );

    event FundsRefundRequested(
        bytes32 indexed escrowID,
        uint256 indexed disputeID
    );

    event RetryRequested(
        bytes32 indexed escrowID,
        uint256 retryCount
    );

    // ──────────── Core Functions ────────────

    /// @notice XRPL 에스크로 등록 (Axelar GMP 콜백으로 호출)
    function registerEscrow(
        bytes32 _escrowID,
        uint256 _amount,
        address _claimant,
        address _respondent
    ) external;

    /// @notice 승자에게 자금 릴리스 (KlerosCore만 호출)
    function releaseFunds(bytes32 _escrowID, address _winner) external;

    /// @notice 양측에 비례 환불 (분쟁 거부 시)
    function refundFunds(bytes32 _escrowID) external;

    /// @notice GMP 실패 시 재전송 (최대 3회)
    function retryRelease(bytes32 _escrowID) external;

    // ──────────── View Functions ────────────

    /// @notice 에스크로 정보 조회
    function getEscrow(bytes32 _escrowID) external view returns (
        uint256 disputeID,
        uint256 amount,
        address claimant,
        address respondent,
        bool released
    );

    /// @notice 재시도 횟수 조회
    function getRetryCount(bytes32 _escrowID) external view returns (uint256);
}
