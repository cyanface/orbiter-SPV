// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./libs/MerkleProof.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

struct historyBatch {
    bytes32 parentEndHash;
    bytes32 rootHash;
    uint256 lastBlockNumber;
}

contract BlockHistory {
    // endHash =>
    mapping(bytes32 => historyBatch) public historyBatches;

    event SPVVerified(bytes transactionHash);

    constructor() {
        historyBatches[blockhash(block.number)].lastBlockNumber = block.number;
    }

    function addBatch(bytes32 parentEndHash, uint256 lastBlockNumber, bytes32 endHash, bytes32 rootHash) public {
        //todo zkp verify
        require(historyBatches[parentEndHash].lastBlockNumber > 0, "parent end hash not exist");
        require(blockhash(lastBlockNumber) == endHash, "end hash not verified");
        historyBatches[endHash].parentEndHash = parentEndHash;
        historyBatches[endHash].rootHash = rootHash;
        historyBatches[endHash].lastBlockNumber = lastBlockNumber;
    }

    function verifyBlockHashProof(bytes32[] memory proof, bytes32 blockHash, bytes32 batchEndHash)
        public
        view
        returns (bool)
    {
        bytes32 rootHash = historyBatches[batchEndHash].rootHash;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(blockHash))));

        return MerkleProof.verify(proof, rootHash, leaf);
    }
}
