const fs = require('fs');
const { ethers } = require('ethers');

fs.createWriteStream('IPFS_LINKS.txt');
const gender = ['male', 'female', 'other'];

//--------------------------------------- Provider and Signer Starts Here --------------------------------------------
const dogNftAddress = '0x324fC464eCca2DA4Dd7436F46265134f5686479f';
const marketAddress = '0x693D75989c3669D438E6a279dfFd14717874cdD3';
const marketAbi = fs.readFileSync('./marketABI.json').toString();
const dogNftAbi = fs.readFileSync('./dogABI.json').toString();

const TESTNET_ENDPOINT =
  'https://data-seed-prebsc-1-s1.binance.org:8545/';
const privateKey =
  '70080423dcb2a9c24e2701b73bd1d65b8b08642d7e7d8c428385c75922d4e6b2';
const provider = new ethers.providers.JsonRpcProvider(
  TESTNET_ENDPOINT
);
const signer = new ethers.Wallet(privateKey, provider);
const dogContract = new ethers.Contract(
  dogNftAddress,
  dogNftAbi,
  signer
);
const marketContract = new ethers.Contract(
  marketAddress,
  marketAbi,
  signer
);
//--------------------------------------- Provider and Signer Ends Here ------------------------------------------------

//--------------------------------------- Nonce Starts Here ------------------------------------------------
async function getNonce(signer) {
  return (await signer).getTransactionCount();
}
//--------------------------------------- Nonce Ends Here ------------------------------------------------
const sleep = (ms = 3000) => new Promise((r) => setTimeout(r, ms));

const allFileContents = fs.readFileSync('links.txt', 'utf-8');

allFileContents.split('\n').forEach(async (element) => {
  if (element.length > 0) {
    const _gender = Math.floor(Math.random() * gender.length);
    const nonce = await getNonce(signer);
    const gasLimit = 6000000;
    let attributes = [
      String(Math.floor(Math.random() * 101)),
      String(Math.floor(Math.random() * 101)),
      String(Math.floor(Math.random() * 101)),
      String(Math.floor(Math.random() * 101)),
      String(Math.floor(Math.random() * 101)),
      String(Math.floor(Math.random() * 101)),
    ];
    console.log({ _gender, attributes, element });
    try {
      const _createCollectible = await dogContract.createCollectible(
        element,
        attributes,
        _gender
      );
      await _createCollectible.wait();
      await sleep();
      console.log(_createCollectible);
    } catch (err) {
      console.log(err);
    }
    try {
      let tokenCounter = await dogContract.tokenCounter();
      console.log(tokenCounter);
      let tokenID;
      if (tokenCounter > 1) {
        tokenID = tokenCounter.toNumber() - 1;
      } else {
        tokenID = 0;
      }

      const _approve = await dogContract.approve(
        marketAddress,
        tokenID
      );
      await _approve.wait();

      const _value = ethers.utils.parseEther('0.001');

      const _addMarketItem = await marketContract.addMarketItem(
        tokenID,
        dogNftAddress,
        {
          value: _value,
          nonce: nonce,
          gasLimit: gasLimit,
        }
      );

      await _addMarketItem.wait();
    } catch (error) {
      console.log(error);
    }
  }
});
