import React from 'react';
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';

import ImageResizer from 'react-native-image-resizer';

import ImageViewer from 'react-native-image-zoom-viewer';

import { thumbWidth, thumbHeight } from './style';

export default class PhotoGallery extends React.Component {

  constructor(props) {
    super(props);
    let photos = this.props.photos.map((photo) => {
      photo.url = photo.photo_path;
      return photo;
    });
    this.state = { modalVisible: false, photos: photos };
    this.generateThumbs(this.state.photos);
  }

  generateThumbs(photos) {
    // generate thumbnails for image urls
    photos.map((photo) => {
      let w = thumbWidth;
      let h = thumbHeight;
      if (photo.width && photo.height) {
        let scale = w / photo.width;
        h = scale * photo.height;
      }
      ImageResizer.createResizedImage(photo.photo_path, w, h, 'JPEG', 50, 0, null, false,
        { mode: 'cover' }).then((thumb) => {
          photo.thumb = thumb;
          photos[photos.indexOf(photo)] = photo;
          this.setState({
            photos: [...photos]
          });
        }).catch((err) => {
          console.log(err);
        })
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
                  {item.item.objects && item.item.objects.map((o) => {
                    let ratio = item.item.thumb.width / (o.width);
                    return (
                      <View key={o.id} style={{
                        ...StyleSheet.absoluteFillObject,
                        left: parseInt(o.x * ratio),
                        top: parseInt(o.y * ratio),
                        width: parseInt(o.w * ratio),
                        height: parseInt(o.h * ratio),
                        borderWidth: 2,
                        borderColor: 'rgba(0,255,0,0.7)'
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
              swipeDownThreshold={80}
              onSwipeDown={() => { this.setState({ modalVisible: false }) }}
            />
          </Modal>
        }
      </View>
    );
  }

}