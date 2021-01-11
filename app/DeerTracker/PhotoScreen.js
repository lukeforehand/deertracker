import React from 'react';
import { SafeAreaView } from 'react-native';

import PhotoGallery from './PhotoGallery';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const imageUrls = this.props.navigation.getParam('imageUrls');
    return (
      <SafeAreaView style={{ marginTop: 20 }}>
        <PhotoGallery imageUrls={imageUrls} />
      </SafeAreaView >
    );
  }

}