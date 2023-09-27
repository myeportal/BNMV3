import { useEffect } from "react";
import Head from "next/head";
import { useMoralis } from "react-moralis";

export default function Home() {
  const {
    isWeb3Enabled,
    enableWeb3,
    isAuthenticated,
    isWeb3EnableLoading,
  } = useMoralis();

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading)
      enableWeb3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <Head>
        <title>Block News Media - Home</title>
        <meta name="description" content="Block News Media - Home" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="text-center">
        <h1 className="text-4xl font-bold text-indigo-700">
          Block News Media
        </h1>
      </main>
    </div>
  );
}
