import React from 'react';
import {
    Alert,
    Modal,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
    RefreshControl,
    StyleSheet,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import ImageResizer from 'react-native-image-resizer';
import ImageViewer from 'react-native-image-zoom-viewer';

import Moment from 'moment';

import Database from './Database';
import style, { screenWidth, screenHeight, thumbWidth, thumbHeight } from './style';

const root = RNFS.DocumentDirectoryPath;

const detectorUrl = "http://192.168.0.157:5000";

export default class PhotoGallery extends React.Component {

    constructor(props) {
        super(props);
        this.db = new Database();
        this.state = { modalVisible: false, profileVisible: false, saveProfileVisible: false, photos: [] };
        this.generateThumbs(props.photos);
    }

    componentDidMount() {
        this.fetchData();
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
                photo: photo
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
            <View style={this.props.style}>
                <FlatList
                    refreshControl={
                        <RefreshControl tintColor='transparent' refreshing={false} onRefresh={this.props.onRefresh} />
                    }
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
                                    if (this.props.showCrops) {
                                        this.generateCrop(photos[item.index].objects[0]);
                                    }
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
                                                    borderColor: 'rgb(255, 103, 0)'
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
                            onChange={(index) => { this.props.showCrops && this.generateCrop(photos[index].objects[0]) }}
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
        let time = photo.time ? Moment(photo.time).format('ddd, MMM Do YYYY hh:mm A') : ""
        let top = this.props.showCrops ? - screenHeight / 4 : 0;
        props.style.top = top;
        return (
            <View>
                <Image {...props} />
                <View style={{ top: top }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={require('./assets/images/crosshairs.png')}
                            style={{ width: 15, height: 15 }} />
                        <Text style={style.t7}>{photo.location_name}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={style.t7}>{time}</Text>
                    </View>
                </View>
                {this.props.showCrops && photo.objects.map((object) => {
                    let borderColor = 'green';
                    if (!this.props.showCrops || (this.state.crop && this.state.crop.id == object.id)) {
                        borderColor = 'rgb(255, 103, 0)'
                    }
                    return (
                        <TouchableOpacity
                            key={object.id}
                            onPress={() => { this.generateCrop(object) }}
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                left: parseInt(object.x * ratio),
                                top: parseInt(object.y * ratio) - screenHeight / 4,
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
            let profiles = this.state.profiles;
            let selectedProfile = this.state.selectedProfile;
            return (
                <View style={{ height: screenHeight / 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={style.galleryMenu}>
                            <Text style={style.t6}>Pick class</Text>
                            <Picker
                                selectedValue={crop.label}
                                style={style.picker}
                                itemStyle={[style.pickerItem, { height: h }]}
                                onValueChange={(itemValue, itemIndex) => { this.updateObject(crop, itemIndex) }}>
                                {crop.label_array.map((label) => {
                                    return (<Picker.Item key={label} label={label} value={label} />);
                                })}
                            </Picker>
                        </View>
                        <View style={{ width: thumbWidth, alignItems: 'center' }}>
                            <Image
                                source={{ uri: crop.path }}
                                style={{ width: w, height: h, borderWidth: 1, borderColor: 'rgb(255, 103, 0)' }} />
                            <Text style={style.h1}>{crop.profile_name}</Text>
                        </View>
                        <Modal
                            animationType='slide'
                            transparent={true}
                            visible={this.state.profileVisible}>
                            <View style={style.profileModal}>
                                <Text style={style.h3}>Select Profile</Text>
                                <Picker selectedValue={selectedProfile}
                                    onValueChange={(itemValue, itemIndex) => {
                                        if (itemIndex > 0) {
                                            this.updateProfile(crop, profiles[itemIndex - 1])
                                        }
                                    }}>
                                    <Picker.Item key='-1' label='' value='-1' />
                                    {profiles.map((p) => {
                                        return (<Picker.Item key={p.id} label={p.name} value={p.id} />);
                                    })}
                                    <Picker.Item key='' label='Add Profile' value='' />
                                </Picker>
                            </View>
                            <TouchableWithoutFeedback onPress={() => { this.setState({ profileVisible: false }) }}>
                                <View style={{ flex: 1 }} />
                            </TouchableWithoutFeedback>
                            <Modal
                                animationType='slide'
                                transparent={true}
                                onShow={() => { this.profileModal.focus(); }}
                                visible={this.state.saveProfileVisible}>
                                <View style={style.saveProfileModal}>
                                    <TextInput
                                        style={style.t2}
                                        ref={ref => { this.profileModal = ref; }}
                                        onChangeText={(text) => { this.setState({ profile: text }) }}
                                        selectTextOnFocus={true}
                                        defaultValue='Enter profile name' />
                                    <TouchableOpacity style={style.button} onPress={this.saveProfile.bind(this)}>
                                        <Text style={style.h1}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableWithoutFeedback onPress={() => { this.setState({ saveProfileVisible: false }) }}>
                                    <View style={{ flex: 1 }} />
                                </TouchableWithoutFeedback>
                            </Modal>
                        </Modal>
                    </View>
                    <TouchableOpacity style={style.galleryButton}
                        onPress={() => { this.setState({ selectedProfile: crop.profile_id, profileVisible: true }) }}>
                        <Text style={style.h1}>Profile</Text>
                    </TouchableOpacity>
                </View >
            );
        }
    }

    updateProfile(crop, profile) {
        if (profile) {
            this.db.updateObjectProfile(crop.id, profile.id).then((rs) => {
                crop.profile_name = profile.name;
                crop.profile_id = profile.id;
                this.setState({
                    profileVisible: false,
                    crop: Object.assign({}, crop)
                });
            }).catch((error) => {
                console.log(error);
            });
        } else {
            this.setState({
                selectedProfile: '',
                saveProfileVisible: true
            });
        }
    }

    saveProfile() {
        let crop = this.state.crop;
        let profile = this.state.profile;
        if (profile && profile.length > 0 && profile != 'Enter profile name') {
            this.db.insertProfile(crop.id, profile).then((rs) => {
                let profileId = rs[0]['insertId'];
                this.updateProfile(crop, { id: profileId, name: profile });
            }).catch((error) => {
                console.log(error);
                if (error.code && error.code == 6) {
                    Alert.alert('That name already exists');
                }
            });
        } else {
            Alert.alert('Enter profile name');
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

    fetchData() {
        this.db.selectProfiles().then((profiles) => {
            this.setState({
                isLoading: false,
                profiles: profiles
            });
        }).catch((error) => {
            console.log(error);
        });
    }
}
