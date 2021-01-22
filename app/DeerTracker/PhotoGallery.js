import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
    StyleSheet,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import ImageResizer from 'react-native-image-resizer';
import ImageViewer from 'react-native-image-zoom-viewer';

import Database from './Database';
import style, { screenWidth, screenHeight, thumbWidth, thumbHeight } from './style';

const root = RNFS.DocumentDirectoryPath;

const detectorUrl = "http://192.168.0.157:5000";

export default class PhotoGallery extends React.Component {

    constructor(props) {
        super(props);
        this.db = new Database();
        this.state = { modalVisible: false, profileVisible: false, photos: [] };
        this.generateThumbs(props.photos);
    }

    componentDidUpdate() {
        // compare new image urls to previous
        let newPhotos = this.props.photos.filter((photo) => {
            return this.state.photos.indexOf(photo) == -1;
        });
        this.generateThumbs(newPhotos);
    }

    generateThumbs(photos) {
        photos.map((photo) => {
            photo.url = photo.photo_path;
            photo.props = {
                photo: photo,
                style: {
                    top: -screenHeight / 6
                }
            };

            let w = thumbWidth;
            let h = thumbHeight;
            if (photo.width && photo.height) {
                let scale = w / photo.width;
                h = scale * photo.height;
            }

            let thumbPath = RNFS.CachesDirectoryPath + '/thumb_' + photo.photo_path.split('\\').pop().split('/').pop();
            RNFS.exists(thumbPath).then((exists) => {
                if (exists) {
                    photo.thumb = {
                        uri: thumbPath,
                        width: w,
                        height: h
                    };
                    this.setState({
                        photos: [...photos]
                    });
                } else {
                    ImageResizer.createResizedImage(photo.photo_path, w, h, 'JPEG', 50, 0, thumbPath, false, { mode: 'cover' }).then((thumb) => {
                        RNFS.moveFile(thumb.uri, thumbPath).catch((err) => {
                            RNFS.unlink(thumb.uri);
                        }).then(() => {
                            thumb.uri = thumbPath;
                            photo.thumb = thumb;
                            this.setState({
                                photos: [...photos]
                            });
                        });
                    }).catch((err) => {
                        console.log(err);
                    })
                }
            });
        });
    }

    render() {
        const photos = this.state.photos;
        return (
            <View>
                <FlatList
                    style={{ height: '100%', width: '100%' }}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-evenly' }}
                    data={photos}
                    renderItem={(item) => {
                        let photo = item.item;
                        let thumb = photo.thumb;
                        return (
                            <TouchableOpacity
                                key={photo.photo_path}
                                onPress={() => {
                                    this.generateCrop(photos[item.index].objects[0]);
                                    this.setState({ modalVisible: true, imageIndex: item.index });
                                }}>
                                {thumb &&
                                    <View>
                                        <Image
                                            source={{ uri: thumb.uri }}
                                            style={{ width: thumb.width, height: thumb.height }} />
                                        {this.props.showCrops && photo.objects && photo.objects.map((o) => {
                                            let ratio = thumb.width / (o.width);
                                            return (
                                                <View key={o.id} style={{
                                                    ...StyleSheet.absoluteFillObject,
                                                    left: parseInt(o.x * ratio),
                                                    top: parseInt(o.y * ratio),
                                                    width: parseInt(o.w * ratio),
                                                    height: parseInt(o.h * ratio),
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(0,255,0,1.0)'
                                                }} />
                                            );
                                        })}
                                    </View>
                                }
                            </TouchableOpacity>
                        )
                    }}
                    keyExtractor={photo => photo.photo_path}
                />
                {this.state.modalVisible &&
                    <Modal transparent={true} onRequestClose={() => this.setState({ modalVisible: false })}>
                        <ImageViewer
                            imageUrls={photos}
                            index={this.state.imageIndex}
                            enableSwipeDown={true}
                            enableImageZoom={false}
                            renderImage={this.renderImage.bind(this)}
                            onChange={(index) => { this.generateCrop(photos[index].objects[0]) }}
                            onCancel={() => { }}
                            onDoubleClick={(onCancel) => {

                                // todo zoom to crop, refresh menu
                                onCancel();
                            }}
                            renderFooter={this.renderMenu.bind(this)}
                            swipeDownThreshold={80}
                            onSwipeDown={() => { this.setState({ modalVisible: false }) }}
                        />
                    </Modal>
                }
            </View >
        );
    }

    renderImage(props) {
        let photo = props.photo;
        let ratio = screenWidth / photo.width;
        return (
            <View>
                <Image {...props} />
                {photo.objects.map((object) => {
                    let borderColor = 'rgba(255,0,0,1.0)';
                    if (this.state.crop && this.state.crop.id == object.id) {
                        borderColor = 'rgba(0,255,0,1.0)'
                    }
                    return (
                        <TouchableOpacity
                            key={object.id}
                            onPress={() => { this.generateCrop(object) }}
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                left: parseInt(object.x * ratio),
                                top: parseInt(object.y * ratio) - screenHeight / 6,
                                width: parseInt(object.w * ratio),
                                height: parseInt(object.h * ratio),
                                borderWidth: 1,
                                borderColor: borderColor,
                            }} />
                    );
                })}
            </View>
        );
    }

    generateCrop(object) {
        let cropPath = RNFS.CachesDirectoryPath + '/crop_' + object.id + '.jpg';
        RNFS.exists(cropPath).then((exists) => {
            if (exists) {
                object.path = cropPath;
                this.setState({
                    crop: object
                });
            } else {
                let cropData = {
                    offset: {
                        x: object.x,
                        y: object.y
                    },
                    size: {
                        width: object.w,
                        height: object.h
                    },
                    displaySize: {
                        width: thumbWidth,
                        height: 200
                    }
                };
                ImageEditor.cropImage(root + '/' + object.photo_path, cropData).then(url => {
                    RNFS.moveFile(url, cropPath).catch((err) => {
                        RNFS.unlink(url);
                    }).then(() => {
                        object.path = cropPath;
                        this.setState({
                            crop: object
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        });
    }

    renderMenu(index) {
        if (!this.props.showCrops) {
            return;
        }
        let crop = this.state.crop;
        if (crop) {
            let max = Math.max(crop.w, crop.h);
            let w = (thumbWidth / max) * crop.w;
            let h = (200 / max) * crop.h;
            return (
                <View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={style.galleryMenu}>
                            <Text style={style.t6}>Pick class</Text>
                            <Picker
                                selectedValue={crop.label}
                                style={style.picker}
                                itemStyle={style.pickerItem}
                                onValueChange={(itemValue, itemIndex) => { this.updateObject(crop, itemIndex) }}>
                                {crop.label_array.map((label) => {
                                    return (<Picker.Item key={label} label={label} value={label} />);
                                })}
                            </Picker>
                        </View>
                        <View style={{ width: thumbWidth, alignItems: 'center' }}>
                            <Image
                                source={{ uri: crop.path }}
                                style={{ width: w, height: h, borderWidth: 1, borderColor: 'rgba(0,255,0,1.0)' }} />
                            <TouchableOpacity style={style.galleryButton}
                                onPress={() => { this.setState({ profileVisible: true }) }}>
                                <Text style={style.t6}>Add to Profile</Text>
                            </TouchableOpacity>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                onShow={() => { this.profileModal.focus(); }}
                                visible={this.state.profileVisible}>
                                <View style={style.modal}>
                                    <TextInput
                                        style={style.t2}
                                        ref={ref => { this.profileModal = ref; }}
                                        onChangeText={(text) => { this.setState({ profile: text }) }}
                                        selectTextOnFocus={true}
                                        defaultValue="Enter Profile name" />
                                </View>
                                <TouchableOpacity style={style.button} onPress={() => { alert('todo save') }}>
                                    <Text style={style.h1}>Save</Text>
                                </TouchableOpacity>
                                <TouchableWithoutFeedback onPress={() => { this.setState({ profileVisible: false }) }}>
                                    <View style={{ flex: 1 }} />
                                </TouchableWithoutFeedback>
                            </Modal>
                        </View>
                    </View>
                </View >
            );
        }
    }

    updateObject(object, labelIndex) {
        object.label = object.label_array[labelIndex];
        object.score = object.score_array[labelIndex];
        this.setState({
            crop: object
        });
        this.db.updateObject(object.id, object.label, object.score).then(() => {
            const formData = new FormData();
            formData.append('x', object.x);
            formData.append('y', object.y);
            formData.append('w', object.w);
            formData.append('h', object.h);
            formData.append('label', object.label);
            formData.append('score', object.score);
            fetch(detectorUrl + '/' + object.upload_id, { method: 'PUT', body: formData }).then((response) => {
                console.log(response.status);
                if (response.status == 200) {
                    response.json().then((json) => {
                        console.log(JSON.stringify(json));
                    })
                } else {
                    response.text().then((text) => {
                        console.log(text);
                    });
                }
            });
        });
    }
}
