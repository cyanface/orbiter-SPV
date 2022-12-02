require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://mainnet.infura.io/v3/1151f1c1883542b2aad91169712e8338",
      // },
      blockGasLimit: 40000000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: "f9093c88-e62c-464f-a198-f4771b5d0605",
  },
};
