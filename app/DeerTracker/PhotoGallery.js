import React from 'react';
import {
  Modal,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';

import ImageResizer from 'react-native-image-resizer';

import ImageViewer from 'react-native-image-zoom-viewer';

import style from './style';
import { thumbWidth, thumbHeight } from './style';

export default class PhotoGallery extends React.Component {

  constructor(props) {
    super(props);
    this.state = { modalVisible: false, imageUrls: [] };
    this.generateThumbs(props);
  }

  componentDidUpdate() {
    this.generateThumbs(this.props);
  }

  generateThumbs(nextProps) {
    // compare new image urls to previous
    let newImageUrls = nextProps.imageUrls.filter((imageUrl) => {
      return this.state.imageUrls.indexOf(imageUrl) == -1;
    });
    // generate thumbnails for new image urls
    let imageUrls = nextProps.imageUrls;
    newImageUrls.map((newImageUrl) => {
      ImageResizer.createResizedImage(newImageUrl.url, thumbWidth, thumbHeight, 'JPEG', 50, 0).then((newThumbUrl) => {
        imageUrls[imageUrls.indexOf(newImageUrl)].thumbUrl = newThumbUrl.uri;
        this.setState({
          imageUrls: imageUrls
        });
      });
    });
  }

  render() {
    const imageUrls = this.state.imageUrls;
    return (
      <View>
        <View style={{ alignItems: 'center' }}>
          <FlatList
            style={{ height: '100%', width: '100%' }}
            contentContainerStyle={{ alignItems: 'center' }}
            numColumns={2}
            data={imageUrls}
            renderItem={(item) => (
              <TouchableOpacity onPress={() => {
                this.setState({ modalVisible: true, imageIndex: imageUrls.indexOf(item.item) })
              }}>
                <Image
                  source={{ uri: imageUrls[imageUrls.indexOf(item.item)].thumbUrl }}
                  style={style.thumbnail} />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.url}
          />
        </View>
        <Modal visible={this.state.modalVisible} transparent={true}>
          <ImageViewer
            imageUrls={imageUrls}
            index={this.state.imageIndex}
            enableSwipeDown={true}
            swipeDownThreshold={80}
            onSwipeDown={() => { this.setState({ modalVisible: false }) }}
          />
        </Modal>
      </View >
    );
  }

}