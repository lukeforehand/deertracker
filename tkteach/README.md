# Labeling tool tkteach

Copyright https://github.com/Serhiy-Shekhovtsov/tkteach

### copy crops into `ds/<dataset>/`

```bash
cd tkteach
vi categories.txt
python tkteach
```

### use similarity hashing to sort photo files by similarity

This makes labeling quicker as similar images are grouped

```
python sim_sort.py dhash ds/deer/
```

### sort into labeled folders

Extract labels and paths from database and sort into label folders

```bash
./file_sort.sh
```

