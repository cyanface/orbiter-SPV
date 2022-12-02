#!/bin/bash

node ./blockhashbatchinput.js --startblock $1
cd ../circuits/
zokrates compute-witness --verbose -i blockhash --stdin  < ../scripts/input.blockhashbatch.data
zokrates generate-proof -i blockhash 