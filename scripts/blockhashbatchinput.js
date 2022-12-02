const fs = require("fs");

const { ethers } = require("ethers");
const { Chain, Common } = require("@ethereumjs/common");
const { Block } = require("@ethereumjs/block");
const { bufArrToArr, bufferToHex, toBuffer } = require("@ethereumjs/util");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const startBlockIndex = process.argv.indexOf("--startblock");

if (startBlockIndex == -1) {
  console.error("Expected --startblock argument");
  process.exit(1);
}

let startblock = BigInt(process.argv[startBlockIndex + 1]);

async function main() {
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    "1151f1c1883542b2aad91169712e8338"
  );
  const common = new Common({ chain: Chain.Mainnet });

  const block = await Block.fromEthersProvider(provider, startblock, {
    common,
    hardforkByBlockNumber: true,
  });

  let bufferargs = [];
  bufferargs.push(block.hash());

  startblock++;

  let blockrlps = [];
  let values = [];
  for (let i = 0; i < 10; i++) {
    const block = await Block.fromEthersProvider(provider, startblock, {
      common,
      hardforkByBlockNumber: true,
    });

    const blockrlp = block.header.serialize();
    blockrlps.push(blockrlp);
    console.log(blockrlp.length);
    startblock++;
    values.push([bufferToHex(block.hash())]);
  }
  bufferargs = bufferargs.concat(blockrlps);

  const tree = StandardMerkleTree.of(values, ["bytes32"]);

  let proofs = [];
  for (const [i, v] of tree.entries()) {
    const proofhex = tree.getProof(i);
    let proof = [];
    proofhex.map((v) => {
      proof.push(toBuffer(v));
    });
    proofs = proofs.concat(proof);
  }
  bufferargs = bufferargs.concat(proofs);

  bufferargs.push(toBuffer(tree.root));

  let args = "";

  bufferargs.map((v) => {
    const arr = bufArrToArr(v);
    arr.map((t) => {
      args += t + " ";
    });
  });

  fs.writeFile("./input.blockhashbatch.data", args, (error) => {
    console.log(error);
  });
}

main();
