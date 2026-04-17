import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { DisputeKit } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DisputeKit", function () {
    let disputeKit: DisputeKit;
    let admin: SignerWithAddress;
    let klerosCore: SignerWithAddress; // mock
    let arbitrator: SignerWithAddress;
    let juror1: SignerWithAddress;
    let juror2: SignerWithAddress;
    let juror3: SignerWithAddress;
    let other: SignerWithAddress;

    const DISPUTE_ID = 0;
    const ROUND_0 = 0;
    const AWARD_A_HASH = ethers.keccak256(ethers.toUtf8Bytes("Award A CID"));
    const AWARD_B_HASH = ethers.keccak256(ethers.toUtf8Bytes("Award B CID"));
    const CASE_PACKAGE_ROOT = ethers.keccak256(ethers.toUtf8Bytes("Case Package CID"));

    beforeEach(async function () {
        [admin, klerosCore, arbitrator, juror1, juror2, juror3, other] = await ethers.getSigners();

        const DisputeKit = await ethers.getContractFactory("DisputeKit");
        disputeKit = (await upgrades.deployProxy(DisputeKit, [
            admin.address,
            klerosCore.address
        ], { kind: "uups" })) as unknown as DisputeKit;
        await disputeKit.waitForDeployment();
    });

    describe("Initialization", function () {
        it("should set KlerosCore role", async function () {
            const KLEROS_CORE_ROLE = await disputeKit.KLEROS_CORE_ROLE();
            expect(await disputeKit.hasRole(KLEROS_CORE_ROLE, klerosCore.address)).to.be.true;
        });

        it("should reject zero addresses", async function () {
            const DisputeKit = await ethers.getContractFactory("DisputeKit");
            await expect(
                upgrades.deployProxy(DisputeKit, [ethers.ZeroAddress, klerosCore.address], { kind: "uups" })
            ).to.be.revertedWithCustomError(disputeKit, "ZeroAddress");
        });
    });

    describe("Dual Award Commit", function () {
        beforeEach(async function () {
            // Register arbitrator for dispute
            await disputeKit.connect(klerosCore).setDisputeArbitrator(DISPUTE_ID, arbitrator.address);
        });

        it("should commit dual award successfully", async function () {
            await expect(
                disputeKit.connect(arbitrator).commitDualAward(
                    DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
                )
            ).to.emit(disputeKit, "DualAwardCommitted")
             .withArgs(DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT);

            const pkg = await disputeKit.getDualAwardPackage(DISPUTE_ID);
            expect(pkg.committed).to.be.true;
            expect(pkg.awardAHash).to.equal(AWARD_A_HASH);
        });

        it("should reject duplicate commit", async function () {
            await disputeKit.connect(arbitrator).commitDualAward(
                DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
            );
            await expect(
                disputeKit.connect(arbitrator).commitDualAward(
                    DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
                )
            ).to.be.revertedWithCustomError(disputeKit, "DualAwardAlreadyCommitted");
        });

        it("should reject zero hashes", async function () {
            await expect(
                disputeKit.connect(arbitrator).commitDualAward(
                    DISPUTE_ID, ethers.ZeroHash, AWARD_B_HASH, CASE_PACKAGE_ROOT
                )
            ).to.be.revertedWithCustomError(disputeKit, "InvalidHashes");
        });

        it("should reject identical A/B hashes", async function () {
            await expect(
                disputeKit.connect(arbitrator).commitDualAward(
                    DISPUTE_ID, AWARD_A_HASH, AWARD_A_HASH, CASE_PACKAGE_ROOT
                )
            ).to.be.revertedWithCustomError(disputeKit, "InvalidHashes");
        });

        it("should reject non-arbitrator", async function () {
            await expect(
                disputeKit.connect(other).commitDualAward(
                    DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
                )
            ).to.be.revertedWithCustomError(disputeKit, "NotArbitratorOfDispute");
        });
    });

    describe("Commit-Reveal Voting", function () {
        const salt1 = 12345n;
        const salt2 = 67890n;
        const salt3 = 11111n;

        beforeEach(async function () {
            // Setup: commit dual award
            await disputeKit.connect(klerosCore).setDisputeArbitrator(DISPUTE_ID, arbitrator.address);
            await disputeKit.connect(arbitrator).commitDualAward(
                DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
            );

            // Start voting with 3 jurors
            await disputeKit.connect(klerosCore).startVoting(
                DISPUTE_ID,
                [juror1.address, juror2.address, juror3.address],
                ROUND_0
            );
        });

        it("should start voting correctly", async function () {
            const round = await disputeKit.getRound(DISPUTE_ID, ROUND_0);
            expect(round.jurors.length).to.equal(3);
            expect(round.tallied).to.be.false;
        });

        it("should allow juror to commit vote", async function () {
            const commit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
            await expect(
                disputeKit.connect(juror1).commitVote(DISPUTE_ID, commit)
            ).to.emit(disputeKit, "VoteCommitted");

            expect(await disputeKit.hasCommitted(DISPUTE_ID, juror1.address)).to.be.true;
        });

        it("should reject non-juror commit", async function () {
            const commit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
            await expect(
                disputeKit.connect(other).commitVote(DISPUTE_ID, commit)
            ).to.be.revertedWithCustomError(disputeKit, "NotJurorOfRound");
        });

        it("should reject double commit", async function () {
            const commit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
            await disputeKit.connect(juror1).commitVote(DISPUTE_ID, commit);
            await expect(
                disputeKit.connect(juror1).commitVote(DISPUTE_ID, commit)
            ).to.be.revertedWithCustomError(disputeKit, "AlreadyCommitted");
        });

        it("should reject commit after deadline", async function () {
            await time.increase(48 * 3600 + 1); // Past commit period
            const commit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
            await expect(
                disputeKit.connect(juror1).commitVote(DISPUTE_ID, commit)
            ).to.be.revertedWithCustomError(disputeKit, "CommitPeriodExpired");
        });

        describe("Reveal Phase", function () {
            beforeEach(async function () {
                // All jurors commit
                const commit1 = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
                const commit2 = ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]);
                const commit3 = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt3]);

                await disputeKit.connect(juror1).commitVote(DISPUTE_ID, commit1);
                await disputeKit.connect(juror2).commitVote(DISPUTE_ID, commit2);
                await disputeKit.connect(juror3).commitVote(DISPUTE_ID, commit3);

                // Advance to reveal phase
                await time.increase(48 * 3600 + 1);
            });

            it("should reveal vote correctly", async function () {
                await expect(
                    disputeKit.connect(juror1).revealVote(DISPUTE_ID, 1, salt1)
                ).to.emit(disputeKit, "VoteRevealed")
                 .withArgs(DISPUTE_ID, juror1.address, 1);

                expect(await disputeKit.hasRevealed(DISPUTE_ID, juror1.address)).to.be.true;
            });

            it("should reject reveal with wrong salt", async function () {
                await expect(
                    disputeKit.connect(juror1).revealVote(DISPUTE_ID, 1, 99999n)
                ).to.be.revertedWithCustomError(disputeKit, "CommitHashMismatch");
            });

            it("should reject reveal with wrong choice", async function () {
                await expect(
                    disputeKit.connect(juror1).revealVote(DISPUTE_ID, 2, salt1) // Committed 1, revealing 2
                ).to.be.revertedWithCustomError(disputeKit, "CommitHashMismatch");
            });

            it("should reject invalid choice value", async function () {
                // This won't match hash anyway, but test the range check
                const badCommit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [5, salt1]);
                // Can't actually test this easily since commit was for choice=1
                // Just verify choice > 2 reverts
                await expect(
                    disputeKit.connect(juror1).revealVote(DISPUTE_ID, 5, salt1)
                ).to.be.revertedWithCustomError(disputeKit, "InvalidChoice");
            });

            it("should reject reveal before commit period ends", async function () {
                // Deploy fresh and don't advance time
                const DisputeKit2 = await ethers.getContractFactory("DisputeKit");
                const dk2 = (await upgrades.deployProxy(DisputeKit2, [
                    admin.address, klerosCore.address
                ], { kind: "uups" })) as unknown as DisputeKit;

                await dk2.connect(klerosCore).setDisputeArbitrator(1, arbitrator.address);
                await dk2.connect(arbitrator).commitDualAward(1, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT);
                await dk2.connect(klerosCore).startVoting(1, [juror1.address], 0);

                const commit = ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]);
                await dk2.connect(juror1).commitVote(1, commit);

                // Try reveal immediately (commit period not expired)
                await expect(
                    dk2.connect(juror1).revealVote(1, 1, salt1)
                ).to.be.revertedWithCustomError(dk2, "RevealPeriodNotStarted");
            });
        });

        describe("Tally", function () {
            it("should tally votes: Award A wins 2-1", async function () {
                // Commit
                await disputeKit.connect(juror1).commitVote(DISPUTE_ID,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]));
                await disputeKit.connect(juror2).commitVote(DISPUTE_ID,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]));
                await disputeKit.connect(juror3).commitVote(DISPUTE_ID,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt3]));

                // Reveal
                await time.increase(48 * 3600 + 1);
                await disputeKit.connect(juror1).revealVote(DISPUTE_ID, 1, salt1);
                await disputeKit.connect(juror2).revealVote(DISPUTE_ID, 2, salt2);
                await disputeKit.connect(juror3).revealVote(DISPUTE_ID, 1, salt3);

                // Tally
                await time.increase(24 * 3600 + 1);
                await expect(
                    disputeKit.connect(klerosCore).tallyVotes(DISPUTE_ID)
                ).to.emit(disputeKit, "VotesTallied")
                 .withArgs(DISPUTE_ID, ROUND_0, 2, 1, 0, 1); // ruling=1 (AwardA)
            });

            it("should detect tie", async function () {
                // Setup: 2 jurors to force potential tie
                const DisputeKit2 = await ethers.getContractFactory("DisputeKit");
                const dk2 = (await upgrades.deployProxy(DisputeKit2, [
                    admin.address, klerosCore.address
                ], { kind: "uups" })) as unknown as DisputeKit;

                await dk2.connect(klerosCore).setDisputeArbitrator(1, arbitrator.address);
                await dk2.connect(arbitrator).commitDualAward(1, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT);
                await dk2.connect(klerosCore).startVoting(1, [juror1.address, juror2.address], 0);

                // 1:1 tie
                await dk2.connect(juror1).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]));
                await dk2.connect(juror2).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]));

                await time.increase(48 * 3600 + 1);
                await dk2.connect(juror1).revealVote(1, 1, salt1);
                await dk2.connect(juror2).revealVote(1, 2, salt2);

                await time.increase(24 * 3600 + 1);
                await expect(
                    dk2.connect(klerosCore).tallyVotes(1)
                ).to.emit(dk2, "TieDetected");
            });

            it("should handle zero votes (all jurors absent)", async function () {
                // No commits at all, advance past reveal
                await time.increase(72 * 3600 + 2);

                const tx = await disputeKit.connect(klerosCore).tallyVotes(DISPUTE_ID);
                // ruling should be 0
                const voteCount = await disputeKit.getVoteCount(DISPUTE_ID, ROUND_0);
                expect(voteCount.votesA).to.equal(0);
                expect(voteCount.votesB).to.equal(0);
            });
        });

        describe("Tie Resolution", function () {
            it("should allow arbitrator to resolve tie", async function () {
                // Create a tie scenario (use 2-juror setup)
                const DisputeKit2 = await ethers.getContractFactory("DisputeKit");
                const dk2 = (await upgrades.deployProxy(DisputeKit2, [
                    admin.address, klerosCore.address
                ], { kind: "uups" })) as unknown as DisputeKit;

                await dk2.connect(klerosCore).setDisputeArbitrator(1, arbitrator.address);
                await dk2.connect(arbitrator).commitDualAward(1, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT);
                await dk2.connect(klerosCore).startVoting(1, [juror1.address, juror2.address], 0);

                await dk2.connect(juror1).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]));
                await dk2.connect(juror2).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]));

                await time.increase(48 * 3600 + 1);
                await dk2.connect(juror1).revealVote(1, 1, salt1);
                await dk2.connect(juror2).revealVote(1, 2, salt2);

                await time.increase(24 * 3600 + 1);
                await dk2.connect(klerosCore).tallyVotes(1);

                // Resolve tie
                await expect(
                    dk2.connect(arbitrator).resolveTie(1, 1)
                ).to.emit(dk2, "TieResolved")
                 .withArgs(1, 1, arbitrator.address);
            });

            it("should reject resolveTie with ruling 0", async function () {
                // Same tie setup...
                const DisputeKit2 = await ethers.getContractFactory("DisputeKit");
                const dk2 = (await upgrades.deployProxy(DisputeKit2, [
                    admin.address, klerosCore.address
                ], { kind: "uups" })) as unknown as DisputeKit;

                await dk2.connect(klerosCore).setDisputeArbitrator(1, arbitrator.address);
                await dk2.connect(arbitrator).commitDualAward(1, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT);
                await dk2.connect(klerosCore).startVoting(1, [juror1.address, juror2.address], 0);

                await dk2.connect(juror1).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]));
                await dk2.connect(juror2).commitVote(1,
                    ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]));

                await time.increase(48 * 3600 + 1);
                await dk2.connect(juror1).revealVote(1, 1, salt1);
                await dk2.connect(juror2).revealVote(1, 2, salt2);

                await time.increase(24 * 3600 + 1);
                await dk2.connect(klerosCore).tallyVotes(1);

                await expect(
                    dk2.connect(arbitrator).resolveTie(1, 0) // 0 is invalid for tie resolution
                ).to.be.revertedWithCustomError(dk2, "InvalidRuling");
            });
        });
    });

    describe("Helper Views", function () {
        it("should identify non-revealers", async function () {
            await disputeKit.connect(klerosCore).setDisputeArbitrator(DISPUTE_ID, arbitrator.address);
            await disputeKit.connect(arbitrator).commitDualAward(
                DISPUTE_ID, AWARD_A_HASH, AWARD_B_HASH, CASE_PACKAGE_ROOT
            );
            await disputeKit.connect(klerosCore).startVoting(
                DISPUTE_ID, [juror1.address, juror2.address, juror3.address], ROUND_0
            );

            const salt1 = 111n;
            const salt2 = 222n;

            // juror1 and juror2 commit, juror3 does not
            await disputeKit.connect(juror1).commitVote(DISPUTE_ID,
                ethers.solidityPackedKeccak256(["uint256", "uint256"], [1, salt1]));
            await disputeKit.connect(juror2).commitVote(DISPUTE_ID,
                ethers.solidityPackedKeccak256(["uint256", "uint256"], [2, salt2]));

            // Advance to reveal, only juror1 reveals
            await time.increase(48 * 3600 + 1);
            await disputeKit.connect(juror1).revealVote(DISPUTE_ID, 1, salt1);

            // juror2 committed but didn't reveal
            const nonRevealers = await disputeKit.getNonRevealers(DISPUTE_ID, ROUND_0);
            expect(nonRevealers.length).to.equal(1);
            expect(nonRevealers[0]).to.equal(juror2.address);

            // juror3 didn't even commit
            const nonCommitters = await disputeKit.getNonCommitters(DISPUTE_ID, ROUND_0);
            expect(nonCommitters.length).to.equal(1);
            expect(nonCommitters[0]).to.equal(juror3.address);
        });
    });
});
