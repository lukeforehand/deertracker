#!/bin/bash

cat extract.sql | sqlite3 storage.db
for c in $(cat image_paths.txt| cut -f1 | sort | uniq | cut -d' ' -f2)
do
  mkdir -p ds/$c; grep "$c" image_paths.txt | cut -f2 | xargs -I % mv % ./ds/training_imgs/$c/
done
