import React from 'react';
import { SafeAreaView } from 'react-native';

import PhotoGallery from './PhotoGallery';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const photos = this.props.navigation.getParam('photos');
    return (
      <SafeAreaView style={{ marginTop: 20 }}>
        <PhotoGallery photos={photos} />
      </SafeAreaView >
    );
  }

}