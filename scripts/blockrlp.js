const fs = require("fs");
const path = require("path");

const { ethers } = require("ethers");
const { Chain, Common, Hardfork } = require("@ethereumjs/common");
const { Block } = require("@ethereumjs/block");
const { bufArrToArr, bufferToHex, toBuffer } = require("@ethereumjs/util");

const blockNumIndex = process.argv.indexOf("--blocknumber");

if (blockNumIndex == -1) {
  console.error("Expected --blocknumber argument");
  process.exit(1);
}

let blocknumber = BigInt(process.argv[blockNumIndex + 1]);

async function main() {
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    "1151f1c1883542b2aad91169712e8338"
  );
  const common = new Common({ chain: Chain.Mainnet });

  const block = await Block.fromEthersProvider(provider, blocknumber, {
    common,
    hardforkByBlockNumber: true,
  });

  let args = "";

  const arr = bufArrToArr(block.header.serialize());
  arr.map((t) => {
    args += t + " ";
  });

  args = args.trimEnd();

  fs.writeFile("./input.blockrlp.data", args, (error) => {
    console.log(error);
  });
}

main();
