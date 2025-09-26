#!/bin/bash

# SSL証明書生成スクリプト
# Cloudflare Tunnel使用時は自己署名証明書で十分

# 証明書ディレクトリを作成
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# 自己署名証明書を生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Tomosigoto/OU=IT/CN="

# 権限設定
chmod 600 /etc/ssl/private/nginx-selfsigned.key
chmod 644 /etc/ssl/certs/nginx-selfsigned.crt

echo "SSL証明書が生成されました:"
echo "証明書: /etc/ssl/certs/nginx-selfsigned.crt"
echo "秘密鍵: /etc/ssl/private/nginx-selfsigned.key"
