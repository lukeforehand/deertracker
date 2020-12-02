from pathlib import Path
from typing import Tuple, List
import time
import sys

from tqdm import tqdm
import tensorflow as tf
from tensorflow.keras import layers


IMAGE_SIZE = 96
DEFAULT_DATA_FOLDER = Path(__file__).parents[1] / ".data/imgs"
DEFAULT_LOGS_FOLDER = Path(__file__).parents[1] / ".tensorboard"
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
    for rare_label in sorted(rare_labels, key=label_to_ind.get, reverse=True):
        ind_to_drop = label_to_ind[rare_label]
        train_ds = train_ds.filter(
            lambda img, label: ~tf.math.equal(label, ind_to_drop)[0]
        )
        test_ds = test_ds.filter(
            lambda img, label: ~tf.math.equal(label, ind_to_drop)[0]
        )

        @tf.function
        def reduce_index(image, label):
            if label[0] >= ind_to_drop:
                return image, label - 1
            return image, label

        train_ds = train_ds.map(reduce_index)
        test_ds = test_ds.map(reduce_index)
    class_names = [c for c in class_names if c not in rare_labels]

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


def train(
    name: str,
    data_dir: Path = DEFAULT_DATA_FOLDER,
    tb_logs: Path = DEFAULT_LOGS_FOLDER,
    min_images: int = 1_000,
):
    train_ds, test_ds, class_names = get_datasets(data_dir, min_images)
    num_classes = len(class_names)
    class_to_num = {c: len(list((data_dir / c).glob("*"))) for c in class_names}

    model = Linnaeus(num_classes)
    model.build((32, IMAGE_SIZE, IMAGE_SIZE, 3))
    model.summary()

    tb_logs = tb_logs / name
    tb_logs.mkdir(exist_ok=True, parents=True)
    tb_writer = tf.summary.create_file_writer(str(tb_logs))

    loss_object = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    optimizer = tf.keras.optimizers.Adam()

    train_loss = tf.keras.metrics.Mean(name="train_loss")
    train_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="train_accuracy")

    test_loss = tf.keras.metrics.Mean(name="test_loss")
    test_accuracy = tf.keras.metrics.SparseCategoricalAccuracy(name="test_accuracy")
    accuracies = []
    for name in class_names:
        accuracies.append(
            tf.keras.metrics.SparseCategoricalAccuracy(name=f"test_{name}_accuracy")
        )

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
    total_train_samples = None

    for epoch in range(EPOCHS):
        if epoch == 0:
            model.base_model.trainable = True
        # Reset the metrics at the start of the next epoch
        train_loss.reset_states()
        train_accuracy.reset_states()
        test_loss.reset_states()
        test_accuracy.reset_states()

        for i, (images, labels) in tqdm(
            enumerate(train_ds), total=total_train_samples, file=sys.stdout, ascii=True
        ):
            train_step(images, labels)
        if total_train_samples is None:
            total_train_samples = i + 1

        for test_images, test_labels in test_ds:
            test_step(test_images, test_labels)

        with tb_writer.as_default():
            tf.summary.scalar("train_loss", train_loss.result(), step=epoch)
            tf.summary.scalar("train_accuracy", train_accuracy.result(), step=epoch)
            tf.summary.scalar("test_loss", test_loss.result(), step=epoch)
            tf.summary.scalar("test_accuracy", test_accuracy.result(), step=epoch)
            for name, acc in zip(class_names, accuracies):
                tf.summary.scalar(f"test_{name}_accuracy", acc.result(), step=epoch)
            tb_writer.flush()
        print(
            f"Epoch {epoch + 1: >4}, "
            f"Loss: {train_loss.result():.2f}, "
            f"Accuracy: {train_accuracy.result(): >6.2%}, "
            f"Test Loss: {test_loss.result():.2f}, "
            f"Test Accuracy: {test_accuracy.result(): >6.2%}"
        )
        for name, acc in zip(class_names, accuracies):
            print(
                f"  {name.rjust(max(map(len, class_names)), ' ')},"
                f" {acc.result(): >6.2%}"
                f" (prevelance: {class_to_num[name] / sum(class_to_num.values()): >6.2%})"
            )
