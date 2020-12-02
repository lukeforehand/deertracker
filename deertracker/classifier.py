from pathlib import Path
from typing import Tuple, List
import time
import sys

from tqdm import tqdm
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


def get_datasets(
    data_dir: Path = DEFAULT_DATA_FOLDER, min_images: int = 1_000
) -> Tuple[tf.data.Dataset, tf.data.Dataset, List[str]]:
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
        batch_size=1,
    )

    class_names = train_ds.class_names

    def unpack_batch(image, label):
        return image[0], label

    train_ds = train_ds.map(unpack_batch)
    test_ds = test_ds.map(unpack_batch)

    rare_labels = [
        f.name for f in data_dir.glob("*") if len(list(f.glob("*"))) < min_images
    ]
    if rare_labels:
        print(f"These labels will be ignored due to lack of data: {rare_labels}")
    label_to_ind = dict(map(lambda x: (x[1], x[0]), enumerate(class_names)))
    for rare_label in rare_labels:
        ind_to_drop = label_to_ind[rare_label]
        train_ds = train_ds.filter(
            lambda img, label: ~tf.math.equal(label, ind_to_drop)[0]
        )
        test_ds = test_ds.filter(
            lambda img, label: ~tf.math.equal(label, ind_to_drop)[0]
        )

    def augment(image, label):
        image = tf.image.random_crop(image, [IMAGE_SIZE, IMAGE_SIZE, 3])
        image = tf.image.random_flip_left_right(image)
        image = tf.image.random_hue(image, max_delta=0.2)
        image = tf.image.random_saturation(image, 0.5, 2)
        image = tf.image.random_brightness(image, 0.2)
        image = tf.image.random_contrast(image, 0.5, 2)
        return image, label

    train_ds = train_ds.map(augment)

    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=_AUTOTUNE).batch(32)
    test_ds = test_ds.cache().prefetch(buffer_size=_AUTOTUNE).batch(32)

    return train_ds, test_ds, class_names


def train(name: str, data_dir: Path = DEFAULT_DATA_FOLDER, min_images: int = 1_000):
    train_ds, test_ds, class_names = get_datasets(data_dir, min_images)
    num_classes = len(class_names)

    model = Linnaeus(num_classes)
    model.build((32, IMAGE_SIZE, IMAGE_SIZE, 3))
    model.summary()

    loss_object = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    optimizer = tf.keras.optimizers.Adam()

    train_loss = tf.keras.metrics.Mean(name="train_loss")
    train_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="train_accuracy")

    test_loss = tf.keras.metrics.Mean(name="test_loss")
    test_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="test_overall_accuracy")
    accuracies = []
    for name in class_names:
        accuracies.append(tf.keras.metrics.SparseCategoricalAccuracy(name=f"test_{name}_accuracy"))

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
        for i in range(num_classes):  # tf.range(num_classes):
            accuracies[i](labels, predictions, sample_weight=tf.math.equal(labels, i))

    EPOCHS = 500
    n = len(list(train_ds))  # a little wasteful, but allows better progress bars

    for epoch in range(EPOCHS):
        if epoch == 0:
            model.base_model.trainable = True
        # Reset the metrics at the start of the next epoch
        train_loss.reset_states()
        train_accuracy.reset_states()
        test_loss.reset_states()
        test_accuracy.reset_states()

        for images, labels in tqdm(train_ds, total=n, file=sys.stdout, ascii=True):
            train_step(images, labels)

        for test_images, test_labels in test_ds:
            test_step(test_images, test_labels)

        print(
            f"Epoch {epoch + 1: >4}, "
            f"Loss: {train_loss.result():.2f}, "
            f"Accuracy: {train_accuracy.result() * 100:.2f}, "
            f"Test Loss: {test_loss.result():.2f}, "
            f"Test Accuracy: {test_accuracy.result() * 100:.2f}"
        )
        for i, acc in enumerate(accuracies):
            print(f"  {class_names[i] >30}, {acc.result():.2%}")
