import React from 'react';
import {
    Alert,
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
    StyleSheet,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import CameraRoll from "@react-native-community/cameraroll";
import Swiper from 'react-native-swiper'

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import ImageViewer from 'react-native-image-zoom-viewer';

import Moment from 'moment';

import Database from './Database';
import style, { screenWidth, screenHeight, thumbWidth, thumbHeight, headerHeight } from './style';

const detectorUrl = "http://192.168.1.3:5000";

export default class PhotoGallery extends React.Component {

    constructor(props) {
        super(props);
        this.db = new Database();
        this.swiper = React.createRef();
        this.state = {
            imageIndex: props.imageIndex ? props.imageIndex : 0,
            profileVisible: false,
            saveProfileVisible: false,
            saveToCameraVisible: false
        };
    }

    componentDidMount() {
        this.fetchData();
        if (this.props.showCrops) {
            this.generateCrop(this.props.photos[this.state.imageIndex].objects[0]);
        }
    }

    render() {
        const photos = this.props.photos;
        const imageIndex = this.state.imageIndex;
        return (
            <Modal visible={true} transparent={true}>
                <ImageViewer
                    imageUrls={photos}
                    index={imageIndex}
                    enableSwipeDown={true}
                    enableImageZoom={false}
                    renderImage={this.renderImage.bind(this)}
                    onChange={(index) => {
                        if (this.props.showCrops) {
                            let photo = photos[index];
                            this.setState({ imageIndex: index });
                            this.generateCrop(photo.objects[0]);
                            if (this.props.onChange) {
                                this.props.onChange(photo.objects[0].id);
                            }
                        }
                    }}
                    renderFooter={this.renderMenu.bind(this)}
                    swipeDownThreshold={80}
                    onSwipeDown={this.props.onSwipeDown}
                    menus={({ cancel, saveToLocal }) => {
                        return (
                            <View style={{ height: screenHeight }}>
                                <Modal
                                    animationType='slide'
                                    transparent={true}>

                                    <TouchableOpacity style={style.saveToCameraButton} onPress={() => {
                                        CameraRoll.save(photos[imageIndex].photo_path).then(() => cancel());
                                    }}>
                                        <Text style={style.h1}>Save to Camera Roll</Text>
                                    </TouchableOpacity>

                                    <TouchableWithoutFeedback onPress={() => { cancel() }}>
                                        <View style={{ flex: 1 }} />
                                    </TouchableWithoutFeedback>
                                </Modal>
                            </View>
                        );
                    }}
                />
            </Modal>
        );
    }

    renderImage(props) {
        let photo = props.photo;
        let time = photo.time ? Moment(photo.time).format('ddd, MMM Do YYYY hh:mm A') : ""
        let top = 0;
        let titleHeight = 40;
        props.style.top = -titleHeight;
        if (this.props.showCrops) {
            top = -photo.height * (screenWidth / photo.width) / 2 + titleHeight;
        }
        return (
            <View style={{ top: top }}>
                <View style={{ top: props.style.top }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={require('./assets/images/crosshairs.png')}
                            style={{ width: 15, height: 15 }} />
                        <Text style={style.t7}>{photo.location_name}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={style.t7}>{time}</Text>
                    </View>
                </View>
                <Image {...props} />
                {this.props.showCrops && photo.objects.map((object) => {
                    let borderColor = photo.objects.length > 1 ? 'green' : 'rgb(255, 103, 0)';
                    if (this.state.crop && this.state.crop.id == object.id) {
                        borderColor = 'rgb(255, 103, 0)'
                    }
                    let ratio = screenWidth / photo.width;
                    return (
                        <TouchableOpacity
                            key={object.id}
                            onPress={() => { this.swiper.current.scrollTo(photo.objects.indexOf(object) - this.swiper.current.state.index) }}
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                left: parseInt(object.x * ratio),
                                top: parseInt(object.y * ratio),
                                width: parseInt(object.w * ratio),
                                height: parseInt(object.h * ratio),
                                borderWidth: 1,
                                borderColor: borderColor,
                            }} />
                    );
                })}
            </View >
        );
    }

    renderMenu(index) {
        if (!this.props.showCrops || !this.state.profiles) {
            return;
        }
        let photo = this.props.photos[index];
        let crops = photo.objects;
        if (crops.length > 0) {
            return (
                <View style={{ height: 280 }}>
                    <Swiper loop={false} dot={<View />} activeDot={<View />}
                        ref={this.swiper}
                        onIndexChanged={(nextIndex) => { this.generateCrop(crops[nextIndex]) }}>
                        {crops.map((crop) => {
                            let max = Math.max(crop.w, crop.h);
                            let w = (thumbWidth / max) * crop.w;
                            let h = (180 / max) * crop.h;
                            let profiles = this.state.profiles;
                            let selectedProfile = this.state.selectedProfile;
                            return (
                                <View key={crop.id}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={style.galleryMenu}>
                                            <Text style={style.t6}>Pick class</Text>
                                            <Picker
                                                selectedValue={crop.label}
                                                style={style.picker}
                                                itemStyle={[style.h1, { height: h }]}
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
                                            {crop.profile_name &&
                                                <Text style={[style.h4, { paddingTop: 10 }]}>{crop.profile_name}</Text>
                                            }
                                        </View>
                                        <Modal
                                            animationType='slide'
                                            transparent={true}
                                            visible={this.state.profileVisible}>
                                            <View style={style.profileModal}>
                                                <Text style={style.h5}>Select Profile</Text>
                                                <Picker selectedValue={selectedProfile}
                                                    style={{ height: 200 }}
                                                    itemStyle={style.t2}
                                                    onValueChange={(itemValue, itemIndex) => {
                                                        if (itemIndex > 0) {
                                                            this.updateProfile(crop, profiles[itemIndex - 1])
                                                        }
                                                    }}>
                                                    <Picker.Item key='-1' label='Select Profile' value='-1' />
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
                                                <TouchableWithoutFeedback onPress={() => { this.setState({ saveProfileVisible: false, profileVisible: false }) }}>
                                                    <View style={{ flex: 1 }} />
                                                </TouchableWithoutFeedback>
                                            </Modal>
                                        </Modal>
                                    </View>
                                    <View style={{ height: 15 }} />
                                    <TouchableOpacity style={style.galleryButton}
                                        onPress={() => { this.setState({ selectedProfile: crop.profile_id, profileVisible: true }) }}>
                                        <Text style={style.h1}>Profile</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        })}
                    </Swiper>
                </View >
            )
        }
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
                ImageEditor.cropImage(object.photo_path, cropData).then(url => {
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

    updateProfile(crop, profile) {
        if (profile) {
            this.db.updateObjectProfile(crop.id, profile.id).then(() => {
                crop.profile_name = profile.name;
                crop.profile_id = profile.id;
                this.setState({
                    profileVisible: false,
                    saveProfileVisible: false,
                    crop: crop
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
                this.fetchData();
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
