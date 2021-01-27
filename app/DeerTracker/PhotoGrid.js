import React from 'react';
import {
  Image,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import RNFS from 'react-native-fs';

import ImageResizer from 'react-native-image-resizer';

import PhotoGallery from './PhotoGallery';

import { screenHeight, thumbWidth, thumbHeight } from './style';

export default class PhotoGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      photos: this.props.photos
    };
    this.generateThumbs(this.state.photos);
  }

  render() {
    const photos = this.state.photos;
    const showCrops = this.props.showCrops;
    return (
      <View>
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
    );
  }

  generateThumbs(photos) {
    photos.map((photo) => {
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