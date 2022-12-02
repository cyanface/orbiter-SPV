const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { Chain, Common, Hardfork } = require("@ethereumjs/common");
const { Block } = require("@ethereumjs/block");
const { keccak256 } = require("ethereum-cryptography/keccak.js");
const { RLP } = require("@ethereumjs/rlp");
const { toBuffer, bufferToHex, bigIntToHex } = require("@ethereumjs/util");
const { BlockHeader } = require("@ethereumjs/block");
const { Trie } = require("@ethereumjs/trie");
const { TransactionFactory } = require("@ethereumjs/tx");
const { normalizeTxParams } = require("@ethereumjs/tx/dist/fromRpc");

const { index2key } = require("../scripts/utils");

const { GetProof } = require("eth-proof");
const getProof = new GetProof("https://mainnet.infura.io/v3/1151f1c1883542b2aad91169712e8338");

describe("SPV", function () {
  async function deploy() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SPV = await ethers.getContractFactory("SPV", {
      // libraries: {
      //   MTPVerifier: mptVerifier.address,
      // },
    });
    const spv = await SPV.deploy();

    return { spv, owner, otherAccount };
  }

  describe("SPV Mainnet tx", function () {
    it("should verified", async function () {
      const { spv } = await loadFixture(deploy);

      const provider = new ethers.providers.InfuraProvider(
        "mainnet",
        "1151f1c1883542b2aad91169712e8338"
      );
      const common = new Common({ chain: Chain.Mainnet });

      // const tx = "0xc1bf8fe32e8b868887efc657ca0e1aa5ab10e59de946f46d563b67643e0175d7";
      // const tx = "0x5d08e5fbc19a311c4f16bd6f725f92433bb64f0098aff93a1a55326e1ebef73d";
      const tx = "0xbb48e3ad16a0ab5fa5250db6c845c27edf697d9d9d215c738679f0e7ec14ee1e";

      let txdata = await provider.getTransaction(tx);
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

      let hexproof = [];
      for (let i = 0; i < proof.length; i++) {
        hexproof[i] = bufferToHex(proof[i]);
      }

      const blockheaderparams = block.header.raw();
      for (let i = 0; i < blockheaderparams.length; i++) {
        blockheaderparams[i] = bufferToHex(blockheaderparams[i]);
      }

      const txserialized = bufferToHex(await trie.get(mptkey));

      await spv.L1TxVerify(
        txserialized,
        blockheaderparams,
        index2key(txdata.transactionIndex, hexproof.length),
        hexproof
      );
    });
  });
});
