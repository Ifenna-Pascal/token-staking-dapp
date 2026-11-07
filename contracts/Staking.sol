// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IFT staking pool
/// @notice Users stake IFT tokens, the owner distributes a 1% reward on
/// each staked balance, and users withdraw their rewards or unstake at any time.
contract Staking is Ownable {
    IERC20 public immutable stakingToken;

    address[] public stakers;
    mapping(address => uint256) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) private isKnownStaker;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 stakerCount);
    event RewardWithdrawn(address indexed user, uint256 amount);

    constructor(IERC20 _stakingToken) {
        stakingToken = _stakingToken;
    }

    function stakeTokens(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        stakingBalance[msg.sender] += _amount;
        hasStaked[msg.sender] = true;
        if (!isKnownStaker[msg.sender]) {
            isKnownStaker[msg.sender] = true;
            stakers.push(msg.sender);
        }
        emit Staked(msg.sender, _amount);
    }

    function unstakeTokens(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakingBalance[msg.sender] >= _amount, "Insufficient balance");
        stakingBalance[msg.sender] -= _amount;
        if (stakingBalance[msg.sender] == 0) {
            hasStaked[msg.sender] = false;
        }
        stakingToken.transfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _amount);
    }

    /// @notice Reward for one distribution round: 1% of the staked balance.
    function calculateReward(address _staker) public view returns (uint256) {
        return stakingBalance[_staker] / 100;
    }

    /// @notice Credits every current staker with one round of rewards.
    /// The contract must hold enough tokens to pay rewards out.
    function distributeRewards() external onlyOwner {
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            rewards[staker] += calculateReward(staker);
        }
        emit RewardsDistributed(stakers.length);
    }

    function withdrawRewards() external {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to withdraw");
        rewards[msg.sender] = 0;
        stakingToken.transfer(msg.sender, reward);
        emit RewardWithdrawn(msg.sender, reward);
    }

    function stakerCount() external view returns (uint256) {
        return stakers.length;
    }
}
