import React from 'react';
import {
  Image,
  View,
  Text,
  SafeAreaView
} from 'react-native';

import style, { screenHeight, thumbHeight, headerHeight, footerHeight } from './style';

import PhotoGrid from './PhotoGrid';

export default class PhotoScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const title = this.props.navigation.getParam('title');
    const subTitle = this.props.navigation.getParam('subTitle');
    const photos = this.props.navigation.getParam('photos');
    const showCrops = this.props.navigation.getParam('showCrops');
    return (
      <SafeAreaView>
        <View style={{ height: 80 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={style.t4}>{title}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
            <Text style={style.t4}>{subTitle}</Text>
          </View>
        </View>
        <View style={{ height: screenHeight - 80 - headerHeight - footerHeight }}>
          <PhotoGrid photos={photos} showCrops={showCrops} onRefresh={() => { this.props.navigation.goBack() }} />
        </View>
      </SafeAreaView>
    );
  }

}