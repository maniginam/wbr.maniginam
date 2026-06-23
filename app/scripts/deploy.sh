#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export AWS_ACCESS_KEY_ID="$MANIGINAM_AWS_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$MANIGINAM_AWS_SECRET_KEY"
export AWS_DEFAULT_REGION=us-east-1
aws s3 sync public/ s3://wbr.maniginam.dev/app/ --delete
aws cloudfront create-invalidation --distribution-id E1GYG7LWHML23S --paths "/app/*" >/dev/null
echo "Staged at https://wbr.maniginam.dev/app/"
