import React from 'react';
import {
  Text, SafeAreaView,
} from 'react-native';

import style, { screenWidth, screenHeight, thumbWidth, thumbHeight } from './style';

import Database from './Database';

import PhotoGallery from './PhotoGallery';

export default class ReviewScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
  }

  render() {
    const photos = this.props.navigation.getParam('photos');
    this.db.updateObjectReview(photos[0].objects[0].id);
    return (
      <SafeAreaView>
        <PhotoGallery style={{ height: screenHeight - thumbHeight - 100 }}
          photos={photos}
          onSwipeDown={() => { this.props.navigation.goBack() }}
          onChange={(objectId) => { this.db.updateObjectReview(objectId) }}
          showCrops={true} />
      </SafeAreaView >
    );
  }

}
