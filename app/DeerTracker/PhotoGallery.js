import React from 'react';
import {
  Modal,
  View,
  FlatList,
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
    this.state = { modalVisible: false, thumbUrls: [] };
  }

  componentDidMount() {
    // FIXME: this only gets called once and the child thumbUrls does not update!
    let imageUrls = this.props.imageUrls;
    imageUrls.map((imageUrl) => {
      ImageResizer.createResizedImage(imageUrl.url, thumbWidth, thumbHeight, 'JPEG', 50, 0).then((thumb) => {
        this.setState((prevState) => ({
          thumbUrls: prevState.thumbUrls.concat([thumb])
        }));
      });
    });
  }

  render() {

    const imageUrls = this.props.imageUrls;

    return (
      <View>
        <View style={{ alignItems: 'center' }}>
          <FlatList
            style={{ height: '100%', width: '100%' }}
            contentContainerStyle={{ alignItems: 'center' }}
            numColumns={2}
            data={this.state.thumbUrls}
            renderItem={(item) => (
              <TouchableOpacity onPress={() => {
                this.setState({ modalVisible: true, imageIndex: item.index })
              }}>
                <Image
                  source={{ uri: this.state.thumbUrls[item.index].uri }}
                  style={style.thumbnail} />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.uri}
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