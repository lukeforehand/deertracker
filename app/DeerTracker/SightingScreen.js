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

import style, { screenHeight, thumbWidth, headerHeight, footerHeight } from './style';

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
    this.focusListener = this.props.navigation.addListener('didFocus', () => {
      this.fetchData();
    });
  }

  componentWillUnmount() {
    this.focusListener.remove();
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
        <ScrollView style={{ height: screenHeight - headerHeight - footerHeight }} refreshControl={
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
            let moonImage = moon.image(phase.name);
            return (
              <View key={day} style={style.locationButton}>
                <View style={style.itemHeader}>
                  <Text style={style.h6}>
                    {Moment(day).format('ddd, MMM Do YYYY')}
                  </Text>
                  <Image style={[style.moon, { width: 45, height: 45 }]} source={moonImage} />
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
                          style={[style.locationButton, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 0 }]}
                          onPress={() => { this.getPhotos(day, location.location_id) }}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', margin: 10 }}>
                                <Image source={require('./assets/images/crosshairs.png')} style={{ width: 25, height: 25 }} />
                                <Text style={style.h2}>{location.location_name}</Text>
                              </View>
                              {Object.entries(location.object_counts).sort((a, b) => b[1] - a[1]).map((object) => {
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
        {
          this.state.newSightings > 0 &&
          <TouchableOpacity style={style.highlightButton} onPress={() => { this.getPhotosToReview() }}>
            <Text style={style.highlightButtonText}>Review {this.state.newSightings} New Sightings</Text>
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
      let title = Moment(day).format('ddd, MMM Do YYYY');
      let subTitle = objects[day][locationId].location_name;
      this.props.navigation.navigate('PhotoScreen', {
        title: title,
        subTitle: subTitle,
        showCrops: true,
        photos: Object.values(photos).map((photo) => {
          photo.photo_path = root + '/' + photo.photo_path;
          photo.objects = photo.objects.map((object) => {
            object.photo_path = root + '/' + object.photo_path;
            return object;
          });
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