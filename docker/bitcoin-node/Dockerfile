FROM debian:buster-slim

RUN groupadd -r devault && useradd -r -m -g devault devault

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates curl dirmngr gosu gpg libssl-dev ntp wget software-properties-common \
	&& add-apt-repository ppa:devault/devault -y

# install devault binaries
RUN set -ex \
	&& apt-get install devaultd -y

# create data directory
ENV DEVAULT_DATA /data
RUN mkdir "$DEVAULT_DATA" \
	&& chown -R devault:devault "$DEVAULT_DATA" \
	&& ln -sfn "$DEVAULT_DATA" /home/devault/.devault \
	&& chown -h devault:devault /home/devault/.devault
# VOLUME /data

COPY ./docker/devault-node/docker-entrypoint.sh /entrypoint.sh
COPY ./docker/devault-node/walletnotify.sh /walletnotify.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD ["devaultd"]
