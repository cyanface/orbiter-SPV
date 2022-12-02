// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./libs/BlockData.sol";
import "./libs/RLPMPT.sol";
import "./libs/MerkleProof.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract SPV {
    using RLPMPT for RLPMPT.MerkleProof;

    mapping(bytes32 => bool) transactionSPVList;

    event SPVVerified(bytes transactionHash);

    function L1TxVerify(
        bytes memory txserialized,
        bytes[] memory blockHeaderData,
        bytes memory mptKey,
        bytes[] memory proof
    ) public {
        RLPMPT.MerkleProof memory data;

        data.expectedRoot = RLPMPT.b2b32(blockHeaderData[4]);
        data.key = mptKey;
        data.proof = proof;
        data.keyIndex = 0;
        data.proofIndex = 0;
        data.expectedValue = txserialized;

        bool v = data.verifyTrieProof();
        require(v == true, "tx's trie proof failed");

        uint256 blockNumber = uint256(BlockData.bytesToUint(blockHeaderData[8]));

        //todo more than 256 block ranges support
        if (block.number > blockNumber && (blockNumber + 256) > block.number) {
            bytes32 blockHash = blockhash(blockNumber);
            require(blockHash == BlockData.blockHash(blockHeaderData), "block hash mis match");
        } else {
            //todo BlockHistory proof
        }

        transactionSPVList[keccak256(data.expectedValue)] = true;
    }

    function directTest(RLPMPT.MerkleProof memory data) public view returns (bool) {
        return data.verifyTrieProof();
    }

    function testRLPKeccak256(bytes memory rlpdata) public pure returns (bytes32) {
        return keccak256(rlpdata);
    }

    function getTXSPVState(bytes32 txhash) public view returns (bool) {
        return transactionSPVList[txhash];
    }

    function verifyMerkleProof(bytes32[] memory proof, bytes32 leaf, bytes32 root) public view returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }
}
