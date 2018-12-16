#!/usr/bin/env bash

set -e

if [[ "$1" == "bitcoin-cli" || "$1" == "bitcoin-tx" || "$1" == "bitcoind" || "$1" == "test_bitcoin" ]]; then
	mkdir -p "$BITCOIN_DATA"

	if [[ ! -s "$BITCOIN_DATA/bitcoin.conf" ]]; then
		cat <<-EOF > "$BITCOIN_DATA/bitcoin.conf"
		printtoconsole=1
		rpcallowip=::/0
		rpcpassword=$BITCOIND_RPC_PASS
		rpcuser=$BITCOIND_RPC_USER
		proxy=tor:9050
		prune=550
		walletnotify=/walletnotify.sh %s
		regtest=$TEST_MODE
		EOF
		chown bitcoin:bitcoin "$BITCOIN_DATA/bitcoin.conf"
	fi

	# ensure correct ownership and linking of data directory
	# we do not update group ownership here, in case users want to mount
	# a host directory and still retain access to it
	chown -R bitcoin "$BITCOIN_DATA"
	ln -sfn "$BITCOIN_DATA" /home/bitcoin/.bitcoin
	chown -h bitcoin:bitcoin /home/bitcoin/.bitcoin
	chown bitcoin:bitcoin /walletnotify.sh

	exec gosu bitcoin "$@"
fi

exec "$@"