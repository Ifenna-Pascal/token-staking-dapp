// Deploys the IFT token and the staking pool.
// Run locally:   npx hardhat run scripts/deploy.js
// Run on Sepolia: SEPOLIA_RPC_URL=... PRIVATE_KEY=... npx hardhat run scripts/deploy.js --network sepolia
const hre = require("hardhat");

async function main() {
  const token = await (await hre.ethers.getContractFactory("IFTToken")).deploy();
  await token.deployed();
  console.log("IFTToken deployed to:", token.address);

  const staking = await (await hre.ethers.getContractFactory("Staking")).deploy(token.address);
  await staking.deployed();
  console.log("Staking deployed to:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
