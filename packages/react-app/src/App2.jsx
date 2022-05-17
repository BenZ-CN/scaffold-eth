import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import ReactJson from "react-json-view";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
    useBalance,
    useContractLoader,
    useContractReader,
    useGasPrice,
    useOnBlock,
    useUserProviderAndSigner,
} from "eth-hooks";
import {
    useEventListener,
} from "eth-hooks/events/useEventListener";
import {
    useExchangeEthPrice,
} from "eth-hooks/dapps/dex";
// import Hints from "./Hints";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });


import { useContractConfig } from "./hooks"
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";

const { ethers } = require("ethers");

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// EXAMPLE STARTING JSON:
const STARTING_JSON = {
    description: "It's actually a bison?",
    external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://austingriffith.com/images/paintings/buffalo.jpg",
    name: "Buffalo",
    attributes: [
        {
            trait_type: "BackgroundColor",
            value: "green",
        },
        {
            trait_type: "Eyes",
            value: "googly",
        },
    ],
};

// helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
    for await (const file of ipfs.get(hashToGet)) {
        console.log(file.path);
        if (!file.content) continue;
        const content = new BufferList();
        for await (const chunk of file.content) {
            content.append(chunk);
        }
        console.log(content);
        return content;
    }
};

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
    ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
    : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
    appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
    network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
    cacheProvider: true, // optional
    theme: "light", // optional. Change to "dark" for a dark theme.
    providerOptions: {
        walletconnect: {
            package: WalletConnectProvider, // required
            options: {
                bridge: "https://polygon.bridge.walletconnect.org",
                infuraId: INFURA_ID,
                rpc: {
                    1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
                    42: `https://kovan.infura.io/v3/${INFURA_ID}`,
                    100: "https://dai.poa.network", // xDai
                },
            },

        },
        portis: {
            display: {
                logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
                name: "Portis",
                description: "Connect to Portis App",
            },
            package: Portis,
            options: {
                id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
            },
        },
        fortmatic: {
            package: Fortmatic, // required
            options: {
                key: "pk_live_5A7C91B2FC585A17", // required
            },
        },
        // torus: {
        //   package: Torus,
        //   options: {
        //     networkParams: {
        //       host: "https://localhost:8545", // optional
        //       chainId: 1337, // optional
        //       networkId: 1337 // optional
        //     },
        //     config: {
        //       buildEnv: "development" // optional
        //     },
        //   },
        // },
        "custom-walletlink": {
            display: {
                logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
                name: "Coinbase",
                description: "Connect to Coinbase Wallet (not Coinbase App)",
            },
            package: walletLinkProvider,
            connector: async (provider, _options) => {
                await provider.enable();
                return provider;
            },
        },
        authereum: {
            package: Authereum, // required
        },
    },
});

function App(props) {

    const [injectedProvider, setInjectedProvider] = useState();
    const [address, setAddress] = useState();

    const logoutOfWeb3Modal = async () => {
        await web3Modal.clearCachedProvider();
        if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
            await injectedProvider.provider.disconnect();
        }
        setTimeout(() => {
            window.location.reload();
        }, 1);
    };
    /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
    const gasPrice = useGasPrice(targetNetwork, "fast");
    // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
    const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
    const userSigner = userProviderAndSigner.signer;

    useEffect(() => {
        async function getAddress() {
            if (userSigner) {
                const newAddress = await userSigner.getAddress();
                setAddress(newAddress);
            }
        }
        getAddress();
    }, [userSigner]);

    // You can warn the user if you would like them to be on a specific network
    const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
    const selectedChainId =
        userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

    // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

    // The transactor wraps transactions and provides notificiations
    const tx = Transactor(userSigner, gasPrice);

    // Faucet Tx can be used to send funds from the faucet
    const faucetTx = Transactor(localProvider, gasPrice);

    // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
    const yourLocalBalance = useBalance(localProvider, address);
    console.info("yourLocalBalance", yourLocalBalance)


    const contractConfig = useContractConfig();
    console.info("contractConfig", contractConfig)

    // Load in your local 📝 contract and read a value from it:
    const readContracts = useContractLoader(localProvider, contractConfig);
    console.info("readContracts", readContracts)

    // If you want to make 🔐 write transactions to your contracts, use the userSigner:
    const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);
    console.info("writeContracts", writeContracts)

    var mainnetProvider = null;
    var mainnetContracts = null;
    var yourMainnetBalance = 0;
    var price = 0;


    // keep track of a variable from the contract in the local React state:
    console.log("useContractReader:", readContracts, address);
    const balance = useContractReader(readContracts, "YourCollectible", "balanceOf", [address]);
    console.log("🤗 YourCollectible balance:", balance);

    // 📟 Listen for broadcast events
    const transferEvents = useEventListener(readContracts, "YourCollectible", "Transfer", localProvider, 1);
    console.log("📟 Transfer events:", transferEvents);

    //
    // 🧠 This effect will update yourCollectibles by polling when your balance changes
    //
    const yourBalance = balance && balance.toNumber && balance.toNumber();
    const [yourCollectibles, setYourCollectibles] = useState();
    console.log("yourCollectibles:", yourCollectibles);

    useEffect(() => {
        const updateYourCollectibles = async () => {
            const collectibleUpdate = [];
            console.log("📟 updateYourCollectibles balance", balance);
            for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
                try {
                    console.log("GEtting token index", tokenIndex);
                    const tokenId = await readContracts.YourCollectible.tokenOfOwnerByIndex(address, tokenIndex);
                    console.log("tokenId", tokenId);
                    const tokenURI = await readContracts.YourCollectible.tokenURI(tokenId);
                    console.log("tokenURI", tokenURI);

                    const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
                    console.log("ipfsHash", ipfsHash);

                    const jsonManifestBuffer = await getFromIPFS(ipfsHash);

                    try {
                        const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
                        console.log("jsonManifest", jsonManifest);
                        collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
                    } catch (e) {
                        console.log(e);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            setYourCollectibles(collectibleUpdate);
        };
        updateYourCollectibles();
        console.log("📟 updateYourCollectibles");
    }, [address, yourBalance]);


    //
    // 🧫 DEBUG 👨🏻‍🔬
    //
    useEffect(() => {
        if (
            DEBUG &&
            mainnetProvider &&
            address &&
            selectedChainId &&
            yourLocalBalance &&
            yourMainnetBalance &&
            readContracts &&
            writeContracts &&
            mainnetContracts
        ) {
            console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
            console.log("🌎 mainnetProvider", mainnetProvider);
            console.log("🏠 localChainId", localChainId);
            console.log("👩‍💼 selected address:", address);
            console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
            console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
            console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
            console.log("📝 readContracts", readContracts);
            console.log("🌍 DAI contract on mainnet:", mainnetContracts);
            console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
            console.log("🔐 writeContracts", writeContracts);
        }
    }, [
        mainnetProvider,
        address,
        selectedChainId,
        yourLocalBalance,
        yourMainnetBalance,
        readContracts,
        writeContracts,
        mainnetContracts,
    ]);

    let networkDisplay = "";
    if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
        const networkSelected = NETWORK(selectedChainId);
        const networkLocal = NETWORK(localChainId);
        if (selectedChainId === 1337 && localChainId === 31337) {
            networkDisplay = (
                <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
                    <Alert
                        message="⚠️ Wrong Network ID"
                        description={
                            <div>
                                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                                HardHat.
                                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
                            </div>
                        }
                        type="error"
                        closable={false}
                    />
                </div>
            );
        } else {
            networkDisplay = (
                <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
                    <Alert
                        message="⚠️ Wrong Network"
                        description={
                            <div>
                                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                                <Button
                                    onClick={async () => {
                                        const ethereum = window.ethereum;
                                        const data = [
                                            {
                                                chainId: "0x" + targetNetwork.chainId.toString(16),
                                                chainName: targetNetwork.name,
                                                nativeCurrency: targetNetwork.nativeCurrency,
                                                rpcUrls: [targetNetwork.rpcUrl],
                                                blockExplorerUrls: [targetNetwork.blockExplorer],
                                            },
                                        ];
                                        console.log("data", data);

                                        let switchTx;
                                        // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                                        try {
                                            switchTx = await ethereum.request({
                                                method: "wallet_switchEthereumChain",
                                                params: [{ chainId: data[0].chainId }],
                                            });
                                        } catch (switchError) {
                                            // not checking specific error code, because maybe we're not using MetaMask
                                            try {
                                                switchTx = await ethereum.request({
                                                    method: "wallet_addEthereumChain",
                                                    params: data,
                                                });
                                            } catch (addError) {
                                                // handle "add" error
                                            }
                                        }

                                        if (switchTx) {
                                            console.log(switchTx);
                                        }
                                    }}
                                >
                                    <b>{networkLocal && networkLocal.name}</b>
                                </Button>
                            </div>
                        }
                        type="error"
                        closable={false}
                    />
                </div>
            );
        }
    } else {
        networkDisplay = (
            <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
                {targetNetwork.name}
            </div>
        );
    }



    const loadWeb3Modal = useCallback(async () => {
        const provider = await web3Modal.connect();
        setInjectedProvider(new ethers.providers.Web3Provider(provider));

        provider.on("chainChanged", chainId => {
            console.log(`chain changed to ${chainId}! updating providers`);
            setInjectedProvider(new ethers.providers.Web3Provider(provider));
        });

        provider.on("accountsChanged", () => {
            console.log(`account changed!`);
            setInjectedProvider(new ethers.providers.Web3Provider(provider));
        });

        // Subscribe to session disconnection
        provider.on("disconnect", (code, reason) => {
            console.log(code, reason);
            logoutOfWeb3Modal();
        });
    }, [setInjectedProvider]);

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            loadWeb3Modal();
        }
    }, [loadWeb3Modal]);

    const [route, setRoute] = useState();
    useEffect(() => {
        setRoute(window.location.pathname);
    }, [setRoute]);

    let faucetHint = "";
    const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

    const [faucetClicked, setFaucetClicked] = useState(false);
    if (
        !faucetClicked &&
        localProvider &&
        localProvider._network &&
        localProvider._network.chainId == 31337 &&
        yourLocalBalance &&
        ethers.utils.formatEther(yourLocalBalance) <= 0
    ) {
        faucetHint = (
            <div style={{ padding: 16 }}>
                <Button
                    type="primary"
                    onClick={() => {
                        faucetTx({
                            to: address,
                            value: ethers.utils.parseEther("0.01"),
                        });
                        setFaucetClicked(true);
                    }}
                >
                    💰 Grab funds from the faucet ⛽️
                </Button>
            </div>
        );
    }

    const [yourJSON, setYourJSON] = useState(STARTING_JSON);
    const [sending, setSending] = useState();
    const [ipfsHash, setIpfsHash] = useState();
    const [ipfsDownHash, setIpfsDownHash] = useState();

    const [downloading, setDownloading] = useState();
    const [ipfsContent, setIpfsContent] = useState();

    const [transferToAddresses, setTransferToAddresses] = useState({});

    return (
        <div className="App">
            {/* ✏️ Edit the header and change the title to your project name */}
            <Header />
            {networkDisplay}
            <BrowserRouter>
                <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
                    <Menu.Item key="/">
                        <Link
                            onClick={() => {
                                setRoute("/");
                            }}
                            to="/"
                        >
                            YourCollectibles
                        </Link>
                    </Menu.Item>
                </Menu>

                <Switch>
                    <Route exact path="/">
                        {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}
                        <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
                            <List
                                bordered
                                dataSource={yourCollectibles}
                                renderItem={item => {
                                    const id = item.id.toNumber();
                                    return (
                                        <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                                            <Card
                                                title={
                                                    <div>
                                                        <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name}
                                                    </div>
                                                }
                                            >
                                                <div>
                                                    <img src={item.image} style={{ maxWidth: 150 }} />
                                                </div>
                                                <div>{item.description}</div>
                                            </Card>

                                            <div>
                                                owner:{" "}
                                                <Address
                                                    address={item.owner}
                                                    ensProvider={mainnetProvider}
                                                    blockExplorer={blockExplorer}
                                                    fontSize={16}
                                                />
                                                <AddressInput
                                                    ensProvider={mainnetProvider}
                                                    placeholder="transfer to address"
                                                    value={transferToAddresses[id]}
                                                    onChange={newValue => {
                                                        const update = {};
                                                        update[id] = newValue;
                                                        setTransferToAddresses({ ...transferToAddresses, ...update });
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => {
                                                        console.log("writeContracts", writeContracts);
                                                        tx(writeContracts.YourCollectible.transferFrom(address, transferToAddresses[id], id));
                                                    }}
                                                >
                                                    Transfer
                                                </Button>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        </div>
                    </Route>
                </Switch>
            </BrowserRouter>

            <ThemeSwitch />

            {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
            <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
                <Account
                    address={address}
                    localProvider={localProvider}
                    userSigner={userSigner}
                    mainnetProvider={mainnetProvider}
                    price={price}
                    web3Modal={web3Modal}
                    loadWeb3Modal={loadWeb3Modal}
                    logoutOfWeb3Modal={logoutOfWeb3Modal}
                    blockExplorer={blockExplorer}
                />
                {faucetHint}
            </div>
        </div>
    );
}

export default App;
