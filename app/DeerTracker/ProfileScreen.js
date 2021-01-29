import React from 'react';
import {
  SafeAreaView,
  Text,
  View,
  Image
} from 'react-native';

import RNFS from 'react-native-fs';

import Swiper from 'react-native-swiper'
import PhotoGrid from './PhotoGrid';

import MoonPhase from './MoonPhase';
import Database from './Database';

import style, { screenHeight, screenWidth, thumbWidth, headerHeight, footerHeight } from './style';

const root = RNFS.DocumentDirectoryPath;

const moon = new MoonPhase();

export default class ProfileScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
  }

  render() {
    const profile = this.props.navigation.getParam('profile');
    let photos = profile.objects.map((photo) => {
      photo.photo_path = root + '/' + photo.photo_path;
      photo.url = photo.photo_path;
      photo.props = {
        photo: photo
      };
      photo.objects = [photo];
      return photo;
    });

    let crop = photos[0];
    let max = Math.max(crop.w, crop.h);
    let w = (screenWidth / max) * crop.w;
    let h = (140 / max) * crop.h;

    return (
      <SafeAreaView>
        <View style={{ height: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
            <Text style={style.t4}>{photos[0].profile_name}</Text>
          </View>
        </View>
        <View style={{ height: screenHeight - 40 - headerHeight - footerHeight }}>
          <Swiper showsButtons={true} loop={true} activeDotColor='rgb(255, 103, 0)' dotColor='#4E603E'>
            <View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri: crop.path }} style={{ width: w, height: h }} />
                </View>
              </View>
            </View>
            <View>
              <View>
                <PhotoGrid photos={photos} showCrops={true} onRefresh={() => { this.props.navigation.goBack() }} />
              </View>
            </View>
          </Swiper>
        </View>
      </SafeAreaView>
    );
  }

}