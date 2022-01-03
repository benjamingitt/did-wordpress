import React, {useState} from "react";
import {HashRouter as Router, Link} from "react-router-dom";
import {ProviderRpcClient, RawProviderApiResponse} from "ton-inpage-provider";

import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";
import {signerKeys, TonClient, signerNone} from "@tonclient/core";

// import {DidStorageContract} from "./contracts/DidStorageContract.js";
import {DEXClientContract} from "../extensions/contracts/testNet/DEXClientMainNet.js";
// import {DidDocumentContract} from "./contracts/DidDocumentContract.js";

import {DidStorageContract} from "./contracts/new/DidStorageContractNew.js";
import {DidDocumentContract} from "./contracts/new/DidDocumentContractNew.js";

import {useQuery} from "react-query";

//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

// let dexrootAddr =
// 	"0:49709b1fa8adc2768c4c90f1c6fef0bdb01dc959a8052b3ed072de9dfd080424";

// let dexrootAddr =
// 	"0:c9e74798ee45b2e57661162dedeb81e8d015402f56c597747120e0de295f7441";

let dexrootAddr = "0:ee63d43c1f5ea924d3d47c5a264ad2661b5a4193963915d89f3116315350d7d3";

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

function WelcomeDidPage() {
	const [didDoc, setDidDoc] = useState();

	const seed = sessionStorage.seed;

	const [pubK, setPubK] = useState();

	const [loader, setLoader] = useState(false);

	const [DID, setDID] = useState();

	const [menuCurent, setMenuCurent] = useState(0);

	const attributes = ["id","@context","controller","alsoKnownAs","verificationMethod","authentication","assertionMethod","keyAgreement","capabilityInvocation","capabilityDelegation","service"];

	const [curentAttr, setCurentAttr] = useState();

	const [curentStatus, setCurentStatus] = useState();

	const [curentPub , setCurentPub] = useState();

	const [curentAddr, setCurentAddr] = useState();

	const [alertW, setAlertW] = useState({
		hidden: true,
		text: "",
		title: ""
	});

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

	async function getClientBalance(clientAddress) {
		console.log("clientAddress", clientAddress);
		let address = clientAddress;
		if (
			clientAddress ===
			"0:0000000000000000000000000000000000000000000000000000000000000000"
		)
			return 0;
		try {
			let clientBalance = await client.net.query_collection({
				collection: "accounts",
				filter: {
					id: {
						eq: address,
					},
				},
				result: "balance",
			});
			console.log("clientBalance", clientBalance);
			return +clientBalance.result[0].balance / 1000000000;
		} catch (e) {
			console.log("catch E", e);
			return e;
		}
	}

	async function createDID3() {


		let bal = getClientBalance(localStorage.address);

		bal.then(
			async (data) => {
				if(data < 1){
					alert("Insufficient balance");
					return;
				} else {

					setLoader(true);

					const acc = new Account(DEXClientContract, {
						address: localStorage.address,
						signer: signerKeys(await getClientKeys(sessionStorage.seed)),
						client,
					});

					let pubkey = (await getClientKeys(seed)).public;

					try {
						const newDIDDoc = {
							id: "did:freeton:" +pubkey.toString(),
							//createdAt: new Date().getTime().toString(),
							"@context": [
								"https://www.w3.org/ns/did/v1",
								"https://w3id.org/security/suites/ed25519-2020/v1",
							],
							publicKey: pubkey.toString(),
							verificationMethod: {
								id: "did:freeton:" +pubkey.toString(),
								type: "Ed25519VerificationKey2020",
								controller: "did:freeton:" +pubkey.toString(),
								publicKeyMultibase: pubkey,
							},
						};

						const {body} = await client.abi.encode_message_body({
							abi: {type: "Contract", value: DidStorageContract.abi},
							signer: {type: "None"},
							is_internal: true,
							call_set: {
								function_name: "addDid",
								input: {
									pubKey: "0x" + pubkey,
									didDocument: JSON.stringify(newDIDDoc),
									addr: localStorage.address,
								},
							},
						});

						const res = await acc.run("sendTransaction", {
							dest: dexrootAddr,
							value: 500000000,
							bounce: true,
							flags: 3,
							payload: body,
						});

						console.log(res);
					} catch (e) {
						console.log(e);
					}

					// try{
					// 	const acc2 = new Account(DidStorageContract, {
					// 		address: dexrootAddr,
					// 		signer: signerNone(),
					// 		client,
					// 	});
					// 	const res2 = await acc2.runLocal("resolveDidDocument", {
					// 		id: "0x" + pubkey,
					// 	});
				
					// 	console.log(res2);
				
					// 	let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;
				
					// 	const didAcc = new Account(DidDocumentContract, {
					// 		address: addrDidDoc,
					// 		signer: signerNone(),
					// 		client,
					// 	});
				
					// 	const resDid = await didAcc.runLocal("getDid", {});
				
					// 	//setDidDoc(resDid.decoded.out_messages[0].value.value0);
					// 	console.log(resDid.decoded.out_messages[0].value.value0);
					// } catch(e) {
					// 	console.log(e);
					// }



					setTimeout(async function(){
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

						try{

							const accDid = new Account(DidDocumentContract, {
								address: addrDidDoc,
								signer: signerNone(),
								client,
							})

							const resInit = await accDid.run("init", {
								issuerAddr: localStorage.address
							}, {
								signer: signerKeys(await getClientKeys(sessionStorage.seed))
							})

							console.log(resInit);

						} catch(e) {
							console.log(e);
							setLoader(false);
							alert("Error!")
							return;
						}
				
						const didAcc = new Account(DidDocumentContract, {
							address: addrDidDoc,
							signer: signerNone(),
							client,
						});
				
						const resDid = await didAcc.runLocal("getDid", {});
				
						//setDidDoc(resDid.decoded.out_messages[0].value.value0);
						console.log(resDid.decoded.out_messages[0].value.value0);

						let tempDoc = JSON.parse(resDid.decoded.out_messages[0].value.value0.didDocument);

						let tempDid = tempDoc.id;

						console.log(tempDoc);

						console.log(tempDid);

						setLoader(false);
						setAlertW({
							hidden: false,
							text: "Your DID has been created: " + tempDid,
							title: "Congratulations"
						})
					},20000);

				}
			}
		);

		

		
	}

	async function resolveDID() {

		let tempDid = DID.split(':')[2];
		console.log(DID);
		

		setLoader(true);

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

		let res2;

		try{
			res2 = await acc2.runLocal("resolveDidDocument", {
				id: "0x" + tempDid,
			});
		} catch {
			setLoader(false);
			alert("Incorrect format DID");
			return;
		}

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		try{
			const didAcc = new Account(DidDocumentContract, {
				address: addrDidDoc,
				signer: signerNone(),
				client,
			});
	
			const resDid = await didAcc.runLocal("getDid", {});

			setLoader(false);
			setDidDoc(resDid.decoded.out_messages[0].value.value0);
			console.log(resDid.decoded.out_messages[0].value.value0);
		} catch(e) {
			console.log(e);
			setLoader(false);
			alert("Error! \n Possible reasons: \n - Wrong DID \n - This DID has been deleted");
		}

		
	}

	async function updateDIDDocument() {
		let tempDid = DID.split(':')[2];
		console.log(DID);

		setLoader(true);

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

		setTimeout(async function(){
			try{
				const resDid = await didAcc.runLocal("getDid", {});

				setDidDoc(resDid.decoded.out_messages[0].value.value0);
				console.log(resDid.decoded.out_messages[0].value.value0);
				setLoader(false);
			} catch(e) {
				console.log(e);
				alert("Error!");
				setLoader(false);
				
			}
		},20000)
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

	async function updateDidStatus() {

		if(curentStatus == undefined) {
			alert("Set status");
			return;
		}

		let tempDid = DID.split(':')[2];
		console.log(DID);

		let bal = getClientBalance(localStorage.address);

		bal.then(
			(data) => {
				if(data < 1){
					alert("Insufficient balance");
					return;
				}
			}
		);

		setLoader(true);

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

		//console.log(JSON.stringify(didDoc.didDocument));

		try {

			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidDocumentContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "newDidStatus",
					input: {
						status: Number(curentStatus),
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

		setTimeout(async function(){
			const resDid = await didAcc.runLocal("getDid", {});

			setDidDoc(resDid.decoded.out_messages[0].value.value0);
			console.log(resDid.decoded.out_messages[0].value.value0);
			setLoader(false);
		}, 20000);

	}

	async function updateDidPub() {

		if(curentPub == undefined) {
			alert("Set PubKey");
			return;
		}
		if(curentAddr == undefined) {
			alert("Set Address");
			return;
		}

		let tempDid = DID.split(':')[2];
		console.log(DID);

		console.log(curentPub, curentAddr);

		let bal = getClientBalance(localStorage.address);

		bal.then(
			(data) => {
				if(data < 1){
					alert("Insufficient balance");
					return;
				}
			}
		);

		setLoader(true);

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

		//console.log(JSON.stringify(didDoc.didDocument));

		try {

			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidDocumentContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "newDidIssuerPubKey",
					input: {
						pubKey: "0x"+curentPub,
						issuerAddr: curentAddr
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
			setLoader(false);
			return;
		}

		setTimeout(async function(){
			try{
				const resDid = await didAcc.runLocal("getDid", {});

				setDidDoc(resDid.decoded.out_messages[0].value.value0);
				console.log(resDid.decoded.out_messages[0].value.value0);
				setLoader(false);
			} catch(e) {
				console.log(e);
				alert("Error!");
				setLoader(false);
			}
		}, 20000);

	}

	async function deleteDid() {

		let tempDid = DID.split(':')[2];
		console.log(DID);

		let bal = getClientBalance(localStorage.address);

		bal.then(
			(data) => {
				if(data < 1){
					alert("Insufficient balance");
					return;
				}
			}
		);

		setLoader(true);

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

		//console.log(JSON.stringify(didDoc.didDocument));

		try {

			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidDocumentContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "deleteDidDocument",
					input: {},
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
			setLoader(false);
			return;
		}

		setTimeout(async function(){
			console.log(1);
			// const resDid = await didAcc.runLocal("getDid", {});

			// setDidDoc(resDid.decoded.out_messages[0].value.value0);
			// console.log(resDid.decoded.out_messages[0].value.value0);

			const res3 = await acc2.runLocal("resolveDidDocument", {
				id: "0x" + tempDid,
			});
	
			console.log(res3);

			try {
				const resDid = await didAcc.runLocal("getDid", {});

				setDidDoc(resDid.decoded.out_messages[0].value.value0);
				console.log(resDid.decoded.out_messages[0].value.value0);
			} catch(e) {
				backToLogin();
				setLoader(false);
				alert("Did doc delete");
			}

			setLoader(false);
		}, 20000);

	}

	function backToLogin() {

		setDidDoc("");
		setDID("");

	}


	return (
		<Router>

			<div className={alertW.hidden?"hide":"modal-w modal-welcome"}>

				<button className="close" onClick={()=>setAlertW({hidden: true, text:"", title:""})}>
					<span></span>
					<span></span>
				</button>

				<div class="text">{alertW.title}</div>

				<span class="content">
					{alertW.text}
				</span>

			</div>

			{didDoc ? (
				<div className={alertW.hidden?"modal-w modal-welcome modal-did-document":"hide"}>

					
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
						<span className={menuCurent==0?"active":""} onClick={()=>setMenuCurent(0)}>Change document</span>
						<span className={menuCurent==1?"active":""} onClick={()=>setMenuCurent(1)}>Change status</span>
						<span className={menuCurent==2?"active":""} onClick={()=>setMenuCurent(2)}>Change owner</span>
						<span className={menuCurent==3?"active":""} onClick={()=>setMenuCurent(3)}>Delete document</span>
						
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
								<select name="" id="" onChange={(ev)=>{setCurentStatus(ev.target.value)}}>
									<option>1</option>
									<option>0</option>
								</select>
							</div>
							<button onClick={updateDidStatus}>Save Changes</button>
						</div>
						<div className={menuCurent==2?"menu-item":"hide"}>
							<div>
								<input type="text" placeholder="New PubKey" onChange={(ev)=>{setCurentPub(ev.target.value)}}/>
								<input type="text" placeholder="New Address" onChange={(ev)=>{setCurentAddr(ev.target.value)}}/>
							</div>
							<button onClick={updateDidPub}>Save Changes</button>
						</div>
						<div className={menuCurent==3?"menu-item":"hide"}>
							<button onClick={deleteDid}>Delete Document</button>
						</div>
						
					</div>



					<div className="note">
						Note: Transactions can take 5 to 15 seconds
					</div>
					<button onClick={backToLogin}>Back</button>
				</div>
			) : (
				<div className={alertW.hidden?"modal-w modal-welcome":"hide"}>
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

export default WelcomeDidPage;
