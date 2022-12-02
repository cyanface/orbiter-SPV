const { initialize } = require("zokrates-js");
const fs = require("fs");
const path = require("path");

const { ethers } = require("ethers");
const { Chain, Common, Hardfork } = require("@ethereumjs/common");
const { Block } = require("@ethereumjs/block");
const { keccak256 } = require("ethereum-cryptography/keccak.js");
const { RLP } = require("@ethereumjs/rlp");
const { bufArrToArr, toBuffer } = require("@ethereumjs/util");
const { Trie } = require("@ethereumjs/trie");
const { index2key } = require("./utils");

const txhashIndex = process.argv.indexOf("--txhash");

if (txhashIndex == -1) {
  console.error("Expected --txhash argument");
  process.exit(1);
}

let txhash = process.argv[txhashIndex + 1];

async function main() {
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    "1151f1c1883542b2aad91169712e8338"
  );
  const common = new Common({ chain: Chain.Mainnet });

  let txdata = await provider.getTransaction(txhash);
  const block = await Block.fromEthersProvider(provider, txdata.blockHash, {
    common,
    hardforkByBlockNumber: true,
  });

  const trie = new Trie();

  await Promise.all(
    block.transactions.map((tx, i) =>
      (async (tx, i) => {
        return await trie.put(RLP.encode(i), tx.serialize());
      })(tx, i)
    )
  );

  const mptkey = RLP.encode(txdata.transactionIndex);
  const proof = await trie.createProof(mptkey);

  let bufferargs = [block.header.transactionsTrie, toBuffer(keccak256(await trie.get(mptkey)))];
  for (let i = 0; i < proof.length; i++) {
    bufferargs.push(proof[i]);
  }

  const indexkey = toBuffer(index2key(txdata.transactionIndex, proof.length));
  bufferargs.push(indexkey);

  console.log(bufferargs);

  let args = "";
  bufferargs.map((v) => {
    let arr = bufArrToArr(v);
    arr.map((v) => {
      args += v + " ";
    });
  });
  fs.writeFile("./input.txhash.data", args.trimEnd(), (error) => {
    console.log(error);
  });
  return;

  initialize().then((zokratesProvider) => {
    //   const source = "def main(private field a) -> field { return a * a; }";
    // compilation
    //   const artifacts = zokratesProvider.compile(source);

    // const { source, location } = fileSystemResolver("circuits/txproof", "txproof");

    // const artifacts = zokratesProvider.compile(source);

    // const options = {
    //   location: path.resolve("circuits/txproof"), // location of the root module
    //   resolveCallback: (currentLocation, importLocation) => {
    //     console.log(currentLocation + " is importing " + importLocation);
    //     return fileSystemResolver(currentLocation, importLocation);
    //   },
    //   config: { debug: true },
    // };
    // const artifacts = zokratesProvider.compile(source, options);

    let artifacts = fs.readFileSync("./tx").toString();
    // computation
    const { witness, output } = zokratesProvider.computeWitness(artifacts, args);
    console.log(output);

    // // run setup
    // const keypair = zokratesProvider.setup(artifacts.program);

    // // generate proof
    // const proof = zokratesProvider.generateProof(artifacts.program, witness, keypair.pk);

    // // export solidity verifier
    // const verifier = zokratesProvider.exportSolidityVerifier(keypair.vk);

    // // or verify off-chain
    // const isVerified = zokratesProvider.verify(keypair.vk, proof);
  });
}

main();
