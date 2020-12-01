.open storage.db
.mode tabs
.once image_paths.txt
SELECT c.categoryName, i.imagePath FROM categories c JOIN labels l ON c.id = l.category_id join images i ON i.id = l.image_id;

