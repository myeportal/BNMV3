import { MoralisProvider, useMoralis } from "react-moralis";
import { Layout, Breadcrumb } from "antd";
import { useRouter } from "next/router";
import "antd/dist/antd.css";
import "../styles/globals.css";
import "../components/Address/identicon.css";
import Account from "../components/Account/Account.jsx";
import MenuItems from "../components/MenuItems.jsx";
import TokenPrice from "../components/TokenPrice.jsx";
import { useEffect } from "react";
import { CHAIN, CHAIN_ID } from "../consts/vars";

const { Header, Content } = Layout;

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    padding: "10px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerDark: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#001529",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
  headerRightDark: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
    backgroundColor: "#001529",
  },
};

const LightApp = ({ component: Component, pageProps }) => {
  const { isAuthenticated } = useMoralis();
  const { pathname } = useRouter();
  const { Moralis } = useMoralis();

  useEffect(() => {
    async function checkChain() {
      const web3 = await Moralis.Web3.enableWeb3()
      const chain = web3.currentProvider;
      const chainId = chain.chainId;
      console.log(chainId)
      if( chainId !== CHAIN_ID ) {
        alert(`Please switch to ${CHAIN} network`)
        window.location.reload();
        return;
      }
    }
    checkChain();
  },[])

  const pathNameToText = (pathname) => {
    if (pathname === "/mintArticle") {
      return "Mint Article";
    } else if (pathname === "/mintAudio") {
      return "Mint Audio";
    } else if (pathname === "/mintVideo") {
      return "Mint Video";
    } else if (pathname === "/feed") {
      return "Feed";
    } else if (pathname === "/profile") {
      return "Profile";
    } else if (pathname === "/settings") {
      return "Settings";
    }
  };

  return (
    <Layout style={{ backgroundColor: '#ffffff', height: "100vh", overflow: "auto" }}>
      <Header style={styles.header}>
        <img style={{ display: "flex" }} src={"/bnm-logo.svg"} alt="BNM Logo" />
        <MenuItems isAuthenticated={isAuthenticated} />
        <div style={styles.headerRight}>
          <TokenPrice
            address="0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
            image="https://polygonscan.com/images/svg/brands/polygon.svg"
            size="28px"
            exchange={"quickswap"}
            chain={"polygon"}
          />
          <Account />
        </div>
      </Header>

      <Content style={{ padding: "0 50px" }}>
        <Breadcrumb style={{ marginTop: "100px" }}>
          <Breadcrumb.Item>Block News Media</Breadcrumb.Item>
          <Breadcrumb.Item>{pathNameToText(pathname)}</Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content">
          <div style={styles.content}>
            <Component {...pageProps} />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider
      appId={process.env.NEXT_PUBLIC_MORALIS_APPLICATION_ID}
      serverUrl={process.env.NEXT_PUBLIC_MORALIS_SERVER_URL}
    >
      <LightApp component={Component} pageProps={pageProps} />
    </MoralisProvider>
  );
}

// This function gets called at build time
export async function getStaticProps(props) {
  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {},
  };
}

export default MyApp;
