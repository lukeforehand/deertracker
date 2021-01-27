import React from 'react';
import {
  Text, SafeAreaView,
} from 'react-native';

import style, { screenWidth, screenHeight, thumbWidth, thumbHeight } from './style';

import PhotoGallery from './PhotoGallery';

export default class ReviewScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const photos = this.props.navigation.getParam('photos');
    return (
      <SafeAreaView>
        <PhotoGallery style={{ height: screenHeight - thumbHeight - 100 }}
          photos={photos}
          onSwipeDown={() => { this.props.navigation.goBack() }}
          showCrops={true} />
      </SafeAreaView >
    );
  }

}
