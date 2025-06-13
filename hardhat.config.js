require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 50, // lower runs = smaller bytecode, faster deployment
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.ETH_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1,
    },
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.BASE_ID),
    },
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.SEPOLIA_ID),
    },
    abstract: {
      url: process.env.ABSTRACT_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.ABS_ID),
    },
    abstract_testnet: {
      url: process.env.ABS_TESTNET_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.ABS_TEST_ID),
      timeout: 60000,
      gasPrice: "auto",
      gas: "auto",
      network_id: "*",
      confirmations: 2,
      skipDryRun: true
    },
    hyperevm: {
      url: process.env.HYPEREVM_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.HYPER_ID),
    },
    monad: {
      url: process.env.MONAD_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: Number(process.env.MONAD_ID),
    }
  }
};
