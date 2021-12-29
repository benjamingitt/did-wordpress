import React, {useState} from "react";
import {HashRouter as Router, Link} from "react-router-dom";
import {ProviderRpcClient, RawProviderApiResponse} from "ton-inpage-provider";

import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";
import {signerKeys, TonClient, signerNone} from "@tonclient/core";


// import {DidStorageContract} from "./contracts/DidStorageContract.js";
import {DEXClientContract} from "../extensions/contracts/testNet/DEXClientMainNet.js";
// import {DidDocumentContract} from "./contracts/DidDocumentContract.js";

import {DidStorageContract} from "./contracts/new/DidStorageContract.js";
import {DidDocumentContract} from "./contracts/new/DidDocumentContract.js";

import {useQuery} from "react-query";


//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

// let dexrootAddr =
// 	"0:49709b1fa8adc2768c4c90f1c6fef0bdb01dc959a8052b3ed072de9dfd080424";

let dexrootAddr =
	"0:c9e74798ee45b2e57661162dedeb81e8d015402f56c597747120e0de295f7441";

let walletAddr =
	"0:da136604399797f5d012ed406d541f4046d2aa5eca55290d500d2bcdfd9e2148";

// const request = () =>
// 	fetch("http://ssi.defispace.com:4001/graphql", {
// 		method: "POST",
// 		headers: {"Content-Type": "application/json; charset=utf-8"},
// 		body: JSON.stringify({
// 			query:
// 				'mutation loginGenerate{loginGenerate(did:"978cae5ccb0048de4bf6c76ffba5c2686987fd72494137de8373a84e5f720063")}',
// 		}),
// 	}).then((response) => response.json());

// const request2 = (hex) =>
// 	fetch("http://ssi.defispace.com:4001/graphql", {
// 		method: "POST",
// 		headers: {"Content-Type": "application/json; charset=utf-8"},
// 		body: JSON.stringify({
// 			query:
// 				'mutation LoginVerify{loginVerify(did:"978cae5ccb0048de4bf6c76ffba5c2686987fd72494137de8373a84e5f7200rt",signatureHex:"' +
// 				hex +
// 				'")}',
// 		}),
// 	}).then((response) => response.json());

const ton = new ProviderRpcClient();

function WelcomeDidPageEver() {
	const [didDoc, setDidDoc] = useState();

	const seed = sessionStorage.seed;

	const [pubK, setPubK] = useState();

	const [loader, setLoader] = useState(false);

	const [DID, setDID] = useState();

	const [menuCurent, setMenuCurent] = useState(0);

	const attributes = ["id","@context","controller","alsoKnownAs","verificationMethod","authentication","assertionMethod","keyAgreement","capabilityInvocation","capabilityDelegation","service"];

	const [curentAttr, setCurentAttr] = useState();

	async function getClientKeys(phrase) {
		//todo change with only pubkey returns
		let test = await client.crypto.mnemonic_derive_sign_keys({
			phrase,
			path: "m/44'/396'/0'/0/0",
			dictionary: 1,
			word_count: 12,
		});
		return test;
	}
	//setPubK((getClientKeys(seed)).public);


	// let res = request();

	// let generateResult;
	// res.then((response) => {
	// 	console.log(response);
	// 	generateResult = response.data.loginGenerate;

	// 	let res2 = request2(generateResult);

	// 	res2.then((response2) => {
	// 		console.log(response2);
	// 	});
	// });

	async function createDID3() {
        await ton.ensureInitialized();

        const {accountInteraction} = await ton.rawApi.requestPermissions({
            permissions: ['tonClient', 'accountInteraction']
        });

        console.log(accountInteraction);

		try {
			const newDIDDoc = {
				id: "did:freeton:" +accountInteraction.publicKey.toString(),
				createdAt: new Date().getTime().toString(),
				"@context": [
					"https://www.w3.org/ns/did/v1",
					"https://w3id.org/security/suites/ed25519-2020/v1",
				],
				publicKey: accountInteraction.publicKey.toString(),
				verificationMethod: {
					id: null,
					type: "Ed25519VerificationKey2020",
					controller: null,
					publicKeyMultibase: accountInteraction.publicKey,
				},
			};

			

            // const response = await ton.rawApi.sendMessage({
            //     sender: accountInteraction.address,
            //     recipient: dexrootAddr,
            //     amount: '500000000',
            //     bounce: true,
            //     payload: {
            //         abi: JSON.stringify(DidStorageContract.abi),
            //         method: 'addDid',
            //         params: {
            //             pubKey: "0x"+accountInteraction.publicKey,
            //             didDocument: JSON.stringify(newDIDDoc),
            //             addr: accountInteraction.address
            //         }
            //     }
            // });
            // console.log('response');
            // console.log(response);

			
		} catch (e) {
			console.log(e);
		}

        setTimeout(async function() {
            const {output} = await ton.rawApi.runLocal({
                address: dexrootAddr,
                functionCall: {
                    abi: JSON.stringify(DidStorageContract.abi),
                    method: 'resolveDidDocument',
                    params: {
                        id: "0x" + accountInteraction.publicKey
                    }
                }
            });
            console.log('output');
            const addrDidDoc = output.addrDidDocument;
            console.log(output, addrDidDoc);

            const {output2} = await ton.rawApi.runLocal({
                address: addrDidDoc,
                functionCall: {
                    abi: JSON.stringify(DidDocumentContract.abi),
                    method: 'getInfo',
                    params: {}
                }
            });

            console.log(output2);
    
    
            // const acc2 = new Account(DidStorageContract, {
            //     address: dexrootAddr,
            //     signer: signerNone(),
            //     client,
            // });
            // const res2 = await acc2.runLocal("resolveDidDocument", {
            //     id: "0x" + pubkey,
            // });
    
            // console.log(res2);
    
            // let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;
    
            // const didAcc = new Account(DidDocumentContract, {
            //     address: addrDidDoc,
            //     signer: signerNone(),
            //     client,
            // });
    
            // const resDid = await didAcc.runLocal("getDid", {});
    
            // //setDidDoc(resDid.decoded.out_messages[0].value.value0);
            // console.log(resDid.decoded.out_messages[0].value.value0);
        }, 5000);
        

		// try {

		// 	const newDIDDoc2 = {
		// 		id: pubkey.toString()
		// 	};

		// 	const {body} = await client.abi.encode_message_body({
		// 		abi: {type: "Contract", value: DidDocumentContract.abi},
		// 		signer: {type: "None"},
		// 		is_internal: true,
		// 		call_set: {
		// 			function_name: "newDidStatus",
		// 			input: {
		// 				status: false,
		// 			},
		// 		},
		// 	});

		// 	const res = await acc.run("sendTransaction", {
		// 		dest: dexrootAddr,
		// 		value: 500000000,
		// 		bounce: true,
		// 		flags: 3,
		// 		payload: body,
		// 	});

		// 	console.log(res);

		// 	const resDid2 = await didAcc.runLocal("getDid", {});

		// 	console.log(resDid2);

		// } catch (e) {
		// 	console.log(e);
		// }

		// const resDid2 = await didAcc.runLocal("getDid", {});

		// 	console.log(resDid2);

		// console.log(pubkey);
	}

	async function resolveDID() {
		let tempDid = DID.split(':')[2];

		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		let pubkey = (await getClientKeys(seed)).public;

		const acc2 = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});

		const res2 = await acc2.runLocal("resolveDidDocument", {
			id: "0x" + tempDid,
		});

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		const didAcc = new Account(DidDocumentContract, {
			address: addrDidDoc,
			signer: signerNone(),
			client,
		});

		const resDid = await didAcc.runLocal("getDid", {});

		setDidDoc(resDid.decoded.out_messages[0].value.value0);
		console.log(resDid.decoded.out_messages[0].value.value0);
	}

	async function updateDIDDocument() {
		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		let pubkey = (await getClientKeys(seed)).public;

		const acc2 = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});

		const res2 = await acc2.runLocal("resolveDidDocument", {
			id: "0x" + pubkey,
		});

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		const didAcc = new Account(DidDocumentContract, {
			address: addrDidDoc,
			signer: signerNone(),
			client,
		});

		console.log(JSON.stringify(didDoc.didDocument));

		try {
			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidDocumentContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "newDidDocument",
					input: {
						didDocument: didDoc.didDocument,
					},
				},
			});

			const res = await acc.run("sendTransaction", {
				dest: addrDidDoc,
				value: 300000000,
				bounce: true,
				flags: 3,
				payload: body,
			});

			console.log(res);
		} catch (e) {
			console.log(e);
		}

		const resDid = await didAcc.runLocal("getDid", {});

		//setDidDoc(resDid.decoded.out_messages[0].value.value0);
		console.log(resDid.decoded.out_messages[0].value.value0);
	}

	function addAttribute() {
		console.log(curentAttr);
		Object.keys(JSON.parse(didDoc.didDocument)).map((item)=>{
			if(item==curentAttr){
				alert("This attribute already exist!");
				return;
			}
		});
		let tempDidDoc ={};
		console.log(didDoc);
		for(let key in didDoc) {
			let temp = didDoc[key];
			if(key == "didDocument"){
				let tempDoc = JSON.parse(temp);
				tempDoc[curentAttr] = "null";
				tempDidDoc[key] = JSON.stringify(tempDoc);
			} else {
				console.log(temp);
				tempDidDoc[key] = temp;
			}
		}
		console.log(tempDidDoc);
		setDidDoc(tempDidDoc);
	}

	function deleteAttribute(item) {
		console.log(item);

		let tempDidDoc ={};
		console.log(didDoc);
		for(let key in didDoc) {
			let temp = didDoc[key];
			if(key == "didDocument"){
				let tempDoc = JSON.parse(temp);
				delete tempDoc[item];
				tempDidDoc[key] = JSON.stringify(tempDoc);
			} else {
				console.log(temp);
				tempDidDoc[key] = temp;
			}
		}
		console.log(tempDidDoc);
		setDidDoc(tempDidDoc);

	}

	function saveAttribute(item,value) {

		let tempDidDoc ={};
		console.log(didDoc);
		for(let key in didDoc) {
			let temp = didDoc[key];
			if(key == "didDocument"){
				let tempDoc = JSON.parse(temp);
				tempDoc[item] = value;
				tempDidDoc[key] = JSON.stringify(tempDoc);
			} else {
				console.log(temp);
				tempDidDoc[key] = temp;
			}
		}
		console.log(tempDidDoc);
		setDidDoc(tempDidDoc);

	}


	return (
		<Router>
			{didDoc ? (
				<div className="modal-w modal-welcome modal-did-document">
					<div className={loader ? "lds-dual-ring" : "hide"}></div>
					<div className="text">DID Document</div>

					<div className="attribute">
						<span>status:</span>
						{didDoc.status}
					</div>
					<div className="attribute">
						<span>issuerPubKey:</span>
						{didDoc.issuerPubKey}
					</div>
					<div className="attribute">
						<span>issuerAddres:</span>
						{didDoc.issuerAddr}
					</div>
					<div className="attribute">
						{Object.keys(JSON.parse(didDoc.didDocument)).map((item, i) => {
							return (
								<div>
									<span>{item}:</span>{" "}
									{JSON.stringify(JSON.parse(didDoc.didDocument)[item])}
								</div>
							);
						})}
					</div>

					<div className="menu-document">
						<span className={menuCurent==0?"active":""} onClick={()=>setMenuCurent(0)}>New Document</span>
						<span className={menuCurent==1?"active":""} onClick={()=>setMenuCurent(1)}>Change Status</span>
						<span className={menuCurent==2?"active":""} onClick={()=>setMenuCurent(2)}>New IssuerPubKey</span>
						<span className={menuCurent==3?"active":""} onClick={()=>setMenuCurent(3)}>Delete Document</span>
						
					</div>
					<div class="content-document">
						<div className={menuCurent==0?"menu-item new-did":"hide"}>
							<div className="curent-attr">
								{Object.keys(JSON.parse(didDoc.didDocument)).map((item, i) => {
									let temp;
									return (
										<div>
											<span>{item}:</span>{" "}
											<input type="text" onChange={(ev)=>{temp=ev.target.value}} placeholder={JSON.stringify(JSON.parse(didDoc.didDocument)[item])}/>
											<button onClick={()=>deleteAttribute(item)}>Delete</button>
											<button onClick={()=>{saveAttribute(item,temp)}}>Save</button>
										</div>
									);
								})}
							</div>
							<div class="new-attr">
								<select name="" id="" onChange={(ev)=>{setCurentAttr(ev.target.value)}}>
									{attributes.map((item,i)=>{
										return(
										<option>{item}</option>
										);
									})}
								</select>
								<button onClick={addAttribute}>Add attribute</button>
							</div>
							<button onClick={updateDIDDocument}>Save Changes</button>
						</div>
						<div className={menuCurent==1?"menu-item":"hide"}>
							<div>
								<select name="" id="">
									<option value="">active</option>
									<option value="">inactive</option>
								</select>
							</div>
							<button>Save Changes</button>
						</div>
						<div className={menuCurent==2?"menu-item":"hide"}>
							<div>
								<input type="text" placeholder="New PubKey"/>
							</div>
							<button>Save Changes</button>
						</div>
						<div className={menuCurent==3?"menu-item":"hide"}>
							<button>Delete Document</button>
						</div>
						
					</div>



					<div className="note">
						Note: Transactions can take 5 to 15 seconds
					</div>
				</div>
			) : (
				<div className="modal-w modal-welcome">
					<div className={loader ? "lds-dual-ring" : "hide"}></div>
					<div className="text">Welcome!</div>

					{/* <button type="button" className="btn btn-secondary" onClick={DidCreate}>
					I want to create DID
				</button>
				<button type="button" className="btn btn-secondary" onClick={createDID}>
					I want to create DID2
				</button> */}
					<button
						type="button"
						className="btn btn-secondary"
						onClick={createDID3}
					>
						I want to create DID
					</button>

					<div class="text">I already have a DID</div>
					<input
						type="text"
						placeholder="DID"
						onChange={(ev) => {
							setDID(ev.target.value);
						}}
					/>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={resolveDID}
					>
						Log in with DID
					</button>
				</div>
			)}
		</Router>
	);
}

export default WelcomeDidPageEver;
