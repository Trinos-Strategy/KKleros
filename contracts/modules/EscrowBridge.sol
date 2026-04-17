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
 * @notice XRPL<>EVM Sidechain escrow bridge via Axelar GMP
 * @dev Does NOT extend AxelarExecutable to avoid immutable/UUPS conflict.
 *      Stores gateway and gasService as regular storage variables.
 *      MAX_RETRY = 3, FEE_RATE = 300 bps (3%).
 */
contract EscrowBridge is
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IEscrowBridge
{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    uint256 public constant MAX_RETRY = 3;
    uint256 public constant FEE_RATE_BPS = 300;

    IAxelarGateway public gateway;
    IAxelarGasService public gasService;

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
        _grantRole(OPERATOR_ROLE, _admin);
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function registerEscrow(
        bytes32 _escrowID,
        uint256 _amount,
        address _claimant,
        address _respondent
    ) external override onlyRole(GATEWAY_ROLE) {
        // TODO: implement
        revert("Not implemented");
    }

    function releaseFunds(bytes32 _escrowID, address _winner) external override onlyRole(OPERATOR_ROLE) nonReentrant {
        // TODO: implement
        revert("Not implemented");
    }

    function refundFunds(bytes32 _escrowID) external override onlyRole(OPERATOR_ROLE) nonReentrant {
        // TODO: implement
        revert("Not implemented");
    }

    function retryRelease(bytes32 _escrowID) external override nonReentrant {
        // TODO: implement
        revert("Not implemented");
    }

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
        // TODO: decode payload and process incoming XRPL escrow events
    }
}
