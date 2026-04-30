/**
 * Trianum Protocol — Devnet Contract Verification
 *
 * Submits source code for the deployed Trianum contracts to the
 * XRPL EVM Sidechain devnet block explorer (evm-sidechain.xrpl.org)
 * via hardhat-verify.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network xrplEvmDevnet
 *
 * Reads `deployments/<network>.json` produced by deploy.ts. For each
 * non-proxy contract address, calls `hardhat verify` with the correct
 * constructor args. Proxy contracts (UUPS) are verified at the
 * implementation address — hardhat-upgrades exposes `erc1967.getImplementationAddress`.
 */

import { run, network, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentRecord {
  network: string;
  chainId: number;
  contracts: Record<string, string>;
  roles: { daoTreasury: string; operationsWallet: string; admin: string };
}

async function verify(label: string, address: string, constructorArguments: any[] = []) {
  console.log(`\n→ Verifying ${label} at ${address}`);
  try {
    await run("verify:verify", { address, constructorArguments });
    console.log(`  ✓ ${label} verified`);
  } catch (err: any) {
    if (String(err?.message || err).toLowerCase().includes("already verified")) {
      console.log(`  · ${label} already verified`);
    } else {
      console.warn(`  ✗ ${label} verification failed: ${err?.message || err}`);
    }
  }
}

async function getImpl(proxyAddr: string): Promise<string> {
  return upgrades.erc1967.getImplementationAddress(proxyAddr);
}

async function main() {
  const inPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(inPath)) {
    throw new Error(`No deployment record at ${inPath}. Run deploy.ts first.`);
  }
  const record = JSON.parse(fs.readFileSync(inPath, "utf8")) as DeploymentRecord;

  console.log("=".repeat(60));
  console.log("  Trianum Devnet Verification");
  console.log(`  Network: ${record.network} (chainId ${record.chainId})`);
  console.log("=".repeat(60));

  const c = record.contracts;
  const admin = record.roles.admin;

  // Non-proxy: MockAxelarGateway, MockArbitrable, TimelockController
  await verify("MockAxelarGateway", c.MockAxelarGateway, []);
  await verify("MockArbitrable",    c.MockArbitrable,    [c.KlerosCore]);
  await verify("TimelockController", c.TimelockController, [
    2,
    [],
    ["0x0000000000000000000000000000000000000000"],
    admin,
  ]);

  // UUPS proxies: verify at implementation address
  for (const [label, proxy] of Object.entries({
    TRNToken:        c.TRNToken,
    SortitionModule: c.SortitionModule,
    DisputeKit:      c.DisputeKit,
    EscrowBridge:    c.EscrowBridge,
    KlerosCore:      c.KlerosCore,
    TrianumGovernor: c.TrianumGovernor,
  })) {
    try {
      const impl = await getImpl(proxy);
      console.log(`\n   ${label} proxy=${proxy}\n      → impl=${impl}`);
      await verify(`${label} (impl)`, impl, []);
    } catch (err: any) {
      console.warn(`   ✗ Could not resolve impl for ${label}: ${err?.message || err}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("  Verification pass complete.");
  console.log(`  Explorer: https://evm-sidechain.xrpl.org/address/${c.KlerosCore}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
