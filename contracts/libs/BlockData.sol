// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./RLPEncode.sol";

library BlockData {
    function blockHash(bytes[] memory blockHeaderData) internal pure returns (bytes32) {
        return keccak256(serializeBlockHeader(blockHeaderData));
    }

    function serializeBlockHeader(bytes[] memory blockHeaderData) internal pure returns (bytes memory) {
        return RLPEncode.encodeArr(blockHeaderData);
    }

    function transactionHash(bytes[] memory txInfo) internal pure returns (bytes32) {
        return keccak256(serializeTxInfo(txInfo));
    }

    function serializeTxInfo(bytes[] memory txInfo) internal pure returns (bytes memory) {
        return RLPEncode.encodeTx(txInfo);
    }

    function bytesToUint(bytes memory b) internal pure returns (uint256) {
        uint256 number;
        for (uint256 i = 0; i < b.length; i++) {
            number = number + uint256(uint8(b[i])) * (2 ** (8 * (b.length - (i + 1))));
        }
        return number;
    }
}
