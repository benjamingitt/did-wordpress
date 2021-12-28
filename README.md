# DEX frontend

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

connectToPair
Globally allows dex client to connect to pair including sharding optimization of deployed wallets

## API methods

### getCurrentExtension()

Returns object with unified current extension main methods

```
async function broxus() {

    await ton.ensureInitialized();
    const {accountInteraction} = await ton.requestPermissions({
        permissions: ['tonClient', 'accountInteraction']
    });
    if (accountInteraction == null) {
        return new Error('Insufficient permissions');
    }
    let curExtenson = {};
    let providerState = await ton.getProviderState();
    let netType = providerState.selectedConnection;
    curExtenson.network = nets[netType]
    curExtenson.name = "broxus";
    curExtenson.address = accountInteraction.address._address;
    curExtenson.pubkey = accountInteraction.publicKey;
    curExtenson.contract = (contractAbi, contractAddress) => {
        return new Contract(contractAbi, new AddressLiteral(contractAddress))
    };
    curExtenson.runMethod = async (methodName, params, contract) => {
        return await contract.methods[methodName](params).call({cachedState: undefined})
    };
    curExtenson.callMethod = async (methodName, params, contract) => {
        return await contract.methods[methodName](params).sendExternal({publicKey: accountInteraction.publicKey})
    };
    curExtenson.SendTransfer = async (to,amount) => {
        return await ton.sendMessage({
            sender: curExtenson.address,
            recipient: new Address(to),
            amount: amount,
            bounce: false
        })
    }
    return curExtenson
}
```

```
async function extraton() {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    let wallet = signer.getWallet()

    let curExtenson = {};
    curExtenson.network = network.server;
    curExtenson.name = "extraton";
    curExtenson.address = signer.wallet.address;
    curExtenson.pubkey = await signer.getPublicKey();
    curExtenson.contract = (contractAbi, contractAddress) => {
        return new freeton.Contract(signer, contractAbi, contractAddress)
    };
    curExtenson.runMethod = async (methodName, params, contract) => {
        return await contract.methods[methodName].run(params)
    };
    curExtenson.callMethod = async (methodName, params, contract) => {
        return await contract.methods[methodName].call(params)
    };
    curExtenson.SendTransfer = async (to,amount) => {
        return await wallet.transfer(to, amount, false,"")
    }
    return curExtenson
}
```

### setCreator()

Function to deploy dex client - it is performed in several stages:

- first step - check client exists on dex root as creator(need to send few tons as pay for register your pubkey on dex root)
  - if false will offer you to send transfer
- second step - get shard arg
- last one - createDEXclient methos that you should sign in extension.

Dex client will be deployes in few seconds.

### connectToPair()

Function to connect to dex pair - it is performed in several stages:

- first step - connectPair, pair sets it`s data to dex client
- second step - get shard arg for all wallets that need to deploy - depends on pair token roots
- last step - deploy wallets that client does not have

### swapA()/swapB()

Allows user to use processSwapA/processSwapB call method on dex client smart contract

```
export async function swapA(curExt,pairAddr, qtyA) {
    const {pubkey, contract, callMethod,SendTransfer} = curExt._extLib
    let getClientAddressFromRoot = await checkPubKey(pubkey)
    if(getClientAddressFromRoot.status === false){
        return getClientAddressFromRoot
    }
    let checkClientBalance = await getClientBalance(getClientAddressFromRoot.dexclient)
    if(500000000 > (checkClientBalance*1000000000)){
        await transfer(SendTransfer,getClientAddressFromRoot.dexclient,3000000000)
    }
    try {
        const clientContract = await contract(DEXclientContract.abi, getClientAddressFromRoot.dexclient);
        const processSwapA = await callMethod("processSwapA", {pairAddr:pairAddr, qtyA:qtyA}, clientContract)
        return processSwapA
    } catch (e) {
        return e
    }
}
```

### processLiquidity()

Push liquidity to pair, it turns out LP tokens for some amount of qtyA & qtyB tokens

```

export async function processLiquidity(curExt,pairAddr, qtyA, qtyB) {
    const {pubkey, contract, SendTransfer, callMethod} = curExt._extLib
    let getClientAddressFromRoot = await checkPubKey(pubkey)
    if(getClientAddressFromRoot.status === false){
        return getClientAddressFromRoot
    }
    let checkClientBalance = await getClientBalance(getClientAddressFromRoot.dexclient)
    if(500000000 > (checkClientBalance*1000000000)){
        await transfer(SendTransfer,getClientAddressFromRoot.dexclient,3000000000)
    }
    try {
        const clientContract = await contract(DEXclientContract.abi, getClientAddressFromRoot.dexclient);
        const processLiquidity = await callMethod("processLiquidity", {pairAddr:pairAddr, qtyA:Number(qtyA).toFixed(0), qtyB:Number(qtyB).toFixed(0)}, clientContract)
        return processLiquidity
    } catch (e) {
        return e
    }
}
```

### returnLiquidity()

Return liquidity from pair, it turns out tokens of pair for LP tokens or pair

```
export async function returnLiquidity(curExt,pairAddr, tokens) {
    const {pubkey, contract, SendTransfer, callMethod} = curExt._extLib
    let getClientAddressFromRoot = await checkPubKey(pubkey)
    if(getClientAddressFromRoot.status === false){
        return getClientAddressFromRoot
    }
    let checkClientBalance = await getClientBalance(getClientAddressFromRoot.dexclient)
    if(500000000 > (checkClientBalance*1000000000)){
        await transfer(SendTransfer,getClientAddressFromRoot.dexclient,3000000000)
    }
    try {
        const clientContract = await contract(DEXclientContract.abi, getClientAddressFromRoot.dexclient);
        const returnLiquidity = await callMethod("returnLiquidity", {pairAddr:pairAddr, tokens: tokens}, clientContract)
        return returnLiquidity
    } catch (e) {
        return e
    }
}
```
