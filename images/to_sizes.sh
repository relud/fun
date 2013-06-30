#!/bin/bash

set -e

if [ -z "$(which convert 2>/dev/null)" ]; then
    echo "this requires the convert linux command"
    exit 0
fi

cd "$( echo "$(pwd)/$0" | sed -E 's_(.*)/.*_\1_')"

for f in $(ls source); do
    image="$(echo $f | sed 's/.png//')"
    for n in $(seq 16); do
        size=$((n*16))
        mkdir -p $size
        convert source/${image}.png -scale ${size}x${size} $size/${image}.png
    done
done
