import type { BrowserProvider } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

export default function useENSName(address: string | undefined | null) {
  const { library, chainId } = useWeb3React();
  const [ENSName, setENSName] = useState("");

  useEffect(() => {
    if (library && typeof address === "string") {
      let stale = false;

      const web3Provider = library as BrowserProvider;
      
      web3Provider
        .lookupAddress(address)
        .then((name) => {
          if (!stale && typeof name === "string") {
            setENSName(name);
          }
        })
        .catch(() => {});

      return () => {
        stale = true;
        setENSName("");
      };
    }
  }, [library, address, chainId]);

  return ENSName;
}
