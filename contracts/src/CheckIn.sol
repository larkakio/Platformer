// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Daily check-in on Base. Caller pays gas only; `msg.value` must always be zero.
contract CheckIn {
    /// @notice UTC day index derived as `block.timestamp / 86400`.
    mapping(address => uint256) public lastDay;

    error ValueMustBeZero();
    error AlreadyCheckedInToday();

    event CheckedIn(address indexed user, uint256 dayIndex);

    function checkIn() external payable {
        if (msg.value != 0) revert ValueMustBeZero();
        uint256 day = block.timestamp / 1 days;
        if (lastDay[msg.sender] == day) revert AlreadyCheckedInToday();
        lastDay[msg.sender] = day;
        emit CheckedIn(msg.sender, day);
    }
}
