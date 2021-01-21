import React from 'react';
import { Text, SafeAreaView } from 'react-native';

import style from './style';

import PhotoGallery from './PhotoGallery';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const title = this.props.navigation.getParam('title');
    const photos = this.props.navigation.getParam('photos');
    const showCrops = this.props.navigation.getParam('showCrops');
    return (
      <SafeAreaView>
        <Text style={style.t3}>{title}</Text>
        <PhotoGallery photos={photos} showCrops={showCrops} />
      </SafeAreaView >
    );
  }

}