#!/bin/bash
# Run this once to generate a self-signed certificate for HTTPS
mkdir -p cert
openssl req -x509 -newkey rsa:2048 -keyout cert/key.pem -out cert/cert.pem \
  -days 365 -nodes \
  -subj "/C=AU/ST=Queensland/L=Brisbane/O=QUT/OU=CAB230/CN=localhost"
echo "✓ cert/key.pem and cert/cert.pem generated"
