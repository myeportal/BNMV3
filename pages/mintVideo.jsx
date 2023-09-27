import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import {
    Card,
    Input,
    Button,
    Modal,
    Image,
    Select,
    Typography,
    notification,
} from "antd";
import {
    useMoralis,
    useMoralisFile,
    useWeb3ExecuteFunction,
} from "react-moralis";
import { CHAIN, CONTRACT_ADDRESS } from "../consts/vars";
import { BLOCK_NEWS_MEDIA_CONTRACT_ABI } from "../consts/contractAbis";
import useWindowDimensions from "../util/useWindowDimensions";
import moralis from "moralis";
import axios from 'axios';

const styles = {
    title: {
        fontSize: "20px",
        fontWeight: "700",
    },
    text: {
        fontSize: "16px",
    },
    card: {
        boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
        border: "1px solid #e7eaf3",
        borderRadius: "0.5rem",
        width: "50%",
    },
    mobileCard: {
        boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
        border: "1px solid #e7eaf3",
        borderRadius: "0.5rem",
        width: "100%",
    },
    container: {
        padding: "0 2rem",
    },
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
    },
    button: {
        float: "right",
        marginTop: "10px",
    },
    text: {
        fontSize: "14px",
        alignSelf: "center",
    },
    textAuthor: {
        fontSize: "14px",
        marginLeft: "10px",
        alignSelf: "center",
    },
    inputContainer: {
        display: "flex",
        flexWrap: "wrap",
    },
    childInputContainer: {
        padding: "10px",
    },
};

moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APPLICATION_ID);
moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_SERVER_URL;

const { Option } = Select;
const { Text } = Typography;

export default function MintVideo() {

    const {
        Moralis,
        isWeb3Enabled,
        enableWeb3,
        isAuthenticated,
        isWeb3EnableLoading,
    } = useMoralis();
    const user = moralis.User.current();

    const { error, saveFile } = useMoralisFile();

    const inputImageFile = useRef(null);
    const inputVideoFile = useRef(null);
    const [selectedImageFile, setSelectedImageFile] = useState();
    const [selectedVideoFile, setSelectedVideoFile] = useState();
    const [isNftMintInProcess, setIsNftMintInProcess] = useState(false);
    const [isInputValid, setIsInputValid] = useState(false);
    const [uploadedImageFile, setUploadedImageFile] = useState(null);
    const [uploadedVideoFile, setUploadedVideoFile] = useState(null);
    const [uploadedImageUri, setUploadedImageUri] = useState(null);
    const [uploadedVideoUri, setUploadedVideoUri] = useState(null);
    const [titleText, setTitleText] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [tokenId, setTokenId] = useState(0);

    const { width } = useWindowDimensions();
    const isMobile = width < 700;

    const {
        data,
        error: executeContractError,
        fetch: executeContractFunction,
        isFetching,
        isLoading,
    } = useWeb3ExecuteFunction();

    useEffect(() => {
        if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading)
            enableWeb3();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isWeb3Enabled]);

    useEffect(() => {
        if (!isFetching && !isLoading && data) {
            setIsNftMintInProcess(false);

            Modal.success({
                title: "Congrats! Your NFT has been created!",
                content: (
                    <div>
                        <p>
                            Note: Check the Feed to see your post!
                        </p>
                        <Image
                            width={270}
                            src={uploadedImageUri}
                            preview={true}
                            placeholder={true}
                        />
                        <p>
                            <b>Title:</b> {titleText}
                        </p>
                        <p>
                            <b>Category:</b> {categoryName}
                        </p>
                    </div>
                ),
                onOk() {
                    setTitleText("");
                    setCategoryName("");
                    window.location.reload();
                },
            });
        }
    }, [isFetching, isLoading]);

    useEffect(() => {
        if (
            titleText.length !== 0 &&
            uploadedImageFile &&
            uploadedVideoFile &&
            categoryName.length !== 0
        ) {
            setIsInputValid(true);
        }
    }, [ titleText, uploadedImageFile, uploadedVideoFile, categoryName]); 

    useEffect(() => {
        if (executeContractError && executeContractError.code === 4001) {
            setIsNftMintInProcess(false);
            notification.error({
                message: "NFT Mint Error",
                description: executeContractError.message,
            });
        }
    }, [executeContractError]);

    useEffect(() => {
        const options = {
            method: 'GET',
            url: `https://deep-index.moralis.io/api/v2/nft/${CONTRACT_ADDRESS}`,
            params: {chain: CHAIN, format: 'decimal'},
            headers: {accept: 'application/json', 'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY}
          };
          
          axios
            .request(options)
            .then(function (response) {
                // console.log(response.data.total);
                setTokenId(response.data.total + 1);
            })
            .catch(function (error) {
              console.error(error);
            },
        );
    }, []);

    async function checkTokenIdExists() {
        const Posts = Moralis.Object.extend("Posts");
        const query = new Moralis.Query(Posts);
        query.equalTo("tokenId", tokenId);
        const results = await query.find();
        if (results.length > 0) {
            setTokenId(tokenId + 1);
        }
    }

    const uploadNftToIpfsAndMintToken = async () => {
            if(!isInputValid) {
                window.alert("Not all fields filled in! Please fill in all fields and then re-submit.")
                setIsNftMintInProcess(false);
                return
            }

            if (isAuthenticated) {
                notification.info({
                    message: "Minting in progress",
                    description: "Your minting is in progress. Could take up to 1-2 mins. PLEASE DON'T REFRESH PAGE!",
                }
            );

            let img;
            if (uploadedImageFile) {
                const data = uploadedImageFile;
                const file = new Moralis.File(data.name, data);
                await file.saveIPFS();
                img = file.ipfs();
            } else {
                img = "No Img"
            }

            if (error) {
                console.error("Error uploading NFT Image to IPFS");
            }

            let vid;
            if (uploadedVideoFile) {
                const data = uploadedVideoFile;
                const file = new Moralis.File(data.name, data);
                await file.saveIPFS();
                vid = file.ipfs();
            } else {
                vid = "No Video"
            }

            if (error) {
                console.error("Error uploading NFT Video to IPFS");
            }

            const nftMetadataObj = {
                name: titleText,
                image: img,
                video: vid,
                attributes: [
                    { category: categoryName },
                ],
            };

            const nftMetadata = await saveFile(
                `${titleText.replace(/\s/g, "")}.json`,
                { base64: btoa(JSON.stringify(nftMetadataObj)) },
                {
                    type: "application/json",
                    saveIPFS: true,
                }
            );

            await checkTokenIdExists();

            async function saveVideo() {

                if(!vid) return;
        
                const Posts = moralis.Object.extend("Posts");
                const newPost = new Posts();
                       
                newPost.set("postImg", img);
                newPost.set("postVideo", vid);
                newPost.set("postTitle", titleText);
                newPost.set("postCategory", categoryName);
                newPost.set("tokenId", tokenId);
                newPost.set("postPfp", user?.attributes.pfp);
                newPost.set("postAcc", user?.attributes.ethAddress);
                newPost.set("postUsername", user?.attributes.username);
        
                await newPost.save();
            }

            setUploadedImageUri(img)
            setUploadedVideoUri(vid);

            executeContractFunction({
                params: {
                    abi: BLOCK_NEWS_MEDIA_CONTRACT_ABI,
                    contractAddress: CONTRACT_ADDRESS,
                    functionName: "createItem",
                    params: {
                        uriOfToken: nftMetadata._ipfs,
                    },
                    msgValue: Moralis.Units.ETH(1), 
                },
                onSuccess: () => {
                    saveVideo();
                },
                onError: (error) => {
                console.log("ERROR")
                }
            });
        } else {
            setIsNftMintInProcess(false);
            notification.error({
                message: "You need to have your wallet connected to Mint NFTs",
                description:
                    "In order to use this feature, you have to connect your wallet to this website.",
            });
        }
    };
   
    if(error) {
        notification.error({
            message: "Error",
            description: "Please try re-uploading."
        })
    }

    return (
        <div style={styles.container}>
            <Head>
                <title>Block News Media - Mint</title>
                <meta name="description" content="Block News Media - Mint" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main style={styles.main}>
                <Card
                    style={!isMobile ? styles.card : styles.mobileCard}
                    title={"Mint your Video as NFV"}
                    loading={isNftMintInProcess}
                >
                    <Text style={styles.text}>
                        Upload the Image that will represent your NFV <b>(JPEG and PNG Files ONLY, max file size: 1Gb)</b>
                    </Text>
                    <br />
                    <br />
                    <div>
                        <input
                            type="file"
                            name="file"
                            multiple={false}
                            accept="image/jpeg, image/png"
                            ref={inputImageFile}
                            onChange={(e) => (
                                setUploadedImageFile(e.target.files[0]),
                                setSelectedImageFile(URL.createObjectURL(e.target.files[0]))
                            )}
                        />
                    </div> 
                    <br />
                    <Text style={styles.text}>
                        Upload the Video that will represent your NFV <b>(MP4 Files ONLY, max file size: 1Gb)</b>
                    </Text>
                    <br />
                    <br />
                    <div>
                        <input
                            type="file"
                            name="file"
                            multiple={false}
                            accept="video/mp4"
                            ref={inputVideoFile}
                            onChange={(e) => {
                                setUploadedVideoFile(e.target.files[0]),
                                setSelectedVideoFile(URL.createObjectURL(e.target.files[0]))
                            }}
                        />
                    </div>
                    <br />  
                    <Text style={styles.text}>
                        Video Headline (NFV Title)
                    </Text>
                    <Input
                        placeholder="Video Headline"
                        onChange={(e) => setTitleText(e.target.value)}
                        value={titleText}
                    />
                    <br />
                    <br />
                    <div style={styles.inputContainer}>
                        <div style={styles.childInputContainer}>
                            <Text style={styles.text}>Category</Text>
                            <Select
                                style={{ width: 155, marginLeft: "10px" }}
                                onChange={(e) => {
                                    setCategoryName(e);
                                }}
                            >
                                <Option value="Business">Business</Option>
                                <Option value="Technology">Technology</Option>
                                <Option value="Science">Science</Option>
                                <Option value="Politics">Politics</Option>
                                <Option value="Local Community">
                                    Local Community
                                </Option>
                                <Option value="Weather">Weather</Option>
                                <Option value="Sports">Sports</Option>
                                <Option value="Opinion">Opinion</Option>
                            </Select>
                        </div>
                    </div>
                    <Button
                        style={styles.button}
                        type="primary"
                        loading={isNftMintInProcess}
                        onClick={async () => {
                            setIsNftMintInProcess(true);
                            await uploadNftToIpfsAndMintToken();
                        }}
                    >
                        Create NFT
                    </Button>
                </Card>
            </main>
        </div>
    );
}