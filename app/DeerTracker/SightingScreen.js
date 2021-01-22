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

import Database from './Database';

import style from './style';
import { thumbWidth } from './style';

const root = RNFS.DocumentDirectoryPath;

export default class SightingScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
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
        <ScrollView style={{ height: '100%' }} refreshControl={
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
            return (
              <View key={day}>
                <Text style={style.h3}>
                  {Moment(new Date(day)).format('ddd, MMM Do YYYY')}
                </Text>
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
                              {Object.keys(location.object_counts).sort().map((object) => {
                                let iconName = object == 'person' ? 'user' : object == 'vehicle' ? 'car' : 'paw';
                                return (
                                  <View key={object} style={{ paddingRight: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                      <Icon style={{ paddingLeft: 15 }} name={iconName} color='black' size={18} />
                                      <Text style={style.t5}>{object}</Text>
                                    </View>
                                    <Text style={style.t5}>{location.object_counts[object]}</Text>
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
                                      borderWidth: 2,
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
      </SafeAreaView>
    );
  }

  getPhotos(day, locationId) {
    this.db.selectObjects(day, locationId).then((objects) => {
      let photos = objects[day][locationId].photos;
      let title = Moment(new Date(day)).format('ddd, MMM Do YYYY');
      this.props.navigation.navigate('PhotoScreen', {
        title: title,
        showCrops: true,
        photos: Object.values(photos).map((photo) => {
          photo.photo_path = root + '/' + photo.photo_path;
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
      this.setState({
        isLoading: false,
        objects: objects
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}