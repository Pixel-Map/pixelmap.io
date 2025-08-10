import MetaMaskOnboarding from "@metamask/onboarding";
import { useWeb3React } from "@web3-react/core";
import { UserRejectedRequestError } from "@web3-react/injected-connector";
import { useEffect, useRef, useState } from "react";
import { injected } from "../utils/web3Connectors";
import useENSName from "../hooks/useENSName";
import { formatEtherscanLink, shortenIfHex } from "../utils/misc";

type Props = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: Props) => {
  const {
    active,
    error,
    activate,
    chainId,
    account,
  } = useWeb3React();

  // initialize metamask onboarding
  const onboarding = useRef<MetaMaskOnboarding>();

  useEffect(() => {
    onboarding.current = new MetaMaskOnboarding();
  }, []);

  // manage connecting state for injected connector
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    if (active || error) {
      setConnecting(false);
      onboarding.current?.stopOnboarding();
    }
  }, [active, error]);

  const ENSName = useENSName(account);

  if (error) {
    return null;
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    const hasMetaMaskOrWeb3Available =
      MetaMaskOnboarding.isMetaMaskInstalled() ||
      (window as any)?.ethereum ||
      (window as any)?.web3;

    return (
      <div>
        {hasMetaMaskOrWeb3Available ? (
          <button
            className="nes-btn py-1 transition duration-150 text-sm font-semibold"
            onClick={() => {
              setConnecting(true);

              activate(injected, undefined, true).catch(async (error) => {
                // If the error is due to unsupported chain, try to switch to mainnet
                if (error?.name === 'UnsupportedChainIdError' || error?.message?.includes('Unsupported chain')) {
                  try {
                    // Request to switch to Ethereum mainnet
                    await (window as any).ethereum.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: '0x1' }], // chainId must be in hex
                    });
                    // Try to activate again after switching
                    activate(injected, undefined, true).catch((retryError) => {
                      console.error('Failed to connect after switching network:', retryError);
                      setConnecting(false);
                    });
                  } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                      console.error('Ethereum mainnet not configured in wallet');
                    } else {
                      console.error('Failed to switch network:', switchError);
                    }
                    setConnecting(false);
                  }
                } else if (error instanceof UserRejectedRequestError) {
                  setConnecting(false);
                } else {
                  console.error(error);
                  setConnecting(false);
                }
              });
            }}
          >
            {MetaMaskOnboarding.isMetaMaskInstalled()
              ? "Connect to MetaMask"
              : "Connect to Wallet"}
          </button>
        ) : (
          <button 
            className="inline-flex items-center px-4 py-1 border border-white shadow-sm text-sm font-semibold rounded-full text-white bg-blur hover:opacity-80 transition duration-150"
            onClick={() => onboarding.current?.startOnboarding()}>
            Install Metamask
          </button>
        )}
      </div>
    );
  }

  const etherscanUrl = chainId 
    ? formatEtherscanLink("Account", [chainId, account]) 
    : `https://etherscan.io/address/${account}`;
    
  return (
    <a
      href={etherscanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="nes-btn py-1 is-primary text-sm font-semibold transition duration-150"
    >
      {ENSName || `${shortenIfHex(account, 12)}`}
    </a>
  );
};

export default Account;
