FROM ubuntu:trusty
WORKDIR /var/www/html

# Install Requirements
RUN apt-get update && apt-get install python-pip python-dev iputils-ping \
    build-essential apache2 supervisor software-properties-common curl git \
    wget vim -y && pip install --upgrade pip
RUN add-apt-repository -y ppa:ethereum/ethereum
RUN apt-get update && apt-get install -y ethereum redis-server

# Install Parity
RUN wget http://d1h4xl4cr1h0mo.cloudfront.net/v1.4.5/x86_64-unknown-linux-gnu/parity_1.4.5_amd64.deb && \
    dpkg -i parity_1.4.5_amd64.deb

# Install Python Packages
RUN pip install requests web3 redis Pillow jinja2

# Manually set up the apache environment variables
ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data
ENV APACHE_LOG_DIR /var/log/apache2
ENV APACHE_PID_FILE /var/run/apache2.pid
ENV APACHE_RUN_DIR /var/run/apache2
ENV APACHE_LOCK_DIR /var/lock/apache2
ENV APACHE_SERVERADMIN admin@localhost
ENV APACHE_SERVERNAME localhost
ENV APACHE_SERVERALIAS docker.localhost
ENV APACHE_DOCUMENTROOT /var/www
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Better Bashrc
COPY .bashrc /.bashrc
COPY .bashrc /root/.bashrc

# Copy in Code
COPY . /var/www/html/

# Apache
ENTRYPOINT /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EXPOSE 80
