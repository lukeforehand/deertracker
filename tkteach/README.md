# Labeling tool tkteach

Copyright https://github.com/Serhiy-Shekhovtsov/tkteach

### copy crops into `ds/<dataset>/`

```bash
cd tkteach
vi categories.txt
python tkteach
```

### sort into labeled folders

```bash
cat extract.sql | sqlite3 storage.db
for c in $(cat image_paths.txt| cut -f1 | sort | uniq | cut -d' ' -f2)
do
  mkdir -p ds/$c; grep "$c" image_paths.txt | cut -f2 | xargs -I % mv % ./ds/$c/
done
```

