/**
 * Trianum Protocol — Phase 0 Self-Demo Dispute Seeder
 *
 * After deploy.ts has populated `deployments/<network>.json`, this
 * script originates one (1) demonstration dispute on the deployed
 * KlerosCore + MockArbitrable to provide an explorer-visible
 * "proof of life" for the KFIP application's Product Readiness axis.
 *
 * The remaining four (4) Phase 0 self-demo scenarios listed in
 * THESIS_FIT_DECISION_v1.0 §2.4 are designed to be triggered from
 * the UI in Wave 3, where the user controls the wallet and can
 * exercise the full claim/respond/evidence/jury cycle interactively.
 *
 * Why only one here:
 *   - Devnet single-EOA deployment cannot meaningfully separate
 *     claimant/respondent/jurors without additional faucet provisioning.
 *   - The seed transaction proves: contracts deployed, MockArbitrable
 *     can call core.createDispute, fee calculation works, dispute
 *     state machine reaches the first state.
 *   - Full lifecycle is shown via VIDEO_MODE local hardhat (existing).
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x...  npx hardhat run scripts/seed-disputes.ts --network xrplEvmDevnet
 *
 * Output:
 *   `deployments/<network>-disputes.json` records the seed dispute
 *   and the four pending UI scenarios.
 */

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const ONE_ETHER = 10n ** 18n;

interface DeploymentRecord {
  contracts: Record<string, string>;
  roles: { admin: string; daoTreasury: string; operationsWallet: string };
}

interface ScenarioMeta {
  id: number;
  title_en: string;
  title_ko: string;
  evidence_uri_claimant: string;
  evidence_uri_respondent: string;
  amount_eth: string; // human-readable
  status: "seeded" | "ui-pending";
  dispute_id?: number;
  tx_hash?: string;
  block?: number;
}

const SCENARIOS: ScenarioMeta[] = [
  {
    id: 1,
    title_en: "Tokenised invoice — maturity default",
    title_ko: "토큰화 매출채권 만기 미상환 분쟁",
    evidence_uri_claimant: "ipfs://demo/scenario-1/claimant-invoice-overdue",
    evidence_uri_respondent: "ipfs://demo/scenario-1/respondent-payment-disputed",
    amount_eth: "1000",
    status: "seeded",
  },
  {
    id: 2,
    title_en: "Real-estate STO — rental allocation dispute",
    title_ko: "부동산 STO 임대료 분배 분쟁",
    evidence_uri_claimant: "ipfs://demo/scenario-2/claimant-allocation-claim",
    evidence_uri_respondent: "ipfs://demo/scenario-2/respondent-distribution-records",
    amount_eth: "500",
    status: "ui-pending",
  },
  {
    id: 3,
    title_en: "NFT-collateralised loan — liquidation dispute",
    title_ko: "NFT 담보 대출 청산 분쟁",
    evidence_uri_claimant: "ipfs://demo/scenario-3/claimant-fair-value",
    evidence_uri_respondent: "ipfs://demo/scenario-3/respondent-oracle-quote",
    amount_eth: "750",
    status: "ui-pending",
  },
  {
    id: 4,
    title_en: "DAO treasury — grant non-payment",
    title_ko: "DAO 트레저리 약속 grant 미지급 분쟁",
    evidence_uri_claimant: "ipfs://demo/scenario-4/claimant-proposal-passed",
    evidence_uri_respondent: "ipfs://demo/scenario-4/respondent-condition-unmet",
    amount_eth: "200",
    status: "ui-pending",
  },
  {
    id: 5,
    title_en: "DEX LP — irregular withdrawal",
    title_ko: "DEX LP 비정상 인출 분쟁",
    evidence_uri_claimant: "ipfs://demo/scenario-5/claimant-share-calc",
    evidence_uri_respondent: "ipfs://demo/scenario-5/respondent-tx-trace",
    amount_eth: "300",
    status: "ui-pending",
  },
];

function encodeDisputeExtraData(courtId: number, jurors: number): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256"],
    [courtId, jurors],
  );
}

async function main() {
  const inPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(inPath)) {
    throw new Error(`No deployment record at ${inPath}. Run deploy.ts first.`);
  }
  const record = JSON.parse(fs.readFileSync(inPath, "utf8")) as DeploymentRecord;
  const c = record.contracts;

  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  console.log("=".repeat(60));
  console.log("  Trianum Phase 0 Self-Demo Seeder");
  console.log(`  Network    : ${network.name} (chainId ${chainId})`);
  console.log(`  Deployer   : ${deployer.address}`);
  console.log(`  KlerosCore : ${c.KlerosCore}`);
  console.log(`  Arbitrable : ${c.MockArbitrable}`);
  console.log("=".repeat(60));

  // Seed scenario 1 only (rationale in header)
  const seed = SCENARIOS[0];
  console.log(`\n→ Seeding scenario #${seed.id}: ${seed.title_en}`);

  const arb = await ethers.getContractAt("MockArbitrable", c.MockArbitrable);
  const amount = BigInt(seed.amount_eth) * ONE_ETHER;
  const extraData = encodeDisputeExtraData(0, 3);
  const requiredFee = (amount * 300n) / 10_000n;
  const minFee = 10n * ONE_ETHER;
  const fee = requiredFee > minFee ? requiredFee : minFee;

  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < fee + ethers.parseEther("1")) {
    throw new Error(
      `Insufficient balance ${ethers.formatEther(balance)} XRP for fee ${ethers.formatEther(
        fee,
      )} XRP + gas. Top up via XRPL EVM devnet faucet first.`,
    );
  }

  console.log(`  amount    : ${ethers.formatEther(amount)} (test units)`);
  console.log(`  fee       : ${ethers.formatEther(fee)} XRP`);
  console.log(`  extraData : ${extraData}`);

  const tx = await (arb as any).createDispute(extraData, { value: fee });
  console.log(`  tx        : ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log(`  block     : ${rcpt.blockNumber}`);

  // The DisputeCreated event in KlerosCore reveals the disputeID
  const core = await ethers.getContractAt("KlerosCore", c.KlerosCore);
  const filter = (core as any).filters.DisputeCreated();
  const events = await (core as any).queryFilter(filter, rcpt.blockNumber, rcpt.blockNumber);
  const disputeID = events.length > 0 ? Number(events[0].args.disputeId ?? events[0].args[0]) : 0;
  console.log(`  disputeID : ${disputeID}`);

  seed.dispute_id = disputeID;
  seed.tx_hash = tx.hash;
  seed.block = rcpt.blockNumber;

  // Persist
  const outPath = path.join(__dirname, "..", "deployments", `${network.name}-disputes.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        network: network.name,
        chainId,
        seeded_at: new Date().toISOString(),
        kleros_core: c.KlerosCore,
        scenarios: SCENARIOS,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n✓ Phase 0 record written to ${outPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("  Seed complete.");
  console.log(`  Explorer (this tx): https://evm-sidechain.xrpl.org/tx/${tx.hash}`);
  console.log(`  Explorer (KlerosCore): https://evm-sidechain.xrpl.org/address/${c.KlerosCore}`);
  console.log("\n  Remaining 4 scenarios marked 'ui-pending' — they will be triggered");
  console.log("  from the Wave 3 Next.js UI where the user controls multiple wallets.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
