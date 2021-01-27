import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
  RefreshControl
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import RNFS from 'react-native-fs';

import Moment from 'moment';

import MoonPhase from './MoonPhase';
import Database from './Database';

import style from './style';
import { screenHeight, thumbWidth, thumbHeight } from './style';

const root = RNFS.DocumentDirectoryPath;

const moon = new MoonPhase();

export default class SightingScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, newSightings: 0 }
  }

  componentDidMount() {
    this.fetchData();
  }

  refreshing() {
    return this.state.isLoading;
  }

  render() {

    const objects = this.state.objects;

    if (!objects) {
      return (
        <SafeAreaView>
          <View style={style.activity}>
            <ActivityIndicator size='large' />
          </View>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView>
        <ScrollView style={{ height: screenHeight - thumbHeight }} refreshControl={
          <RefreshControl
            title='Refresh'
            titleColor='black'
            tintColor='black'
            refreshing={this.refreshing()} onRefresh={this.fetchData.bind(this)} />
        }>
          {Object.keys(objects).length <= 0 &&
            <Text style={style.t3}>No sightings, pull down to refresh</Text>
          }
          {Object.keys(objects).sort().reverse().map((day) => {
            let date = new Date(day);
            let phase = moon.phase(date);
            let moonImage = moon.image(phase);
            return (
              <View key={day}>
                <View style={[style.locationButton, style.h3, { paddingTop: 0, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={style.h4}>
                    {Moment(date).format('ddd, MMM Do YYYY')}
                  </Text>
                  <Image style={{ width: 45, height: 45 }} source={moonImage} />
                </View>
                <View>
                  {Object.keys(objects[day]).map((locationId) => {
                    let location = objects[day][locationId];
                    let photo = Object.values(location.photos)[0];
                    let ratio = thumbWidth / photo.width;
                    return (
                      <View key={locationId}>
                        <TouchableOpacity
                          key={photo.photo_path}
                          style={style.locationButton}
                          onPress={() => { this.getPhotos(day, location.location_id) }}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                <Image source={require('./assets/images/crosshairs.png')} style={{ marginLeft: 10, width: 30, height: 30 }} />
                                <Text style={style.h2}>{location.location_name}</Text>
                              </View>
                              {Object.entries(location.object_counts).sort((a, b) => {
                                return a[1] < b[1];
                              }).map((object) => {
                                let iconName = object[0] == 'person' ? 'user' : object[0] == 'vehicle' ? 'car' : 'paw';
                                return (
                                  <View key={object[0]} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    <Icon style={{ paddingLeft: 15 }} name={iconName} color='black' size={18} />
                                    <Text style={style.t5}>{object[1]} {object[0]}</Text>
                                  </View>
                                );
                              })}
                            </View>
                            <View>
                              <Image source={{ uri: root + '/' + photo.photo_path }}
                                style={{ width: parseInt(thumbWidth), height: parseInt(photo.height * ratio) }} />
                              {photo.objects.map((object) => {
                                return (
                                  <View key={object.id}
                                    style={{
                                      ...StyleSheet.absoluteFillObject,
                                      left: parseInt(object.x * ratio),
                                      top: parseInt(object.y * ratio),
                                      width: parseInt(object.w * ratio),
                                      height: parseInt(object.h * ratio),
                                      borderWidth: 1,
                                      borderColor: 'rgb(255, 103, 0)'
                                    }} />
                                );
                              })}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
        {this.state.newSightings > 0 &&
          <TouchableOpacity style={style.highlightButton} onPress={() => { this.getPhotosToReview() }}>
            <Text style={style.h1}>Review {this.state.newSightings} New Sightings</Text>
          </TouchableOpacity>
        }
      </SafeAreaView >
    );
  }

  getPhotosToReview() {
    this.db.selectPhotosToReview().then((photos) => {
      this.props.navigation.navigate('ReviewScreen', {
        photos: photos.map((photo) => {
          photo.photo_path = root + '/' + photo.photo_path;
          photo.url = photo.photo_path;
          photo.props = {
            photo: photo
          };
          return photo;
        })
      });
    });
  }

  getPhotos(day, locationId) {
    this.db.selectObjects(day, locationId).then((objects) => {
      let photos = objects[day][locationId].photos;
      let title = Moment(new Date(day)).format('ddd, MMM Do YYYY');
      let subTitle = objects[day][locationId].location_name;
      this.props.navigation.navigate('PhotoScreen', {
        title: title,
        subTitle: subTitle,
        showCrops: true,
        photos: Object.values(photos).map((photo) => {
          photo.photo_path = root + '/' + photo.photo_path;
          photo.location_name = objects[day][locationId].location_name;
          photo.url = photo.photo_path;
          photo.props = {
            photo: photo
          };
          return photo;
        })
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectObjects().then((objects) => {
      this.db.selectPhotosToReviewCount().then((count) => {
        this.setState({
          isLoading: false,
          objects: objects,
          newSightings: count
        });
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}