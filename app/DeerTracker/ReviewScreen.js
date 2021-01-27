import React from 'react';
import { SafeAreaView } from 'react-native';

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
        <PhotoGallery
          photos={photos}
          showCrops={true}
          onSwipeDown={() => { this.props.navigation.goBack() }}
          onChange={(objectId) => { this.db.updateObjectReview(objectId) }} />
      </SafeAreaView >
    );
  }

}
