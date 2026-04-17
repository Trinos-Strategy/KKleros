// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "../interfaces/IEscrowBridge.sol";
import "../libraries/DataStructures.sol";

/**
 * @title EscrowBridge
 * @notice XRPL↔EVM Sidechain escrow bridge via Axelar GMP
 * @dev Does NOT extend AxelarExecutable to avoid immutable/UUPS conflict.
 *      Stores gateway & gasService as regular storage variables set in initialize().
 *
 * Access control:
 *   - registerEscrow: GATEWAY_ROLE (Axelar GMP 수신)
 *   - releaseFunds / refundFunds: ARBITRATOR_ROLE (KlerosCore만)
 *   - retryRelease: permissionless (최대 3회)
 *
 * Key parameters:
 *   - MAX_RETRY = 3 (설계문서 §6: 3회 실패 시 Guardian Council 개입)
 *   - FEE_RATE_BPS = 300 (3%)
 */
contract EscrowBridge is
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IEscrowBridge
{
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    uint256 public constant MAX_RETRY = 3;
    uint256 public constant FEE_RATE_BPS = 300; // 3%

    IAxelarGateway public gateway;
    IAxelarGasService public gasService;

    // escrowID => escrow state
    struct EscrowState {
        uint256 disputeID;
        uint256 amount;
        address claimant;
        address respondent;
        bool released;
        uint256 retryCount;
    }

    mapping(bytes32 => EscrowState) private _escrows;
    mapping(uint256 => bytes32) private _disputeToEscrow;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address _gateway,
        address _gasService,
        address _admin
    ) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ARBITRATOR_ROLE, _admin);
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ── IEscrowBridge Core ──

    function registerEscrow(
        bytes32 _escrowID,
        uint256 _amount,
        address _claimant,
        address _respondent
    ) external override onlyRole(GATEWAY_ROLE) {
        // TODO: implement — validate GMP source, create escrow record
        revert("Not implemented");
    }

    function releaseFunds(bytes32 _escrowID, address _winner) external override onlyRole(ARBITRATOR_ROLE) nonReentrant {
        // TODO: implement — send Axelar GMP to XRPL EscrowFinish
        revert("Not implemented");
    }

    function refundFunds(bytes32 _escrowID) external override onlyRole(ARBITRATOR_ROLE) nonReentrant {
        // TODO: implement — send Axelar GMP to XRPL EscrowCancel
        revert("Not implemented");
    }

    function retryRelease(bytes32 _escrowID) external override nonReentrant {
        // TODO: implement — permissionless, max 3 retries, then Guardian
        revert("Not implemented");
    }

    // ── IEscrowBridge Views ──

    function getEscrow(bytes32 _escrowID) external view override returns (
        uint256 disputeID,
        uint256 amount,
        address claimant,
        address respondent,
        bool released
    ) {
        EscrowState storage e = _escrows[_escrowID];
        return (e.disputeID, e.amount, e.claimant, e.respondent, e.released);
    }

    function getRetryCount(bytes32 _escrowID) external view override returns (uint256) {
        return _escrows[_escrowID].retryCount;
    }

    // ── Axelar incoming (replaces AxelarExecutable._execute) ──

    function execute(
        bytes32 _commandId,
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) external {
        require(
            gateway.validateContractCall(_commandId, _sourceChain, _sourceAddress, keccak256(_payload)),
            "Not approved by gateway"
        );
        // TODO: decode payload → registerEscrow or handle XRPL callbacks
    }
}
