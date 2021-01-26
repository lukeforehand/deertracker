import React from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StyleSheet,
  Modal,
  RefreshControl,
} from 'react-native';

import RNFS from 'react-native-fs';

import ImageResizer from 'react-native-image-resizer';

import style, { screenWidth, screenHeight, thumbWidth, thumbHeight } from './style';

import PhotoGallery from './PhotoGallery';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      photos: []
    };
    let photos = this.props.navigation.getParam('photos');
    this.generateThumbs(photos);
  }

  componentDidUpdate() {
    // compare new image urls to previous
    let photos = this.props.navigation.getParam('photos');
    let newPhotos = photos.filter((photo) => {
      return this.state.photos.indexOf(photo) == -1;
    });
    this.generateThumbs(newPhotos);
  }

  render() {
    const title = this.props.navigation.getParam('title');
    const subTitle = this.props.navigation.getParam('subTitle');
    const photos = this.props.navigation.getParam('photos');
    const showCrops = this.props.navigation.getParam('showCrops');
    return (
      <SafeAreaView>
        <View style={{ alignItems: 'center', marginLeft: 10 }}>
          <Text style={style.t4}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('./assets/images/crosshairs.png')} style={{ marginLeft: 20, width: 30, height: 30 }} />
          <Text style={style.t4}>{subTitle}</Text>
        </View>
        <View>
          <FlatList
            refreshControl={
              <RefreshControl tintColor='transparent' refreshing={false} onRefresh={() => { this.props.navigation.goBack() }} />
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
                    this.setState({ modalVisible: true, imageIndex: item.index });
                  }}>
                  {thumb &&
                    <View>
                      <Image
                        source={{ uri: thumb.uri }}
                        style={{ width: thumb.width, height: thumb.height }} />
                      {showCrops && photo.objects && photo.objects.map((o) => {
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
              <PhotoGallery style={{ height: screenHeight - thumbHeight - 100 }}
                photos={photos}
                imageIndex={this.state.imageIndex}
                onSwipeDown={() => { this.setState({ modalVisible: false }) }}
                showCrops={showCrops} />
            </Modal>
          }
        </View>
      </SafeAreaView>
    );
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

}