import React from 'react';
import {
  Image,
  View,
  Text,
  SafeAreaView
} from 'react-native';

import style from './style';

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
        <View style={{ alignItems: 'center', marginLeft: 10 }}>
          <Text style={style.t4}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('./assets/images/crosshairs.png')} style={{ marginLeft: 20, width: 30, height: 30 }} />
          <Text style={style.t4}>{subTitle}</Text>
        </View>
        <View>
          <PhotoGrid photos={photos} showCrops={showCrops} onRefresh={() => { this.props.navigation.goBack() }} />
        </View>
      </SafeAreaView>
    );
  }

}