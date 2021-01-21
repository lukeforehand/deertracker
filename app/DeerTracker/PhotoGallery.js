import React from 'react';
import {
    Modal,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import ImageResizer from 'react-native-image-resizer';
import ImageViewer from 'react-native-image-zoom-viewer';

import Database from './Database';
import style, { thumbWidth, thumbHeight } from './style';

const detectorUrl = "http://192.168.0.157:5000";

export default class PhotoGallery extends React.Component {

    constructor(props) {
        super(props);
        this.db = new Database();
        this.state = { modalVisible: false, photos: [] };
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
                    renderItem={(item) => (
                        <TouchableOpacity
                            key={item.item.photo_path}
                            onPress={() => {
                                this.setState({ modalVisible: true, imageIndex: item.index })
                            }}>
                            {item.item.thumb &&
                                <View>
                                    <Image
                                        source={{ uri: item.item.thumb.uri }}
                                        style={{ width: item.item.thumb.width, height: item.item.thumb.height }} />
                                    {this.props.showCrops && item.item.objects && item.item.objects.map((o) => {
                                        let ratio = item.item.thumb.width / (o.width);
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
                    )}
                    keyExtractor={photo => photo.photo_path}
                />
                {this.state.modalVisible &&
                    <Modal transparent={true} onRequestClose={() => this.setState({ modalVisible: false })}>
                        <ImageViewer
                            imageUrls={photos}
                            index={this.state.imageIndex}
                            enableSwipeDown={true}
                            enableImageZoom={false}
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

    renderMenu(index) {
        if (!this.props.showCrops) {
            return;
        }
        let photos = this.state.photos;
        let photo = photos[index];
        for (object of photo.objects) {
            let cropPath = RNFS.CachesDirectoryPath + '/crop_' + object.id + '.jpg';
            RNFS.exists(cropPath).then((exists) => {
                if (exists) {
                    object.path = cropPath;
                    this.setState({
                        photos: [...photos]
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
                    ImageEditor.cropImage(photo.photo_path, cropData).then(url => {
                        RNFS.moveFile(url, cropPath).catch((err) => {
                            RNFS.unlink(url);
                        }).then(() => {
                            object.path = cropPath;
                            this.setState({
                                photos: [...photos]
                            });
                        });
                    }).catch((err) => {
                        console.log(err);
                    });
                }
            });

            let crop = photo.objects[0];

            return (
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={style.galleryMenu}>
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
                    <Image
                        source={{ uri: crop.path }}
                        style={{ width: thumbWidth, height: 200 }} />
                </View >
            );
        }
    }

    updateObject(object, labelIndex) {
        object.label = object.label_array[labelIndex];
        object.score = object.score_array[labelIndex];
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
