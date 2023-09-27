import React, { useState, useRef, useEffect } from 'react';
import { Input } from "web3uikit";
import { defaultImgs } from "../public/defaultImgs";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import { CHAIN } from '../consts/vars';

const appId = process.env.NEXT_PUBLIC_MORALIS_APPLICATION_ID;
const serverUrl = process.env.NEXT_PUBLIC_MORALIS_SERVER_URL;
const moralisSecert = process.env.NEXT_PUBLIC_MORALIS_SECERT;

const Settings = () => {

    const [pfps, setPfps] = useState([]);
    const [selectedPFP, setSelectedPFP] = useState();
    const inputFile = useRef(null);
    const [selectedFile, setSelectedFile] = useState(defaultImgs[1]);
    const [theFile, setTheFile] = useState();
    const [username, setUsername] = useState();
    const [bio, setBio] = useState();
    const { Moralis, isAuthenticated, account } = useMoralis();
    const Web3Api = useMoralisWeb3Api();

    const resolveLink = (url) => {
        if (!url || !url.includes("ipfs://")) return url;
        return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
    };

    useEffect(() => {

        const fetchNFTs = async () => {
            const options = {
                chain: CHAIN,
                address: account
            }
            await Moralis.start({ serverUrl, appId, moralisSecert });
            const NFTs = await Web3Api.account.getNFTs(options);
            // console.log(NFTs)
            const images = NFTs.result.map(
                (e) => resolveLink(JSON.parse(e.metadata)?.image)
            )
            // console.log(images)
            setPfps(images);
        }
        fetchNFTs();
    }, [isAuthenticated, account])

    const onBannerClick = () => {
        inputFile.current.click();
    };

    const changeHandler = (event) => {
        const img = event.target.files[0];
        setTheFile(img);
        setSelectedFile(URL.createObjectURL(img));
    };

    const saveEdits = async () => {
        const User = Moralis.Object.extend("_User");
        const query = new Moralis.Query(User);
        const myDetails = await query.first();

        if (bio) {
            myDetails.set("bio", bio);
        }

        if (selectedPFP){
            myDetails.set("pfp", selectedPFP);
        }
    
        if (username){
        myDetails.set("username", username);
        }
    
        if (theFile) {
        const data = theFile;
        const file = new Moralis.File(data.name, data);
        await file.saveIPFS();
        myDetails.set("banner", file.ipfs());
        }
    
        await myDetails.save();
        window.location.reload();
    }

    return (
        <>
        <div className="page">
            <div className="mainWindow">
                <div className="settingsPage">
                    <Input
                    label="Name"
                    name="NameChange"
                    width="100%"
                    labelBgColor="#E0E5E6"
                      onChange={(e)=> setUsername(e.target.value)}
                    />

                    <Input
                    label="Bio"
                    name="bioChange"
                    width="100%"
                    labelBgColor="#E0E5E6"
                      onChange={(e)=> setBio(e.target.value)}
                    />

                    <div className="pfp">
                        Profile Image (Your NFTs, click below to select PFP)

                        <div className="pfpOptions">
                            {pfps.map((e,i) => {
                                return(
                                    <>
                                    <img
                                    src={e}
                                    className={
                                        selectedPFP === e ? "pfpOptionSelected" : "pfpOption"
                                    }
                                    onClick={() => {setSelectedPFP(pfps[i])}}
                                    ></img>
                                    </>
                                )
                            })}
                        </div>
                        &nbsp;
                        <div className="pfp">
                            Profile Banner (Click below to select banner photo)
                            <div className="pfpOptions">
                                <img
                                src={selectedFile}
                                onClick={onBannerClick}
                                className="banner"
                                ></img>
                                <input
                                type="file"
                                name="file"
                                ref={inputFile}
                                onChange={changeHandler}
                                style={{ display: "none" }}
                                />
                            </div>
                        </div>
                        &nbsp;
                        <div className="save" onClick={() => saveEdits()}>
                            Save
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
        
        </>
    )
}

export default Settings
