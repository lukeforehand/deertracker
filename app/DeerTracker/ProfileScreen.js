import React from 'react';
import {
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Text,
  StyleSheet,
  RefreshControl,
  View,
  ScrollView,
  Image
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import RNFS from 'react-native-fs';
import ImageEditor from "@react-native-community/image-editor";
import Swiper from 'react-native-swiper';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Moment from 'moment';

import MoonPhase from './MoonPhase';

import { ContributionGraph, PieChart, BarChart } from "react-native-chart-kit";

import PhotoGrid from './PhotoGrid';
import Database from './Database';

import style, { screenHeight, screenWidth, thumbWidth, headerHeight, footerHeight } from './style';

const moon = new MoonPhase();
const root = RNFS.DocumentDirectoryPath;

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

    let crop = profile.crop;
    let photos = profile.objects;

    let latest = photos[0];
    let moonImage = moon.image(latest.moon_phase);

    const chartConfig = {
      barPercentage: 0.75,
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
            <Text style={style.t4}>{latest.profile_name}</Text>
          </View>
        </View>
        <View style={{ height: screenHeight - 40 - headerHeight - footerHeight }}>
          <Swiper loop={true} dot={(<View />)} activeDot={(<View />)}>
            <ScrollView
              refreshControl={
                <RefreshControl tintColor='transparent' refreshing={false} onRefresh={() => { this.props.navigation.goBack() }} />
              }>
              <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri: crop.profile_path }} style={{ width: crop.profile_width, height: crop.profile_height }} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon style={{ paddingLeft: 15 }} name='eye' color='black' size={18} />
                  <Text style={style.t5}>{photos.length} Sightings</Text>
                </View>
                <View style={{ flexDirection: 'row', marginLeft: 20, marginRight: 20, alignItems: 'center' }}>
                  <Text style={[style.t5, { flex: 1 }]}>Last seen {Moment(new Date() - Moment(latest.time).utc()).format('D')} days ago at {latest.location_name} on {Moment(latest.time).format('dddd')} {Moment(latest.time).format('A') === 'AM' ? 'Before Noon' : 'After Noon'} during a {latest.moon_phase}</Text>
                  <Image style={[style.moon, { width: 100, height: 100 }]} source={moonImage} />
                </View>
                <Text style={style.t5}>Best chance at {profile.stats.all[0].location} on {profile.stats.all[0].weekday} {profile.stats.all[0].ampm} during a {profile.stats.all[0].moon_phase}</Text>
              </View>
              {/*
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
                    color: (opacity = 1) => `rgba(255, 103, 0, ${isNaN(opacity) ? 1 / 2 : opacity})`
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    borderRadius: 10
                  }}
                />
              </View>
                */}
              <View style={{ alignItems: 'center' }}>
                <Text>Week Day</Text>
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
                    paddingRight: 0
                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text>Time of Day</Text>
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
                  width={screenWidth - 10}
                  height={100}
                  chartConfig={chartConfig}
                  accessor={'count'}
                  center={[30, 0]}
                  style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    borderRadius: 10,
                    paddingRight: 0

                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text>Location</Text>
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
                    paddingRight: 0
                  }}
                />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text>Moon Phase</Text>
                <View style={{ flexDirection: 'row' }}>
                  {profile.stats.moon.map((m) => {
                    let moonLabel = moon.image(m.moon_phase);
                    return (
                      <Image key={m.moon_phase} style={[style.moon, { width: (screenWidth - 10) / 8, height: (screenWidth - 10) / 8 }]} source={moonLabel} />
                    );
                  })}
                </View>
                <BarChart
                  data={{
                    labels: profile.stats.moon.map((m) => m.label),
                    datasets: [{ data: profile.stats.moon.map((m) => (m.cnt)) }]
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
                    paddingRight: 0
                  }}
                />
              </View>
            </ScrollView>
            <View>
              <PhotoGrid photos={photos} showCrops={true} onRefresh={() => { this.props.navigation.goBack() }} />
            </View>
            <View style={style.container}>
              {this.state.region &&
                <MapView
                  ref={ref => { this.map = ref; }}
                  style={{ ...StyleSheet.absoluteFillObject }}
                  showsUserLocation={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  mapType="satellite"
                  initialRegion={this.state.region}
                  onMapReady={() => {
                    if (profile.stats.location.length > 1) {
                      this.map.fitToCoordinates(
                        profile.stats.location.map(location => ({ latitude: location.lat, longitude: location.lon })),
                        { edgePadding: { top: 120, right: 120, bottom: 120, left: 120 }, animated: true })
                    } else {
                      let location = profile.stats.location[0];
                      this.map.animateCamera({ center: { latitude: location.lat, longitude: location.lon } });
                    }
                  }}>
                  {profile.stats.location.map((location) => {
                    let red = Math.max(100, 255 * (location.cnt / 6));
                    return (<Marker key={location.location}
                      coordinate={{ latitude: location.lat, longitude: location.lon }}>
                      <View>
                        <View style={[style.sightingMarker, {
                          borderColor: `rgb(${red}, 103, 0)`,
                          backgroundColor: `rgba(${red}, 103, 0, 0.6)`,
                        }]} />
                        <View style={style.markerContainer}>
                          <View style={{ flexDirection: 'row' }}>
                            <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
                            <Text style={style.markerLabel}>{location.location}</Text>
                          </View>
                          <Text style={[style.markerLabel, { left: 7 }]}>{location.cnt}</Text>
                        </View>
                      </View>
                    </Marker>);
                  })}
                </MapView>
              }
            </View>
          </Swiper>
        </View>
      </SafeAreaView >
    );
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    let profile = this.state.profile;
    let statsPromise = null;
    if (profile.type === 'class') {
      statsPromise = this.db.selectClassStats(profile.objects[0].profile_id);
    } else {
      statsPromise = this.db.selectProfileStats(profile.objects[0].profile_id);
    }
    statsPromise.then((stats) => {
      profile.stats = stats;
      let location = profile.stats.location[0];

      let ASPECT_RATIO = screenWidth / screenHeight;
      let LATITUDE_DELTA = 0.001;
      let LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

      this.setState({
        region: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        }
      });

      profile.crop = profile.objects[0];
      let crop = profile.crop;
      let cropPath = RNFS.CachesDirectoryPath + '/profile_' + crop.id + '.jpg';
      let max = Math.max(crop.w, crop.h);
      let w = (screenWidth / max) * crop.w;
      let h = (screenWidth / max) * crop.h;
      let cropData = {
        offset: { x: crop.x, y: crop.y },
        size: { width: crop.w, height: crop.h },
        displaySize: { width: crop.w, height: crop.h }
      };

      crop.profile_path = cropPath;
      crop.profile_width = w;
      crop.profile_height = Math.min(w, h);

      RNFS.exists(cropPath).then((exists) => {
        if (!exists) {
          ImageEditor.cropImage(root + '/' + crop.photo_path, cropData).then(url => {
            RNFS.moveFile(url, cropPath).catch((err) => {
              RNFS.unlink(url);
            }).then(() => {
              this.setState({
                isLoading: false,
                profile: profile
              });
            });
          }).catch((err) => {
            console.log(err);
          });
        } else {
          this.setState({
            isLoading: false,
            profile: profile
          });
        }
      }).catch((error) => {
        console.log(error);
      });
    });
  }
}