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

import * as ed from "noble-ed25519";

import sha256 from "crypto-js/sha256";

//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

function LoginWPPage() {
	const [data] = useState(JSON.parse(localStorage.loginData));

	return (
		<Router>
			<div className={"modal-w modal-welcome"}>
				{/* <div className={loader ? "lds-dual-ring" : "hide"}></div> */}
				<div className="text">Welcome!</div>

				{/* <div class="text">I already have a DID</div> */}
				{/* <input type="text" placeholder="DID" value={data} className="hide" />
				<button type="button" className="btn btn-secondary">
					Log in
				</button> */}

				<form action="action.php" method="post">
					<input value={data.token} id="token" name="token" className="hide" />
					<input value={data.did} id="did" name="did" className="hide" />
					<p>
						<input type="submit" value="Log In" className="btn btn-secondary" />
					</p>
				</form>
			</div>
		</Router>
	);
}

export default LoginWPPage;
