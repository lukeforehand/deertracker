from pathlib import Path
import time

import tensorflow as tf
from tensorflow.keras import layers


IMAGE_SIZE = 96
DEFAULT_DATA_FOLDER = Path(__file__).parents[1] / ".data/imgs"
_AUTOTUNE = tf.data.experimental.AUTOTUNE


class Linnaeus(tf.keras.Model):
    """
    Carl Linnaeus ..., was a Swedish botanist, zoologist, and physician who
    formalised binomial nomenclature, the modern system of naming organisms.
    He is known as the "father of modern taxonomy".

    https://en.wikipedia.org/wiki/Carl_Linnaeus
    """

    def __init__(self, num_classes):
        super().__init__()
        self.preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input
        self.base_model = tf.keras.applications.MobileNetV2(
            input_shape=[IMAGE_SIZE, IMAGE_SIZE, 3],
            include_top=False,
            weights="imagenet",
        )
        self.base_model.trainable = False
        self.avg_pool = layers.GlobalAveragePooling2D()
        self.dropout = layers.Dropout(0.1)
        self.d1 = layers.Dense(32, activation="relu")
        self.d2 = layers.Dense(num_classes)

    def call(self, x):
        x = self.preprocess_input(x)
        x = self.base_model(x)
        x = self.avg_pool(x)
        x = self.dropout(x)
        x = self.d1(x)
        return self.d2(x)


def train(name: str, data_dir: Path = DEFAULT_DATA_FOLDER, min_images: int = 1000):
    # TODO: use the min_images parameter to prune classes with < min_images
    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="training",
        seed=20201130,
        image_size=(IMAGE_SIZE + 10, IMAGE_SIZE + 10),
        batch_size=1,
    )
    test_ds = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="validation",
        seed=20201130,
        image_size=(IMAGE_SIZE, IMAGE_SIZE),
        batch_size=32,
    )

    model = Linnaeus(len(train_ds.class_names))
    model.build((32, IMAGE_SIZE, IMAGE_SIZE, 3))
    model.summary()

    def augment(image, label):
        image = image[0]
        image = tf.image.random_crop(image, [IMAGE_SIZE, IMAGE_SIZE, 3])
        image = tf.image.random_flip_left_right(image)
        image = tf.image.random_hue(image, max_delta=0.2)
        image = tf.image.random_saturation(image, 0.5, 2)
        image = tf.image.random_brightness(image, 0.2)
        image = tf.image.random_contrast(image, 0.5, 2)
        return image, label

    train_ds = train_ds.map(augment)

    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=_AUTOTUNE).batch(32)
    test_ds = test_ds.cache().prefetch(buffer_size=_AUTOTUNE)

    loss_object = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    optimizer = tf.keras.optimizers.Adam()

    train_loss = tf.keras.metrics.Mean(name="train_loss")
    train_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="train_accuracy")

    test_loss = tf.keras.metrics.Mean(name="test_loss")
    test_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="test_accuracy")

    @tf.function
    def train_step(images, labels):
        with tf.GradientTape() as tape:
            predictions = model(images, training=True)
            loss = loss_object(labels, predictions)
        gradients = tape.gradient(loss, model.trainable_variables)
        optimizer.apply_gradients(zip(gradients, model.trainable_variables))

        train_loss(loss)
        train_accuracy(labels, predictions)

    @tf.function
    def test_step(images, labels):
        predictions = model(images, training=False)
        t_loss = loss_object(labels, predictions)

        test_loss(t_loss)
        test_accuracy(labels, predictions)

    EPOCHS = 500

    for epoch in range(EPOCHS):
        start = time.time()
        if epoch == 0:
            model.base_model.trainable = True
        # Reset the metrics at the start of the next epoch
        train_loss.reset_states()
        train_accuracy.reset_states()
        test_loss.reset_states()
        test_accuracy.reset_states()

        for images, labels in train_ds:
            train_step(images, labels)

        for test_images, test_labels in test_ds:
            test_step(test_images, test_labels)

        stop = time.time()
        print(
            f"Epoch {epoch + 1: >4} ({stop - start:.2f}s), "
            f"Loss: {train_loss.result():.2f}, "
            f"Accuracy: {train_accuracy.result() * 100:.2f}, "
            f"Test Loss: {test_loss.result():.2f}, "
            f"Test Accuracy: {test_accuracy.result() * 100:.2f}"
        )
