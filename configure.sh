# Install Ethereum
apt-get update
apt-get install software-properties-common -y
add-apt-repository -y ppa:ethereum/ethereum
apt-get update
apt-get install ethereum python-pip -y
pip install web3 pillow redis configparser
geth --testnet --rpc --rpcaddr 0.0.0.0 -rpccorsdomain "*" --rpcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3"
# parity --testnet --geth ui
parity.exe --jsonrpc-hosts all --testnet ui
