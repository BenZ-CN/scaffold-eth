/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

const delayMS = 1000 //sometimes xDAI needs a 6000ms break lol 😅

const main = async () => {

    // ADDRESS TO MINT TO:
    const toAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  
    console.log("\n\n 🎫 Minting to "+toAddress+"...\n");
  
    const { deployer } = await getNamedAccounts();
    console.info("deployer",deployer);
    // const yourCollectible = await ethers.getContract("YourCollectible", deployer);
    var signer = await ethers.getSigner(deployer);
    const yourCollectible = await ethers.getContractAt("YourCollectible","0x5FbDB2315678afecb367f032d93F642f64180aa3", signer);
  //   console.info("yourCollectible",yourCollectible);
  
    console.log("Minting buffalo with Test hash (QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr)")
    var itemId = await yourCollectible.mintItem(toAddress,"QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr",{gasLimit:400000})
    console.info("itemId",itemId);
  
  
    var owner = await yourCollectible.owner();
    console.info("owner",owner);
    
    await sleep(delayMS)
    console.log("Transferring Ownership of YourCollectible to "+toAddress+"...")
    var transfer = await yourCollectible.transferOwnership(toAddress, { gasLimit: 400000 });
    console.info("transfer",transfer);
    return;

};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
