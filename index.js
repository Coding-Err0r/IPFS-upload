const { create } = require('ipfs-http-client');
const fs = require('fs');
const { ethers } = require('ethers');
const readline = require('readline');

fs.createWriteStream('IPFS_LINKS.txt');
const categories = [
  'Dogs',
  'Cats',
  'Birds',
  'Reptiles',
  'Amphibians',
];

const gender = ['male', 'female', 'other'];

//--------------------------------------- Provider and Signer Starts Here --------------------------------------------
const dogNftAddress = '0x815202089ED79444CdeC2092E127b489b36DeB94';
const marketAddress = '0xFcDf2A1Ad2A62d364AE03B2478CCB0B9E976249F';
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
const dogABI = fs.readFileSync('./dogABI.json').toString();
const dogContract = new ethers.Contract(
  dogNftAddress,
  dogABI,
  signer
);
//--------------------------------------- Provider and Signer Ends Here --------------------------------------------
async function getNonce(signer) {
  return (await signer).getTransactionCount();
}

const sleep = (ms = 3000) => new Promise((r) => setTimeout(r, ms));

const ipfsClient = async () => {
  const ipfs = await create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
  });
  return ipfs;
};

const uploadImagesAndEditJson = () => {
  var FILES = fs.readdirSync('./build/images/');
  FILES.map(async (_image) => {
    var _id = String(_image).replace('.png', '');
    try {
      let ipfs = await ipfsClient();
      let img = fs.readFileSync('./build/images/' + _image);
      let options = {
        warpWithDirectory: false,
        // progress: (prog) => console.log(`Saved :${prog}`),
      };
      let result = await ipfs.add(img, options);
      await sleep();
      var CID = String(result['cid']);
      var url = 'https://ipfs.io/ipfs/' + CID;

      const category = Math.floor(Math.random() * categories.length);
      var fileName = `./build/json/${_id}.json`;
      var json_file = require(fileName);
      json_file.image = url;
      json_file.category = categories[category];
      fs.writeFile(
        fileName,
        JSON.stringify(json_file),
        function writeJSON(err) {
          if (err) return console.log(err);
        }
      );
      console.log(`${_id} has been updated`);
    } catch (e) {
      console.log('Image Failed To Be Uploaded To IPFS');
    }
  });
};

const uploadJsonAndSaveText = () => {
  var JSON_FILES = fs.readdirSync('./build/json/');
  JSON_FILES.map(async (item) => {
    let link = '';
    let _jsonFilePath = './build/json/' + item;
    try {
      let ipfs = await ipfsClient();
      let data = fs.readFileSync(_jsonFilePath);
      const json = JSON.parse(data);
      let result = await ipfs.add(data);
      await sleep();
      var CID = String(result['cid']);
      var url = 'https://ipfs.io/ipfs/' + CID;
      console.log(url);
      link = url + '\n';
      fs.appendFile('IPFS_LINKS.txt', link, (err) => {
        if (err) throw err;
      });
      await sleep();
    } catch (e) {
      console.log(e);
    }
  });
};

const CONTRACT_UPLOAD = async (url) => {
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
  await sleep();
};

uploadImagesAndEditJson();
uploadJsonAndSaveText();

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
    console.log({ element, attributes, _gender });
    console.log(
      '----------------------------------------------------------------'
    );
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
  }
});
