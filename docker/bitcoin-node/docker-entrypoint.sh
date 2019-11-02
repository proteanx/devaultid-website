#!/usr/bin/env bash

set -e

if [[ "$1" == "devault-cli" || "$1" == "devault-tx" || "$1" == "devaultd" || "$1" == "test_devault" ]]; then
	mkdir -p "$DEVAULT_DATA"

	if [[ ! -s "$DEVAULT_DATA/devault.conf" ]]; then
		cat <<-EOF > "$DEVAULT_DATA/devault.conf"
		printtoconsole=1
		rpcallowip=::/0
		rpcpassword=$DEVAULTD_RPC_PASS
		rpcuser=$DEVAULTD_RPC_USER
		proxy=tor:9050
		prune=550
		walletnotify=/walletnotify.sh %s
		regtest=$TEST_MODE
		EOF
		chown devault:devault "$DEVAULT_DATA/devault.conf"
	fi

	# ensure correct ownership and linking of data directory
	# we do not update group ownership here, in case users want to mount
	# a host directory and still retain access to it
	chown -R devault "$DEVAULT_DATA"
	ln -sfn "$DEVAULT_DATA" /home/devault/.devault
	chown -h devault:devault /home/devault/.devault
	chown devault:devault /walletnotify.sh

	exec gosu devault "$@"
fi

exec "$@"
