import {expect} from "chai";
import Config from "../common/Config";
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");

describe("ThatsFanToken", function () {

    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(Config.roles.minter));
    const BURNER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(Config.roles.burner));
    const OPERATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(Config.roles.operator));
    async function deployTokenFixture() {

        const ThatsFanToken = await ethers.getContractFactory(
            "ThatsFanToken"
        );
        const deployedThatsFanToken = await upgrades.deployProxy(ThatsFanToken,
            [Config.token.name, Config.token.symbol, Config.token.supply], {
                initializer: "initialize",
                kind: "transparent",
            });
        await deployedThatsFanToken.deployed();

        const [owner, addr1, addr2] = await ethers.getSigners();

        // assert that the value is correct
        expect(await deployedThatsFanToken.name()).to.equal(Config.token.name);
        expect(await deployedThatsFanToken.symbol()).to.equal(Config.token.symbol);
        expect(await deployedThatsFanToken.totalSupply()).to.equal(Config.token.supply);

        // Fixtures can return anything you consider useful for your tests
        return { ThatsFanToken, deployedThatsFanToken, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            // We use loadFixture to set up our environment, and then assert that
            // things went well
            const { deployedThatsFanToken, owner } = await loadFixture(deployTokenFixture);

            // `expect` receives a value and wraps it in an assertion object. These
            // objects have a lot of utility methods to assert values.

            // This test expects the owner variable stored in the contract to be
            // equal to our Signer's owner.
            expect(await deployedThatsFanToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const { deployedThatsFanToken, owner } = await loadFixture(deployTokenFixture);
            const ownerBalance = await deployedThatsFanToken.balanceOf(owner.address);
            expect(await deployedThatsFanToken.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const { deployedThatsFanToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );
            // Transfer 50 tokens from owner to addr1
            await expect(
                deployedThatsFanToken.transfer(addr1.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner, addr1], [-50, 50]);

            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(
                deployedThatsFanToken.connect(addr1).transfer(addr2.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [addr1, addr2], [-50, 50]);
        });

        it("Should emit Transfer events", async function () {
            const { deployedThatsFanToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );

            // Transfer 50 tokens from owner to addr1
            await expect(deployedThatsFanToken.transfer(addr1.address, 50))
                .to.emit(deployedThatsFanToken, "Transfer")
                .withArgs(owner.address, addr1.address, 50);

            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(deployedThatsFanToken.connect(addr1).transfer(addr2.address, 50))
                .to.emit(deployedThatsFanToken, "Transfer")
                .withArgs(addr1.address, addr2.address, 50);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const { deployedThatsFanToken, owner, addr1 } = await loadFixture(
                deployTokenFixture
            );
            const initialOwnerBalance = await deployedThatsFanToken.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner.
            // `require` will evaluate false and revert the transaction.
            await expect(
                deployedThatsFanToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed.
            expect(await deployedThatsFanToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
    });

    describe("Operator Transactions", function () {
        it("Should not allow anyone but a OPERATOR_ROLE to call operatorTransfer" +
            " between not owned wallets.", async function () {
            const {deployedThatsFanToken, owner, addr1, addr2} = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(addr1).operatorTransferFrom(owner.address, addr2.address, 50)
            ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        })
        it("Should transfer tokens between accounts", async function () {
            const { deployedThatsFanToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );
            // Transfer 50 tokens from owner to addr1
            await expect(
                deployedThatsFanToken.transfer(addr1.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner, addr1], [-50, 50]);
            // Transfer 50 tokens from owner to addr1
            await expect(
                deployedThatsFanToken.transfer(addr2.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner, addr2], [-50, 50]);
            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(
                deployedThatsFanToken.connect(owner).operatorTransferFrom(addr1.address, addr2.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [addr1, addr2], [-50, 50]);
            // Addr1 balance should be 0.
            expect(await deployedThatsFanToken.balanceOf(addr1.address)).to.equal(0);
            // Addr2 balance should be 100.
            expect(await deployedThatsFanToken.balanceOf(addr2.address)).to.equal(100);
        });
        it("Should be deactivated after calling disableOperators.", async function () {
            const { deployedThatsFanToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );
            // Transfer 50 tokens from owner to addr1
            await expect(
                deployedThatsFanToken.transfer(addr1.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner, addr1], [-50, 50]);
            // Transfer 50 tokens from owner to addr1
            await expect(
                deployedThatsFanToken.transfer(addr2.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner, addr2], [-50, 50]);
            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(
                deployedThatsFanToken.connect(owner).operatorTransferFrom(addr1.address, addr2.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [addr1, addr2], [-50, 50]);
            // Addr1 balance should be 0.
            expect(await deployedThatsFanToken.balanceOf(addr1.address)).to.equal(0);
            // Addr2 balance should be 100.
            expect(await deployedThatsFanToken.balanceOf(addr2.address)).to.equal(100);
            await deployedThatsFanToken.connect(owner).disableOperators();
            // Trying to use operatorTransfer again
            await expect(
                deployedThatsFanToken.connect(owner).operatorTransferFrom(addr2.address, addr1.address, 50)
            ).to.be.revertedWith("OperatorTransfer: disabled functionality.");

        });
        it("Should fail if sender doesn't have enough tokens", async function () {
            const { deployedThatsFanToken, owner, addr1 } = await loadFixture(
                deployTokenFixture
            );
            const initialOwnerBalance = await deployedThatsFanToken.balanceOf(owner.address);
            // Try to send 1 token from addr1 (0 tokens) to owner.
            // `require` will evaluate false and revert the transaction.
            await expect(
                deployedThatsFanToken.connect(owner).operatorTransferFrom(addr1.address, owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            // Owner balance shouldn't have changed.
            expect(await deployedThatsFanToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
    });

    describe("Grant Roles", function() {
        it("Should not allow anyone but the owner to grant roles.", async function () {
            const {deployedThatsFanToken, addr1, addr2} = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(addr1).grantRole(MINTER_ROLE, addr2.address)
            ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        })
        it("Should allow the owner to grant MINTER_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(MINTER_ROLE, addr1.address);
            const isMinter = await deployedThatsFanToken.hasRole(MINTER_ROLE,
                addr1.address
            );
            expect(isMinter).to.equal(true);
        });
        it("Should allow the owner to grant BURNER_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(BURNER_ROLE, addr1.address);
            const isBurner = await deployedThatsFanToken.hasRole(BURNER_ROLE,
                addr1.address
            );
            expect(isBurner).to.equal(true);
        });
        it("Should allow the owner to grant OPERATOR_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(OPERATOR_ROLE, addr1.address);
            const isOperator = await deployedThatsFanToken.hasRole(OPERATOR_ROLE,
                addr1.address
            );
            expect(isOperator).to.equal(true);
        });
    });

    describe("Revoke Roles", function() {
        it("Should not allow anyone but the owner to revoke roles.", async function () {
            const {deployedThatsFanToken, addr1, addr2} = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(addr1).revokeRole(MINTER_ROLE, addr2.address)
            ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        });
        it("Should allow the owner to revoke MINTER_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(MINTER_ROLE, addr1.address);
            await expect(deployedThatsFanToken.hasRole(MINTER_ROLE,
                addr1.address
            ));
            await deployedThatsFanToken.connect(owner).revokeRole(MINTER_ROLE, addr1.address);
            const isMinter = await deployedThatsFanToken.hasRole(MINTER_ROLE,
                addr1.address
            );
            expect(isMinter).to.equal(false);
        });
        it("Should allow the owner to revoke BURNER_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(BURNER_ROLE, addr1.address);
            await expect(deployedThatsFanToken.hasRole(BURNER_ROLE,
                addr1.address
            ));
            await deployedThatsFanToken.connect(owner).revokeRole(BURNER_ROLE, addr1.address);
            const isBurner = await deployedThatsFanToken.hasRole(BURNER_ROLE,
                addr1.address
            );
            expect(isBurner).to.equal(false);
        });
        it("Should allow the owner to revoke OPERATOR_ROLE role.", async function () {
            const {deployedThatsFanToken, owner, addr1} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).grantRole(OPERATOR_ROLE, addr1.address);
            await expect(deployedThatsFanToken.hasRole(OPERATOR_ROLE,
                addr1.address
            ));
            await deployedThatsFanToken.connect(owner).revokeRole(OPERATOR_ROLE, addr1.address);
            const isOperator = await deployedThatsFanToken.hasRole(OPERATOR_ROLE,
                addr1.address
            );
            expect(isOperator).to.equal(false);
        });
    });

    describe("Minting", function() {
        it("Should allow MINTER_ROLE to mint.", async function () {
            const { deployedThatsFanToken, owner } = await loadFixture(
                deployTokenFixture
            );
            const initialOwnerBalance = await deployedThatsFanToken.balanceOf(owner.address);
            await expect(
                deployedThatsFanToken.connect(owner).mint(owner.address, 50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner], [50]);
            expect(await deployedThatsFanToken.balanceOf(owner.address)).to.equal(
                Number(initialOwnerBalance)+50
            );
        });
        it("Should not allow non MINTER_ROLE to mint.", async function () {
            const { deployedThatsFanToken, addr1 } = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(addr1).mint(addr1.address, 1)
            ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        });
        it("Should not allow to mint if modify supply disabled.", async function () {
            const { deployedThatsFanToken, owner} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).disableModifySupply();
            await expect(
                deployedThatsFanToken.connect(owner).mint(owner.address, 50)
            ).to.be.revertedWith("Fixed supply. Mint blocked.");
        });
    });

    describe("Burning", function() {
        it("Should allow BURNER_ROLE to burn.", async () => {
            const { deployedThatsFanToken, owner } = await loadFixture(
                deployTokenFixture
            );
            const initialOwnerBalance = await deployedThatsFanToken.balanceOf(owner.address);
            await expect(
                deployedThatsFanToken.burn(50)
            ).to.changeTokenBalances(deployedThatsFanToken, [owner], [-50]);
            expect(await deployedThatsFanToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance-50
            );
        });
        it("Should not allow to burn for insufficient allowance'.", async () => {
            const { deployedThatsFanToken, owner, addr1 } = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(owner).burnFrom(addr1.address, 1)
            ).to.be.revertedWith('ERC20: insufficient allowance');
        });
        it("Should not allow non BURNER_ROLE to burn", async () => {
            const { deployedThatsFanToken, addr1 } = await loadFixture(
                deployTokenFixture
            );
            await expect(
                deployedThatsFanToken.connect(addr1).burnFrom(addr1.address, 1)
            ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        });
        it("Should not allow to burn if modify supply disabled.", async function () {
            const { deployedThatsFanToken, owner} = await loadFixture(
                deployTokenFixture
            );
            await deployedThatsFanToken.connect(owner).disableModifySupply();
            await expect(
                deployedThatsFanToken.connect(owner).burnFrom(owner.address, 50)
            ).to.be.revertedWith("Fixed supply. Burn blocked.");
        });
    });
});
