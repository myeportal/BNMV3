import React, {useState, useEffect} from 'react';
import { defaultImgs } from "../public/defaultImgs";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import moralis from "moralis";
import { CONTRACT_ADDRESS, STORAGE_ADDRESS } from "../consts/vars";
import { BLOCK_NEWS_MEDIA_CONTRACT_ABI,STORAGE_CONTRACT_ABI, BASE_FRACTION_TOKEN_CONTRACT_ABI } from '../consts/contractAbis';
import { Button, notification, Modal, Form, Input, InputNumber, Card } from 'antd';

const PostInProfile = ({profile}) => {
  const { Moralis } = useMoralis();
  const [postArr, setPostArr] = useState([]);
  const [fracArr, setFracArr] = useState([]);
  const [pfp, setPfp] = useState();
  const [username, setUsername] = useState();
  const [isNftFracInProgress, setIsNftFracInProgress] = useState(false);
  const [isNftFracWithdrawInProgress, setIsNftFracWithdrawInProgress] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState();
  const user = moralis.User.current();

  const showModal = (tokenId) => {
    console.log(tokenId);
    setSelectedTokenId(tokenId);
    setOpen(true);
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setOpen(false);
  };

  const onFinish = async (values) => {
    console.log(values)
    await approveAndDepositAndFractionalizeNft(selectedTokenId, values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const {
    error: executeContractError,
    fetch: executeContractFunction,
  } = useWeb3ExecuteFunction();
  
  useEffect(() => {
    if(!user) return null;
    setPfp(user.get("pfp"))
    setUsername(user.get("username"))
  }, [user]);

  useEffect(() => {
    async function getPostInfo() {
      try {
        const Posts = Moralis.Object.extend("Posts");
        const query = new Moralis.Query(Posts)
        const account = user.attributes.accounts[0];

        if (profile) {
          query.equalTo("postAcc", account);
        }
        const results = await query.find();
        // console.log(results)
        setPostArr(results);
      } catch (error) {
        console.error(error);
      }
    }
    getPostInfo();
    
  }, []);

  useEffect(() => {
    async function getNftFracInfo() {
      try {
        const Fractionalization = Moralis.Object.extend("Fractionalization");
        const query = new Moralis.Query(Fractionalization)
        const account = user.attributes.accounts[0];

        if (profile) {
          query.equalTo("owner", account);
        }
        const results = await query.find();
        // console.log(results)
        setFracArr(results);
      } catch (error) {
        console.error(error);
      }
    }
    getNftFracInfo();
  }, []);

  useEffect(() => {
    async function isNftFrac() {
      try {
        for (let i = 0; i < postArr.length; i++) {
          let isFrac = false;
          for (let j = 0; j < fracArr.length; j++) {
            if (postArr[i]?.attributes.tokenId === fracArr[j]?.attributes.tokenId) {
              isFrac = true;
            }
          }
          postArr[i].set("isFrac", isFrac);
        }
      } catch (error) {
        console.error(error);
      }
    }
    isNftFrac();
  }, [postArr, fracArr]);
  
  const addTokenToMetamask = async (values, tokenAddress) => {
    setIsNftFracInProgress(false);

    Modal.success({
      title: "Congrats! Your NFT has fractionalized!",
      content: (
        <div>
          <p>
            <b>Token Address:</b> {tokenAddress}
          </p>
          <p>
            Click OK below to import to your Metamask wallet.
          </p>
        </div>
      ),
    onOk() {
      window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: values.tokenTicker,
            decimals: 18,
          },
        },
      });
      window.location.reload();
    },
    });
  };

  const approveAndDepositAndFractionalizeNft = async (tokenId, values) => {
    console.log("approving NFT deposit");

    notification.info({
      message: "Approving NFT deposit",
      description: "Please confirm the transaction in your wallet",
    });

    executeContractFunction({
      params: {
        abi: BLOCK_NEWS_MEDIA_CONTRACT_ABI,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "approve",
        params: {
          to: STORAGE_ADDRESS,
          tokenId: tokenId,
        },
      },
      onSuccess: (result) => {
        console.log(result);
        console.log("NFT approved");
        depositNft(tokenId, values);
      },
      onError: (error) => {
        console.log(error);
      }
    });

    const depositNft = async (tokenId, values) => {
      console.log("depositing nft");
  
      notification.info({
        message: "Depositing NFT",
        description: "Please confirm the transaction in your wallet",
      });
  
      executeContractFunction({
        params: {
          abi: STORAGE_CONTRACT_ABI,
          contractAddress: STORAGE_ADDRESS,
          functionName: "depositNft",
          params: {
            _nftAddress: CONTRACT_ADDRESS,
            _nftId: tokenId,
          },
          msgValue: Moralis.Units.ETH(0.1),
        },
        onSuccess: (result) => {
          console.log(result);
          fractionalizeNft(tokenId, values);
        },
        onError: (error) => {
          console.log(error);
        }
      });
    };

    const fractionalizeNft = async (tokenId, values) => {
      console.log("fractionalizing nft");
      
      notification.info({
        message: "Fractionalizing NFT",
        description: "Please confirm the transaction in your wallet",
      });
  
      executeContractFunction({
        params: {
          abi: STORAGE_CONTRACT_ABI,
          contractAddress: STORAGE_ADDRESS,
          functionName: "createFraction",
          params: {
            _nftAddress: CONTRACT_ADDRESS,
            _nftId: tokenId,
            _tokenName: values.tokenName,
            _tokenTicker: values.tokenTicker,
            _supply: Moralis.Units.ETH(values.supply),
          },
        },
        onSuccess: (result) => {
          console.log(result)
          console.log("success");
          const tokenAddress = result?.events[0].address;
          saveFractionalization(tokenId, tokenAddress, values);
          addTokenToMetamask(values, tokenAddress);
          setOpen(false);
        },
        onError: (error) => {
          console.log(error);
        }
      })
    };

    async function saveFractionalization(tokenId, tokenAddress, values) {
      const Fractionalization = Moralis.Object.extend("Fractionalization");
      const fractionalization = new Fractionalization();

      fractionalization.set("tokenId", tokenId);
      fractionalization.set("tokenAddress", tokenAddress);
      fractionalization.set("tokenName", values.tokenName);
      fractionalization.set("tokenTicker", values.tokenTicker);
      fractionalization.set("supply", values.supply);
      fractionalization.set("owner", user.attributes.accounts[0]);

      try {
        const result = await fractionalization.save();
        console.log(result);
      }
      catch (error) {
        console.log(error);
      }
    }
  };

  const burnTokens = async (tokenId) => {
    console.log("burning tokens");
    const query = new Moralis.Query("Fractionalization");
    query.equalTo("tokenId", tokenId);
    query.limit(1);
    const result = await query.find();
    const tokenAddress = result[0].get("tokenAddress");
    const amount = result[0].get("supply");
  
    executeContractFunction({
      params: {
        abi: BASE_FRACTION_TOKEN_CONTRACT_ABI,
        contractAddress: tokenAddress,
        functionName: "burn",
        params: {
          _amount: Moralis.Units.ETH(amount),
        },
      },
      onSuccess: () => {
        withdrawNft(tokenId);
      },
      onError: (error) => {
        console.log(error);
        window.alert("User does not own all tokens. Can't withdraw NFT.");
      }
    });
  };

  const withdrawNft = async (tokenId) => {
    console.log("withdrawing nft");

    notification.info({
      message: "Withdrawing NFT",
      description: "Please confirm the transaction in your wallet",
    });

    executeContractFunction({
      params: {
        abi: STORAGE_CONTRACT_ABI,
        contractAddress: STORAGE_ADDRESS,
        functionName: "withdrawNft",
        params: {
          _nftAddress: CONTRACT_ADDRESS,
          _nftId: tokenId,
        },
      },
      onSuccess: () => {
        console.log("success");
        removeNft(tokenId);
      },
      onError: (error) => {
        console.log(error);
      }
    });
  };

  const removeNft = async (tokenId) => {
    console.log("removing nft");
    const query = new Moralis.Query("Fractionalization");
    query.equalTo("tokenId", tokenId);
    query.limit(1);
    const result = await query.find();
    if(result) {
      const object = result[0];
      object.destroy().then((response) => {
        console.log(response);
        window.location.reload();
      }
      ).catch((error) => {
        console.log(error);
      }
      );
    }
  };

  useEffect(() => {
    if (executeContractError && executeContractError.code === 4001) {
      setIsNftFracInProgress(false);
        notification.error({
            message: "Error",
            description: executeContractError.message,
        });
    }
  }, [executeContractError]);

  return (
    <>
      {postArr.map((e) => {
        return(
          <>
          <div className="feedPost">
            <img src={pfp ? pfp : defaultImgs[0]} className="profilePic"></img>
            <div className="completePost">
              <div className="who">
              {username}
                <div className="accWhen">
                {
                  `${e.attributes.postAcc.slice(0, 4)}...${e.attributes.postAcc.slice(38)} · 
                  ${e.attributes.createdAt.toLocaleString('en-us', { month: 'short' })}  
                  ${e.attributes.createdAt.toLocaleString('en-us', { day: 'numeric' })}
                  `  
                }
                </div>
              </div>
              <div className="postContent">
                <div className="postTitle">
                  {e.attributes.postTitle}
                  <div className = "postCategory">
                    {e.attributes.postCategory}
                  </div>
                </div>
                {e.attributes.postDescriptionText}
                {e.attributes.postImg && (
                  <img
                    src={e.attributes.postImg}
                    className="postImg"
                  ></img>
                )}
                {e.attributes.postAudio && (
                  <audio controls>
                    <source src={e.attributes.postAudio} />
                  </audio>
                )}
                {e.attributes.postVideo && (
                  <video width="500" height="300" controls>
                    <source src={e.attributes.postVideo} />
                  </video>
                )}
              </div>
              <div className="interactions">
                <div className="interactionsLink">
                  <Button
                    size="large"
                    type="primary"
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      borderRadius: "0.5rem",
                      fontSize: "16px",
                      fontWeight: "500",
                    }}
                    href={`https://opensea.io/assets/matic/${CONTRACT_ADDRESS}/${e.attributes.tokenId}`} 
                    target="_blank"
                    rel="noreferrer"
                      >
                     Sell on OpenSea 
                  </Button>
                </div>
              </div>
              <div className="interactions">
                <div className="interactionsLink">
                  {e.attributes.isFrac ? (
                    <Button
                      size="large"
                      type="primary"
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        borderRadius: "0.5rem",
                        fontSize: "16px",
                        fontWeight: "500",
                      }}
                      loading={isNftFracWithdrawInProgress}
                      onClick={() => burnTokens(e.attributes.tokenId)}
                    >
                      Withdraw Fractionalized NFT
                    </Button>
                    ) : (
                    <Button
                      size="large"
                      type="primary"
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        borderRadius: "0.5rem",
                        fontSize: "16px",
                        fontWeight: "500",
                      }}
                      onClick={() => {
                        showModal(e.attributes.tokenId);
                      }}
                      >
                      Fractionalize NFT
                    </Button>
                  )}
                  {/* Fractionalize NFT Modal */}
                  <Modal
                    open={open}
                    centered={true}
                    footer={null}
                    onCancel={handleCancel}
                    >
                    <Card 
                      style={{ width: "100%" }}
                      title= {'Fractionalize NFT'}
                      >
                      <Form
                        name="basic"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        >
                        <Form.Item
                          label="Token Name"
                          name="tokenName"
                          rules={[{ required: true, message: 'Please input your token name!' }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Token Ticker"
                          name="tokenTicker"
                          rules={[{ required: true, message: 'Please input your token ticker!' }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Supply"
                          name="supply"
                          rules={[{ required: true, message: 'Please input your supply!' }]}
                        >
                          <InputNumber size="large" min={1}  />
                        </Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={isNftFracInProgress} 
                          onClick={() => {
                            setIsNftFracInProgress(true);
                            
                          }}>
                          Submit
                        </Button>
                      </Form>
                    </Card>
                  </Modal>
                </div>
              </div>
            </div>
          </div>
          </>
        )
      }).reverse()
      }
    </>
  )
}

export default PostInProfile
