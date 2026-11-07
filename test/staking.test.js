const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let token, staking, alice, bob;
  const amount = ethers.utils.parseEther("1000");

  beforeEach(async function () {
    [, alice, bob] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("IFTToken")).deploy();
    staking = await (await ethers.getContractFactory("Staking")).deploy(token.address);
    await token.transfer(alice.address, amount);
    await token.transfer(bob.address, amount);
    // Fund the pool so it can pay rewards
    await token.transfer(staking.address, amount);
  });

  async function stake(user, value) {
    await token.connect(user).approve(staking.address, value);
    return staking.connect(user).stakeTokens(value);
  }

  it("stakes tokens and records the staker once", async function () {
    await stake(alice, 100);
    await stake(alice, 50);
    expect(await staking.stakingBalance(alice.address)).to.equal(150);
    expect(await staking.hasStaked(alice.address)).to.equal(true);
    expect(await staking.stakerCount()).to.equal(1);
  });

  it("rejects a zero stake", async function () {
    await expect(staking.connect(alice).stakeTokens(0)).to.be.revertedWith("Amount must be greater than 0");
  });

  it("unstakes and returns tokens", async function () {
    await stake(alice, 100);
    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).unstakeTokens(100);
    expect(await token.balanceOf(alice.address)).to.equal(before.add(100));
    expect(await staking.hasStaked(alice.address)).to.equal(false);
  });

  it("will not unstake more than the balance", async function () {
    await stake(alice, 100);
    await expect(staking.connect(alice).unstakeTokens(101)).to.be.revertedWith("Insufficient balance");
  });

  it("distributes a 1% reward that stakers can withdraw", async function () {
    await stake(alice, 1000);
    await stake(bob, 500);
    await staking.distributeRewards();
    expect(await staking.rewards(alice.address)).to.equal(10);
    expect(await staking.rewards(bob.address)).to.equal(5);

    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).withdrawRewards();
    expect(await token.balanceOf(alice.address)).to.equal(before.add(10));
    expect(await staking.rewards(alice.address)).to.equal(0);
  });

  it("only lets the owner distribute rewards", async function () {
    await expect(staking.connect(alice).distributeRewards()).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
