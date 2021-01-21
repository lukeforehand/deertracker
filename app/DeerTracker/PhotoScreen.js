import React from 'react';
import { Text, SafeAreaView } from 'react-native';

import style from './style';

import PhotoGallery from './PhotoGallery';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const photos = this.props.navigation.getParam('photos');
    return (
      <SafeAreaView>
        <Text style={style.t3}>{this.props.navigation.getParam('title')}</Text>
        <PhotoGallery photos={photos} />
      </SafeAreaView >
    );
  }

}