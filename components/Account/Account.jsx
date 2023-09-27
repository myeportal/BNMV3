import { useMoralis } from "react-moralis";
import { getEllipsisTxt } from "../../helpers/formatters";
import Blockie from "../Blockie";
import { Button, Card, Modal } from "antd";
import { useState, useEffect } from "react";
import Address from "../Address/Address";
import { SelectOutlined } from "@ant-design/icons";
import { getExplorer } from "../../helpers/networks";
import Text from "antd/lib/typography/Text";
import { connectors } from "./config";

import { Xumm } from 'xumm';

const xumm = new Xumm(process.env.NEXT_PUBLIC_XRP_APP_KEY, process.env.NEXT_PUBLIC_XRP_APP_SECRET);

const styles = {
    account: {
        height: "42px",
        padding: "0 15px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "fit-content",
        borderRadius: "12px",
        backgroundColor: "rgb(244, 244, 244)",
        cursor: "pointer",
    },
    text: {
        color: "#21BF96",
    },
    connector: {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        height: "auto",
        justifyContent: "center",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "20px 5px",
        cursor: "pointer",
    },
    icon: {
        alignSelf: "center",
        fill: "rgb(40, 13, 95)",
        flexShrink: "0",
        marginBottom: "8px",
        height: "30px",
    },
};

function Account() {
    const { authenticate, isAuthenticated, logout } = useMoralis();
    const { account, chainId } = useMoralis();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    // const getAddress = () => {
    //     const data = window.localStorage.getItem("XummPkceJwt");
    //     if (data) {
    //         const json = JSON.parse(data);
    //         return json.me.account;
    //     }
    //     return '';
    // }

    const [xummAddress, setXummAddress] = useState('');

    useEffect(() => {
        const handleSuccess = async () => {
            xumm.user.account.then((addr) => {
                if (addr) {
                    alert('Xumm Connected');
                    xumm.runtime.xapp = true;
                } else {
                    xumm.runtime.xapp = false;
                }
                setXummAddress(addr ?? '');
            });
        };

        const handleLogout = async () => {
            alert('Xumm Disonnected');
            setXummAddress('');
        }

        xumm.on("error", (e) => {
            console.log('error', e);
        });

        xumm.on('success', handleSuccess);
        xumm.on('logout', handleLogout);

        return () => {
            xumm.off('success', handleSuccess);
            xumm.off('logout', handleLogout);
        };
    }, []);

    if (!isAuthenticated && xummAddress == '') {
        return (
            <>
                <div
                    style={styles.account}
                    // onClick={() => authenticate({ signingMessage: "Hello World!" })}
                    onClick={() => setIsAuthModalVisible(true)}
                >
                    <p style={styles.text}>Authenticate</p>
                </div>
                <Modal
                    visible={isAuthModalVisible}
                    footer={null}
                    onCancel={() => setIsAuthModalVisible(false)}
                    bodyStyle={{
                        padding: "15px",
                        fontSize: "17px",
                        fontWeight: "500",
                    }}
                    style={{ fontSize: "16px", fontWeight: "500" }}
                    width="340px"
                >
                    <div
                        style={{
                            padding: "10px",
                            display: "flex",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "20px",
                        }}
                    >
                        Connect Wallet
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                        }}
                    >
                        {connectors.map(({ title, icon, connectorId }, key) => (
                            <div
                                style={styles.connector}
                                key={key}
                                onClick={async () => {
                                    try {
                                        if (connectorId == "xumm") {
                                            xumm.authorize();
                                        } else {
                                            await authenticate({
                                                provider: connectorId,
                                                signingMessage: "Login to BNM",
                                            });
                                        }
                                        window.localStorage.setItem(
                                            "connectorId",
                                            connectorId
                                        );
                                        setIsAuthModalVisible(false);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                            >
                                <img
                                    src={icon}
                                    alt={title}
                                    style={styles.icon}
                                />
                                <Text style={{ fontSize: "14px" }}>
                                    {title}
                                </Text>
                            </div>
                        ))}
                    </div>
                </Modal>
            </>
        );
    }
    if(xummAddress != ''){
        return (
            <>
                <div
                    style={styles.account}
                    // onClick={() => authenticate({ signingMessage: "Hello World!" })}
                    onClick={() => {console.log("xumm disconnect"); alert('Xumm Disonnected'); setXummAddress(''); xumm.logout();}}
                >
                    <p style={styles.text}>{getEllipsisTxt(xummAddress, 6)}</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div style={styles.account} onClick={() => setIsModalVisible(true)}>
                <p style={{ marginRight: "5px", ...styles.text }}>
                    {getEllipsisTxt(account, 6)}
                </p>
                <Blockie currentWallet scale={3} />
            </div>
            <Modal
                visible={isModalVisible}
                footer={null}
                onCancel={() => setIsModalVisible(false)}
                bodyStyle={{
                    padding: "15px",
                    fontSize: "17px",
                    fontWeight: "500",
                }}
                style={{ fontSize: "16px", fontWeight: "500" }}
                width="400px"
            >
                Account
                <Card
                    style={{
                        marginTop: "10px",
                        borderRadius: "1rem",
                    }}
                    bodyStyle={{ padding: "15px" }}
                >
                    <Address
                        avatar="left"
                        size={6}
                        copyable
                        style={{ fontSize: "20px" }}
                    />
                    <div style={{ marginTop: "10px", padding: "0 10px" }}>
                        <a
                            href={`https://polygonscan.com/address/${account}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <SelectOutlined style={{ marginRight: "5px" }} />
                            View on Explorer
                        </a>
                    </div>
                </Card>
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
                    onClick={async () => {
                        await logout();
                        window.localStorage.removeItem("connectorId");
                        setIsModalVisible(false);
                    }}
                >
                    Disconnect Wallet
                </Button>
            </Modal>
        </>
    );
}

export default Account;
