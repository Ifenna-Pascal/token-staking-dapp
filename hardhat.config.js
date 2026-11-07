require("@nomiclabs/hardhat-waffle");

// Set these in your shell (never commit them):
//   SEPOLIA_RPC_URL  e.g. https://sepolia.infura.io/v3/<project-id>
//   PRIVATE_KEY      the deployer wallet's private key
const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.4",
  networks: SEPOLIA_RPC_URL && PRIVATE_KEY
    ? { sepolia: { url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY] } }
    : {},
};
