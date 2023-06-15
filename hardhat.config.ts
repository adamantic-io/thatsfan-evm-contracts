import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import Config from "./common/Config";
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

import "tsconfig-paths/register";


const config: HardhatUserConfig = {
  solidity: "0.8.18",
};

export default config;

module.exports = {
  solidity: "0.8.18",
  networks: {
    mumbai: {
      url: Config.alchemy.url,
      accounts: [Config.alchemy.p_key],
    },
  },
};