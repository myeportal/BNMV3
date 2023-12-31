export const networkConfigs = {
    "0x89": {
        chainId: 137,
        chainName: "Polygon Mainnet",
        currencyName: "MATIC",
        currencySymbol: "MATIC",
        rpcUrl: "https://rpc-mainnet.maticvigil.com/",
        blockExplorerUrl: "https://explorer-mainnet.maticvigil.com/",
        wrapped: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    },
    "0x13881": {
        chainId: 80001,
        chainName: "Mumbai",
        currencyName: "MATIC",
        currencySymbol: "MATIC",
        rpcUrl: "https://rpc-mumbai.matic.today/",
        blockExplorerUrl: "https://mumbai.polygonscan.com/",
    },
    "0x539": {
        chainId: 1337,
        chainName: "Dev Chain",
        currencyName: "ETH",
        currencySymbol: "ETH",
        rpcUrl: "HTTP://127.0.0.1:7545",
        blockExplorerUrl: "",
    },
};

export const getNativeByChain = (chain) =>
    networkConfigs[chain]?.currencySymbol || "NATIVE";

export const getChainById = (chain) => networkConfigs[chain]?.chainId || null;

export const getExplorer = (chain) => networkConfigs[chain]?.blockExplorerUrl;

export const getWrappedNative = (chain) =>
    networkConfigs[chain]?.wrapped || null;
