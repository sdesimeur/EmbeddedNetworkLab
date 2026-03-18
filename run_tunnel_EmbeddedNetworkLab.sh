#!/bin/bash
set -euo pipefail
sudo socat \
TCP-LISTEN:80,reuseaddr,fork \
TCP:localhost:4200
