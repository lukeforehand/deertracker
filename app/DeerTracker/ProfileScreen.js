import React from 'react';
import {
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Text,
  RefreshControl,
  View,
  ScrollView,
  Image
} from 'react-native';

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import Swiper from 'react-native-swiper';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Moment from 'moment';

import { ContributionGraph, PieChart, BarChart } from "react-native-chart-kit";

import PhotoGrid from './PhotoGrid';
import MoonPhase from './MoonPhase';
import Database from './Database';

import style, { screenHeight, screenWidth, thumbWidth, headerHeight, footerHeight } from './style';

const root = RNFS.DocumentDirectoryPath;

// TODO: use this
//const moon = new MoonPhase();

export default class ProfileScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = {
      isLoading: true,
      profile: props.navigation.getParam('profile')
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  refreshing() {
    return this.state.isLoading;
  }

  render() {

    if (this.refreshing()) {
      return (
        <SafeAreaView>
          <View style={style.activity}>
            <ActivityIndicator size='large' />
          </View>
        </SafeAreaView>
      )
    }

    const profile = this.state.profile;

    let photos = profile.objects.map((photo) => {
      photo.photo_path = root + '/' + photo.photo_path;
      photo.url = photo.photo_path;
      photo.props = {
        photo: photo
      };
      photo.objects = [photo];
      return photo;
    });

    let crop = this.state.crop;

    const chartConfig = {
      fillShadowGradientOpacity: 1,
      fillShadowGradient: 'rgb(255, 103, 0)',
      backgroundGradientFrom: 'white',
      backgroundGradientFromOpacity: 0.0,
      backgroundGradientTo: 'black',
      backgroundGradientToOpacity: 0.2,
      decimalPlaces: 0,
      color: (opacity = 1) => '#4E603E',
      labelColor: (opacity = 1) => 'black'
    };

    return (
      <SafeAreaView>
        <View style={{ height: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
            <Text style={style.t4}>{photos[0].profile_name}</Text>
          </View>
        </View>
        <View style={{ height: screenHeight - 40 - headerHeight - footerHeight }}>
          <Swiper loop={true} dot={(<View />)} activeDot={(<View />)}>
            <ScrollView
              refreshControl={
                <RefreshControl tintColor='transparent' refreshing={false} onRefresh={() => { this.props.navigation.goBack() }} />
              }>
              <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri: crop.path }} style={{ width: crop.width, height: crop.height }} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Icon style={{ paddingLeft: 15 }} name='eye' color='black' size={18} />
                  <Text style={style.t5}>{profile.objects.length} Sightings</Text>
                </View>
                <Text style={style.t5}>Last seen {Moment(new Date() - Moment(photos[0].time)).format('D')} days ago</Text>
                <Text style={style.t5}>Best chance at {profile.stats.all[0].location} on {profile.stats.all[0].weekday} {profile.stats.all[0].ampm}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ContributionGraph
                  values={profile.stats.days}
                  endDate={new Date()}
                  numDays={105}
                  width={screenWidth - 10}
                  height={220}
                  onDayPress={(value) => { value.count > 0 ? Alert.alert(value.count + ' sightings on ' + value.date) : null }}
                  chartConfig={{
                    backgroundGradientFrom: 'white',
                    backgroundGradientFromOpacity: 0.0,
                    backgroundGradientTo: 'black',
                    backgroundGradientToOpacity: 0.2,
                    color: (opacity = 1) => `rgba(255, 103, 0, ${opacity})`
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    borderRadius: 10
                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <BarChart
                  data={{
                    labels: profile.stats.weekday.map((w) => w.weekday),
                    datasets: [{ data: profile.stats.weekday.map((w) => (w.cnt)) }]
                  }}
                  fromZero={true}
                  height={200}
                  width={screenWidth - 10}
                  chartConfig={chartConfig}
                  withHorizontalLabels={false}
                  showValuesOnTopOfBars={true}
                  withInnerLines={false}
                  style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    borderRadius: 10,
                    paddingRight: -5
                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <PieChart
                  data={profile.stats.ampm.map((x) => {
                    return {
                      name: x.ampm,
                      count: x.cnt,
                      color: x.ampm === profile.stats.ampm[0].ampm ? 'rgb(255, 103, 0)' : '#4E603E',
                      legendFontColor: 'black',
                      legendFontSize: 14
                    }
                  })}
                  width={screenWidth}
                  height={100}
                  chartConfig={chartConfig}
                  accessor={'count'}
                  center={[30, 0]}
                  style={{
                    marginRight: 40
                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <BarChart
                  data={{
                    labels: profile.stats.location.map((w) => w.location),
                    datasets: [{ data: profile.stats.location.map((w) => (w.cnt)) }]
                  }}
                  fromZero={true}
                  height={200}
                  width={screenWidth - 10}
                  chartConfig={chartConfig}
                  withHorizontalLabels={false}
                  showValuesOnTopOfBars={true}
                  withInnerLines={false}
                  style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    borderRadius: 10,
                    paddingRight: -5
                  }}
                />
              </View>
            </ScrollView>
            <View>
              <View>
                <PhotoGrid photos={photos} showCrops={true} onRefresh={() => { this.props.navigation.goBack() }} />
              </View>
            </View>
          </Swiper>
        </View>
      </SafeAreaView >
    );
  }

  fetchData() {
    let profile = this.state.profile;
    this.setState({
      isLoading: true
    });
    this.db.selectProfileStats(profile.objects[0].profile_id).then((stats) => {
      profile.stats = stats;
      let crop = profile.objects[0];
      let w = screenWidth;
      let h = (screenWidth / crop.w) * crop.h;
      let cropData = {
        offset: { x: crop.x, y: crop.y },
        size: { width: crop.w, height: Math.min(crop.w, crop.h) },
        displaySize: { width: w, height: Math.min(w, h) }
      };
      let cropPath = RNFS.CachesDirectoryPath + '/profile_' + crop.id + '.jpg';
      RNFS.exists(cropPath).then((exists) => {
        if (exists) {
          crop.path = cropPath;
          crop.width = w;
          crop.height = Math.min(w, h);
          this.setState({
            isLoading: false,
            crop: crop,
            profile: profile
          });
        } else {
          ImageEditor.cropImage(root + '/' + crop.photo_path, cropData).then(url => {
            RNFS.moveFile(url, cropPath).catch((err) => {
              RNFS.unlink(url);
            }).then(() => {
              crop.path = cropPath;
              crop.width = w;
              crop.height = Math.min(w, h);
              this.setState({
                isLoading: false,
                crop: crop,
                profile: profile
              });
            });
          }).catch((err) => {
            console.log(err);
          });
        }
      }).catch((error) => {
        console.log(error);
      });
    });
  }
}