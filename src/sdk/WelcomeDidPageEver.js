import React, {useState} from "react";
import {HashRouter as Router, Link, Redirect} from "react-router-dom";
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

import * as ed from "noble-ed25519";

import sha256 from "crypto-js/sha256";

//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

// let dexrootAddr =
// 	"0:49709b1fa8adc2768c4c90f1c6fef0bdb01dc959a8052b3ed072de9dfd080424";

// let dexrootAddr =
// 	"0:c9e74798ee45b2e57661162dedeb81e8d015402f56c597747120e0de295f7441";

// let dexrootAddr = "0:bf598f890ca98e1d86957f28911fea31d5ce8f4551913ecc64da453a4144bef0";

let dexrootAddr =
	"0:ee63d43c1f5ea924d3d47c5a264ad2661b5a4193963915d89f3116315350d7d3";

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

	const attributes = [
		"id",
		"@context",
		"controller",
		"alsoKnownAs",
		"verificationMethod",
		"authentication",
		"assertionMethod",
		"keyAgreement",
		"capabilityInvocation",
		"capabilityDelegation",
		"service",
	];

	const [curentAttr, setCurentAttr] = useState();

	const [redirect, setRedirect] = useState(false);

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
		console.log("initInpageProvider...");

		const provider = await import("ton-inpage-provider");
		if (!(await provider.hasTonProvider())) {
			throw new Error("Extension is not installed");
		}

		await ton.ensureInitialized();

		const {accountInteraction} = await ton.rawApi.requestPermissions({
			permissions: ["tonClient", "accountInteraction"],
		});

		console.log(accountInteraction);

		if (accountInteraction == null) {
			throw new Error("Insufficient permissions");
		}

		try {
			const newDIDDoc = {
				id: "did:everscale:" + accountInteraction.publicKey.toString(),
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

			const response = await ton.rawApi.sendMessage({
				sender: accountInteraction.address,
				recipient: dexrootAddr,
				amount: "500000000",
				bounce: true,
				payload: {
					abi: JSON.stringify(DidStorageContract.abi),
					method: "addDid",
					params: {
						pubKey: "0x" + accountInteraction.publicKey,
						didDocument: JSON.stringify(newDIDDoc),
						addr: accountInteraction.address,
					},
				},
			});
			console.log("response");
			console.log(response);
		} catch (e) {
			console.log(e);
		}

		setTimeout(async function () {
			const {output} = await ton.rawApi.runLocal({
				address: dexrootAddr,
				functionCall: {
					abi: JSON.stringify(DidStorageContract.abi),
					method: "resolveDidDocument",
					params: {
						id: "0x" + accountInteraction.publicKey,
					},
				},
			});
			console.log("output");
			const addrDidDoc = output.addrDidDocument;
			console.log(output, addrDidDoc);

			const outputs = await ton.rawApi.runLocal({
				address: addrDidDoc,
				functionCall: {
					abi: JSON.stringify(DidDocumentContract.abi),
					method: "getDid",
					params: {},
				},
			});

			console.log(outputs);

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
		}, 1000);

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
		let tempDid = DID.split(":")[2];

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
		Object.keys(JSON.parse(didDoc.didDocument)).map((item) => {
			if (item == curentAttr) {
				alert("This attribute already exist!");
				return;
			}
		});
		let tempDidDoc = {};
		console.log(didDoc);
		for (let key in didDoc) {
			let temp = didDoc[key];
			if (key == "didDocument") {
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

		let tempDidDoc = {};
		console.log(didDoc);
		for (let key in didDoc) {
			let temp = didDoc[key];
			if (key == "didDocument") {
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

	function saveAttribute(item, value) {
		let tempDidDoc = {};
		console.log(didDoc);
		for (let key in didDoc) {
			let temp = didDoc[key];
			if (key == "didDocument") {
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

	async function testreq() {
		let tempDid = DID.split(":")[2];
		console.log(DID);

		console.log("initInpageProvider...");

		const provider = await import("ton-inpage-provider");
		if (!(await provider.hasTonProvider())) {
			throw new Error("Extension is not installed");
		}

		await ton.ensureInitialized();

		const {accountInteraction} = await ton.rawApi.requestPermissions({
			permissions: ["tonClient", "accountInteraction"],
		});

		console.log(accountInteraction);

		if (accountInteraction == null) {
			throw new Error("Insufficient permissions");
		}

		function sendSign(data) {
			fetch("https://ssi.defispace.com/auth/login", {
				method: "post",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					Connection: "keep-alive",
				},

				body: `{
					"user":
					{
						"signatureHex":"${data}",
						"did": "${tempDid}"
				}
				}`,
			})
				.then((data) => {
					return data.json();
				})
				.then((data) => {
					testSign(data.user.token);
				});
		}

		function testSign(data) {
			fetch("https://ssi.defispace.com/auth/user", {
				method: "get",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					Connection: "keep-alive",
					Authorization: `Token ${data}`,
				},
			})
				.then((data) => {
					return data.json();
				})
				.then(
					(data) => {
						console.log(data);
						if (data.user.token == undefined) {
							alert("Error Log In");
							return;
						} else {
							localStorage.setItem(
								"loginData",
								JSON.stringify({token: data.user.token, did: tempDid}),
							);
							console.log(data.token);
							setRedirect(true);
						}
					},
					(error) => {
						console.log(error);
					},
				);
		}

		fetch("https://ssi.defispace.com/auth", {
			method: "post",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Connection: "keep-alive",
			},

			body: `{"user":{"did": "${tempDid}"}}`,
		})
			.then((response) => {
				return response.json();
			})
			.then(async function (data) {
				// data is the parsed version of the JSON returned from the above endpoint.
				let msg = data.value;
				console.log(msg);
				//const msgHash = crypto.createHash('sha256').update(msg).digest('hex');
				//const msgHash = sha256(msg).toString(16);

				const msgHash = window.btoa(msg);
				console.log(msgHash);

				//let privatemsg = (await getClientKeys(seed)).secret;

				let signData = await ton.rawApi.signData({
					data: msgHash,
					publicKey: accountInteraction.publicKey,
				});

				console.log(signData);

				return signData.signatureHex;
			})
			.then((data) => {
				sendSign(data);
				console.log(data);
			});
	}

	return (
		<Router>
			<div className="modal-w modal-welcome">
				<div className={loader ? "lds-dual-ring" : "hide"}></div>
				<div className="text">Welcome!</div>

				{/* <button type="button" className="btn btn-secondary" onClick={DidCreate}>
					I want to create DID
				</button>
				<button type="button" className="btn btn-secondary" onClick={createDID}>
					I want to create DID2
				</button> */}
				{/* <button
						type="button"
						className="btn btn-secondary"
						onClick={createDID3}
					>
						I want to create DID
					</button> */}

				<div class="text">I already have a DID</div>
				<input
					type="text"
					placeholder="DID"
					onChange={(ev) => {
						setDID(ev.target.value);
					}}
				/>
				<button type="button" className="btn btn-secondary" onClick={testreq}>
					Log in with DID
				</button>
				{redirect ? <Redirect to="/login-wp" /> : null}
			</div>
			)
		</Router>
	);
}

export default WelcomeDidPageEver;
