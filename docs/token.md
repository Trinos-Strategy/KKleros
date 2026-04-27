# TRN Token Paper

## Work Token Economics and Non-Security Analysis

**Version**: 1.0
**Issuer**: Trinos
**Effective Date**: 2026-04-27
**Token**: TRN — Trianum Protocol Work Token
**Standard**: ERC-20 + ERC20Votes
**Network**: XRPL EVM Sidechain (Chain ID 1440002)

---

## 1. Summary

TRN is a **work token**. Holding TRN does not confer a right to profits, dividends, fee-share, or any passive yield. Holding TRN confers the right to perform paid protected work — adjudicating disputes as a Trianum juror — and the obligation to bear stake-weighted slashing risk for that work. Token-holders may also delegate governance voting power for DAO-managed protocol parameters under the DAO Governance Charter.

The token is structured for non-security treatment across seven jurisdictions (United States, European Union, Switzerland, Singapore, United Kingdom, Japan, Republic of Korea). The analysis is set out in §5.

---

## 2. Why a Work Token

The Trianum protocol requires staked human jurors to perform Schelling-Point convergence under stake-at-risk conditions. The token's only economic role is to:

(a) gate entry into the SortitionModule juror pool (staking);
(b) permit the slashing-and-redistribution mechanism on which Schelling convergence depends;
(c) confer governance voting power over DAO-amendable parameters.

These functions cannot be performed by a fee currency, a stablecoin, or a profit-share token. They require an instrument whose holders are willing to actively participate in the protocol's work. A work token is the appropriate primitive.

---

## 3. Specifications

| Property | Value |
|---|---|
| Ticker | **TRN** |
| Standard | ERC-20 + ERC20Votes (OpenZeppelin) |
| Network | XRPL EVM Sidechain (Chain ID 1440002) |
| Total Supply | 1,000,000,000 TRN — fixed, no minting |
| Decimals | 18 |
| Classification | Work Token (non-security) |

### 3.1 Etymology

TRN is the first three letters of the Latin root *Tri* (three), reflecting the protocol's three-fold legitimacy architecture. Each letter corresponds to one operational dimension:

| Letter | Meaning | On-Chain Function |
|:---:|---|---|
| **T** | Trust | Juror stake — the integrity bond placed on each verdict |
| **R** | Render | Commit-Reveal voting — rendering the verdict on-chain |
| **N** | Network | DAO governance — the network of token-holders who steward parameters |

---

## 4. Distribution

The 1,000,000,000 TRN total supply is allocated as follows:

| Allocation | % | Vesting | Notes |
|---|:---:|---|---|
| Juror Reward Pool | 30% | Released proportionally to dispute volume | Performs the protocol's core economic function |
| DAO Treasury | 25% | 4-year linear unlock from Phase 1 launch | Funds protocol operations + DAO grants |
| Founders | 15% | 4-year cliff + linear vesting | Standard founder vesting |
| Early Contributors | 10% | 3-year linear vesting | Engineering + legal + advisory |
| Public Sale | 10% | At sale; 6-month lockup for sale-purchasers | Token-generation event price discovery |
| Liquidity Provision | 5% | At launch | DEX listing |
| Strategic Partners | 5% | 2-year linear vesting | KCAB, ecosystem partners |

The Juror Reward Pool is the largest single allocation, reflecting that the protocol's primary economic activity is dispute adjudication.

---

## 5. Non-Security Analysis (Seven Jurisdictions)

The token is structured to fall outside securities classification in each of the listed jurisdictions. The analysis below summarises the position; legal opinions in each jurisdiction are available on request.

### 5.1 United States — Howey Test

The Howey Test asks whether a token represents (i) an investment of money, (ii) in a common enterprise, (iii) with an expectation of profit, (iv) derived predominantly from the efforts of others.

TRN fails prong (iv): protocol revenue does not flow to TRN holders as such. Juror reward flows to actively-participating jurors only — those who stake, are sortitioned, and vote correctly. Passive holders receive nothing. This breaks the "predominant efforts of others" prong, consistent with the SEC's own framework for utility-style work tokens (cf. *Framework for "Investment Contract" Analysis of Digital Assets*, 2019).

### 5.2 European Union — MiCA

MiCA classifies crypto-assets into asset-referenced tokens, e-money tokens, and other crypto-assets. TRN is "other crypto-asset" — it is not pegged to a basket, not pegged to a single fiat currency, and does not entitle holders to redemption or yield. MiCA's disclosure obligations for "other crypto-assets" apply (whitepaper, ongoing disclosures); these are addressed by this Token Paper and the DAO Governance Charter.

### 5.3 Switzerland — FINMA Token Categorisation

FINMA distinguishes payment tokens, utility tokens, and asset tokens. TRN is a utility token: its primary function is to grant access to a service (juror role) and governance rights, not payment or investment. Long-term FINMA practice treats utility tokens as falling outside securities regulation.

### 5.4 Singapore — Payment Services Act / Securities and Futures Act

The PSA (digital payment tokens) and SFA (capital-markets products) create the principal classification axes. TRN is neither a digital payment token (limited acceptance, not designed as a means of payment) nor a capital-markets product (no debt/equity/units-in-CIS character).

### 5.5 United Kingdom — FCA Cryptoasset Taxonomy

The FCA distinguishes security tokens, e-money tokens, and unregulated tokens. TRN is unregulated (utility token). The forthcoming UK cryptoasset regulatory regime is monitored for material changes.

### 5.6 Japan — FIEA / PSA

FIEA covers Type-1 and Type-2 securities; the PSA covers crypto-assets. TRN is a crypto-asset under the PSA (registration of any exchange handling TRN required) but not a Type-1 or Type-2 security under FIEA.

### 5.7 Republic of Korea — 가상자산이용자보호법

Under the Virtual Asset User Protection Act (effective 2024-07), virtual assets are subject to user-protection obligations on Virtual Asset Service Providers. TRN is a virtual asset (subject to VASP-handling rules) but is not a security (자본시장법) since it does not represent a contractual claim to profit-share or asset-referenced value.

---

## 6. Utilities

### 6.1 Juror Staking

To enter the SortitionModule juror pool, a holder stakes TRN. Staked TRN is subject to:

- Selection probability proportional to stake (Stake-Weighted Random Selection)
- Transfer Restriction during active disputes
- Slashing at 10% of stake for minority-vote outcomes (Article 22(5) of the Rules)
- Redistribution at 1.5× multiplier for majority-vote outcomes

The stake-and-slash mechanism is what makes Schelling-Point convergence economically credible.

### 6.2 DAO Voting Power

TRN is ERC20Votes-compatible. Holders may delegate voting power to themselves or another address. Voting weight is snapshot-based, computed at the proposal-creation block.

The DAO governs:

- Slashing Rate and Redistribution Multiplier (Article 22(5))
- Arbitration fee rates (Article 28)
- Court parameters (currently single General Court; multi-court expansion in 2027)
- Approval of the AI Authenticity Tool vendor (Article 13(2-bis))
- Treasury allocations
- Rules amendments (Article 34)

Detailed governance procedures are set out in the **DAO Governance Charter**.

### 6.3 Court-Creation Bonds

When the DAO is empowered (Phase 3) to create new specialised courts, proposers post a bond in TRN. The bond is forfeited if the proposal fails or if the new court's first 100 disputes show systematic procedural failure.

---

## 7. Fee Flow

Trianum dispute fees flow in **RLUSD** (Ripple's NYDFS-approved USD stablecoin), not in TRN. The fee structure is set out in Article 28 of the Rules:

| Component | Rate | Currency |
|---|:---:|:---:|
| Arbitrator fee | 1.0% of disputed amount | RLUSD |
| Juror reward pool | 1.2% | TRN + RLUSD |
| Trianum DAO treasury | 0.5% | RLUSD |
| Protocol operations | 0.3% | RLUSD |

The Juror reward pool component (1.2%) is paid in a mix: stable-value floor in RLUSD plus a TRN component drawn from the Juror Reward Pool allocation. The mix is parameterised by the DAO and adjusts over time as the Juror Reward Pool depletes.

---

## 8. Inflation/Deflation Mechanics

### 8.1 Total Supply is Fixed

1,000,000,000 TRN are minted at deployment. The contract has no minting function; total supply cannot increase.

### 8.2 Effective Circulating Supply Dynamics

- **Vesting unlocks** increase circulating supply linearly per the schedule in §4.
- **Slashing forfeitures** to the DAO Treasury (where applicable) reduce circulating supply held by jurors.
- **DAO Treasury distributions** (grants, partner allocations) increase circulating supply at DAO-determined cadence.
- **Buybacks are not contemplated** — the protocol does not direct fees toward TRN buybacks.

### 8.3 No Yield, No Buyback, No Dividend

These are deliberate structural decisions:

- **No yield**: passive holders receive no protocol revenue. Reward flows to active jurors only.
- **No buyback**: protocol fees fund operations and treasury, not token-price support.
- **No dividend**: TRN is not a profit-share instrument.

These features are central to the non-security analysis in §5.

---

## 9. Risk Disclosures

### 9.1 Slashing Loss

Stake placed in the SortitionModule may be slashed under Article 22 of the Rules. Holders who stake without intent to perform juror duties responsibly bear forfeiture risk.

### 9.2 Token Price Volatility

TRN is a freely-traded token; its market price is volatile. Holding TRN is not an investment in a stable-value instrument.

### 9.3 Regulatory Risk

The non-security analysis in §5 reflects the position as of the Effective Date of this Token Paper. Regulatory frameworks evolve; reclassification in any jurisdiction is possible.

### 9.4 Protocol Risk

Trianum is a smart-contract protocol; bug-discovery risk exists. The DAO maintains an active security-review programme and the codebase is open source.

---

## 10. Future Amendments

This Token Paper may be amended by Trianum DAO governance under Article 34 of the Rules. Material amendments to total supply (none possible — fixed), distribution (only the unallocated portion of any pool), or non-security analysis structure require a 75% supermajority vote.

---

*© 2026 Trinos | Trianum Protocol*

*This document is informational and does not constitute investment, legal, tax, or financial advice. TRN holders should consult their own advisers as to applicable regulatory and tax obligations in their jurisdiction.*
