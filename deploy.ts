import Config from "./common/Config";

const { ethers, upgrades } = require("hardhat");

async function main() {
    const ThatsFanToken = await ethers.getContractFactory(
        "ThatsFanToken"
    );
    console.log("Deploying TokenCreator for ...");
    const contract = await upgrades.deployProxy(ThatsFanToken,
        [Config.token.name, Config.token.symbol, Config.token.supply], {
            initializer: "initialize",
            kind: "transparent",
        });
    await contract.deployed();
    console.log("TokenCreator for  deployed to:", contract.address);
    const tftOwnershipTransfer = await  contract.transferOwnership(Config.token.system_wallet);
    await tftOwnershipTransfer.wait();
    console.log("OperatorTokenSwapper and TokenCreator have had their ownership transferred to:", Config.token.system_wallet);
}

main();