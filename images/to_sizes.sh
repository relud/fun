#!/bin/bash

set -e

if [ -z "$(which convert 2>/dev/null)" ]; then
    echo "this requires the convert linux command"
    exit 0
fi

cd "$( echo "$(pwd)/$0" | sed -E 's_(.*)/.*_\1_')"

for image in $(ls source); do
    echo $image
    for n in $(seq 16); do
        size=$((n*16))
        mkdir -p $size
        cp source/$image $size/${image}_${size}.png
        convert -size ${size}x${size} $size/${image}_${size}.png --resize ${size}x${size}
    done
done
