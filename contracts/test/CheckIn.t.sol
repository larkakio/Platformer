// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    CheckIn public c;
    address alice = address(0xA11CE);

    function setUp() public {
        c = new CheckIn();
    }

    function test_checkIn_oncePerDay() public {
        vm.startPrank(alice);
        uint256 ts = 1_700_000_000;
        vm.warp(ts);
        c.checkIn();
        assertEq(c.lastDay(alice), ts / 1 days);

        vm.expectRevert(CheckIn.AlreadyCheckedInToday.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_nextDayAllowsAgain() public {
        vm.startPrank(alice);
        uint256 t = 100 * 1 days;
        vm.warp(t);
        c.checkIn();
        vm.expectRevert(CheckIn.AlreadyCheckedInToday.selector);
        c.checkIn();

        vm.warp(t + 1 days);
        c.checkIn();
        assertEq(c.lastDay(alice), (t + 1 days) / 1 days);
        vm.stopPrank();
    }

    function test_rejectsNonZeroValue() public {
        vm.startPrank(alice);
        vm.deal(alice, 1 ether);
        vm.expectRevert(CheckIn.ValueMustBeZero.selector);
        c.checkIn{value: 1 wei}();
        vm.stopPrank();
    }

    function test_emitsCheckedIn() public {
        vm.startPrank(alice);
        vm.warp(50 * 1 days);
        uint256 dayIdx = block.timestamp / 1 days;

        vm.expectEmit(true, false, false, true);
        emit CheckIn.CheckedIn(alice, dayIdx);
        c.checkIn();
        vm.stopPrank();
    }
}
