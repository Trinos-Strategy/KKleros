/**
 * Trianum Protocol — Devnet Deployment Script
 *
 * Deploys the full Trianum contract suite to a target network (default
 * `xrplEvmDevnet`, chain ID 1440002) and writes the resulting addresses
 * to `deployments/<network>.json` for downstream consumption by the UI,
 * verification script, and KFIP application.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x...  npx hardhat run scripts/deploy.ts --network xrplEvmDevnet
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY  (required)  — private key of the deployer (also acts as admin)
 *   DAO_TREASURY_ADDR     (optional)  — defaults to deployer
 *   OPS_WALLET_ADDR       (optional)  — defaults to deployer
 *
 * Notes:
 *   - On a single-EOA devnet deployment, the deployer doubles as admin,
 *     daoTreasury, and operationsWallet. For mainnet these MUST be
 *     separated (multi-sig).
 *   - MockAxelarGateway is used on devnet. Mainnet must inject the real
 *     Axelar GMP gateway address via env (not implemented here — Wave 5
 *     mainnet deployment script).
 *   - MockArbitrable is included for Phase 0 self-demo dispute origination.
 *   - All upgradeable contracts use UUPS proxy pattern.
 */

import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ONE_ETHER = 10n ** 18n;

interface DeploymentRecord {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  contracts: {
    TRNToken: string;
    SortitionModule: string;
    DisputeKit: string;
    MockAxelarGateway: string;
    EscrowBridge: string;
    KlerosCore: string;
    MockArbitrable: string;
    TimelockController: string;
    TrianumGovernor: string;
  };
  roles: {
    daoTreasury: string;
    operationsWallet: string;
    admin: string;
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  console.log("=".repeat(60));
  console.log("  Trianum Devnet Deployment");
  console.log(`  Network    : ${network.name} (chainId ${chainId})`);
  console.log(`  Deployer   : ${deployer.address}`);
  console.log(`  Balance    : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} XRP`);
  console.log("=".repeat(60));

  // Sanity checks before any tx
  if (chainId === 31337) {
    console.warn("WARNING: deploying to local Hardhat network. Use --network xrplEvmDevnet for devnet.");
  } else if (chainId !== 1440002) {
    throw new Error(`Unexpected chainId ${chainId}. Expected 1440002 for xrplEvmDevnet.`);
  }
  const balance = await ethers.provider.getBalance(deployer.address);
  if (chainId !== 31337 && balance < ethers.parseEther("0.5")) {
    throw new Error(`Deployer balance ${ethers.formatEther(balance)} XRP is insufficient. Need ≥0.5 XRP for gas.`);
  }

  const admin = deployer.address;
  const daoTreasury = process.env.DAO_TREASURY_ADDR || deployer.address;
  const operationsWallet = process.env.OPS_WALLET_ADDR || deployer.address;

  // ────────────────────────────────────────────────────────────────
  // 1. TRNToken (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[1/9] Deploying TRNToken...");
  const TRN = await ethers.getContractFactory("TRNToken");
  const trnToken = await upgrades.deployProxy(TRN, [admin], { kind: "uups" });
  await trnToken.waitForDeployment();
  const trnAddr = await trnToken.getAddress();
  console.log(`      ✓ TRNToken         ${trnAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 2. SortitionModule (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[2/9] Deploying SortitionModule...");
  const Sort = await ethers.getContractFactory("SortitionModule");
  const sortition = await upgrades.deployProxy(
    Sort,
    [admin, trnAddr, admin],
    { kind: "uups" },
  );
  await sortition.waitForDeployment();
  const sortAddr = await sortition.getAddress();
  console.log(`      ✓ SortitionModule  ${sortAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 3. DisputeKit (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[3/9] Deploying DisputeKit...");
  const DK = await ethers.getContractFactory("DisputeKit");
  const disputeKit = await upgrades.deployProxy(DK, [admin, admin], { kind: "uups" });
  await disputeKit.waitForDeployment();
  const dkAddr = await disputeKit.getAddress();
  console.log(`      ✓ DisputeKit       ${dkAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 4. MockAxelarGateway (devnet stand-in for real Axelar GMP)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[4/9] Deploying MockAxelarGateway...");
  const Gw = await ethers.getContractFactory("MockAxelarGateway");
  const gateway = await Gw.deploy();
  await gateway.waitForDeployment();
  const gwAddr = await gateway.getAddress();
  console.log(`      ✓ MockAxelarGateway ${gwAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 5. EscrowBridge (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[5/9] Deploying EscrowBridge...");
  const EB = await ethers.getContractFactory("EscrowBridge");
  const escrow = await upgrades.deployProxy(
    EB,
    [admin, gwAddr, admin, "xrpl", "rXRPLTestDestination"],
    { kind: "uups" },
  );
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log(`      ✓ EscrowBridge     ${escrowAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 6. KlerosCore (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[6/9] Deploying KlerosCore...");
  const KC = await ethers.getContractFactory("KlerosCore");
  const core = await upgrades.deployProxy(
    KC,
    [admin, dkAddr, sortAddr, escrowAddr, daoTreasury, operationsWallet],
    { kind: "uups" },
  );
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  console.log(`      ✓ KlerosCore       ${coreAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 7. MockArbitrable (for Phase 0 self-demo dispute origination)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[7/9] Deploying MockArbitrable...");
  const Arb = await ethers.getContractFactory("MockArbitrable");
  const mockArbitrable = await Arb.deploy(coreAddr);
  await mockArbitrable.waitForDeployment();
  const arbAddr = await mockArbitrable.getAddress();
  console.log(`      ✓ MockArbitrable   ${arbAddr}`);

  // ────────────────────────────────────────────────────────────────
  // 8. TimelockController + TrianumGovernor (UUPS proxy)
  // ────────────────────────────────────────────────────────────────
  console.log("\n[8/9] Deploying TimelockController...");
  const Timelock = await ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(2, [], [ethers.ZeroAddress], admin);
  await timelock.waitForDeployment();
  const tlAddr = await timelock.getAddress();
  console.log(`      ✓ TimelockController ${tlAddr}`);

  console.log("\n[9/9] Deploying TrianumGovernor...");
  const Governor = await ethers.getContractFactory("TrianumGovernor");
  const governor = await upgrades.deployProxy(
    Governor,
    [trnAddr, tlAddr, admin, 1, 10, 10_000n * ONE_ETHER, 4],
    { kind: "uups" },
  );
  await governor.waitForDeployment();
  const govAddr = await governor.getAddress();
  console.log(`      ✓ TrianumGovernor  ${govAddr}`);

  // ────────────────────────────────────────────────────────────────
  // Cross-wiring & role grants
  // ────────────────────────────────────────────────────────────────
  console.log("\n[wiring] Cross-wiring and role grants...");
  await (await (disputeKit as any).setKlerosCore(coreAddr)).wait();
  await (await (sortition as any).setKlerosCore(coreAddr)).wait();
  await (await (escrow as any).setKlerosCore(coreAddr)).wait();
  await (await (trnToken as any).setSortitionModule(sortAddr)).wait();
  const PROPOSER_ROLE = await (timelock as any).PROPOSER_ROLE();
  await (await (timelock as any).grantRole(PROPOSER_ROLE, govAddr)).wait();
  const KC_ROLE = await (sortition as any).KLEROS_CORE_ROLE();
  await (await (sortition as any).grantRole(KC_ROLE, admin)).wait();
  console.log(`      ✓ wiring complete`);

  // ────────────────────────────────────────────────────────────────
  // Persist deployment record
  // ────────────────────────────────────────────────────────────────
  const record: DeploymentRecord = {
    network: network.name,
    chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TRNToken: trnAddr,
      SortitionModule: sortAddr,
      DisputeKit: dkAddr,
      MockAxelarGateway: gwAddr,
      EscrowBridge: escrowAddr,
      KlerosCore: coreAddr,
      MockArbitrable: arbAddr,
      TimelockController: tlAddr,
      TrianumGovernor: govAddr,
    },
    roles: {
      daoTreasury,
      operationsWallet,
      admin,
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n");
  console.log(`\n✓ Deployment record written to ${outPath}`);

  // ────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("  Deployment complete");
  console.log("=".repeat(60));
  console.log(`  KlerosCore       ${coreAddr}`);
  console.log(`  TRNToken         ${trnAddr}`);
  console.log(`  Explorer (devnet): https://evm-sidechain.xrpl.org/address/${coreAddr}`);
  console.log("\n  Next steps:");
  console.log("    1. Verify contracts:   npx hardhat run scripts/verify.ts --network xrplEvmDevnet");
  console.log("    2. Seed Phase 0:       npx hardhat run scripts/seed-disputes.ts --network xrplEvmDevnet");
  console.log("    3. Update neither landing nor application until Wave 5 batch");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
