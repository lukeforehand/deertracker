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

import RNFS from 'react-native-fs';

import Moment from 'moment';

import Database from './Database';

import style from './style';
import { thumbWidth } from './style';

const root = RNFS.DocumentDirectoryPath;

export default class ProfileScreen extends React.Component {

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
                              <Text style={style.h2}>{location.location_name}</Text>
                              {Object.keys(location.object_counts).sort().map((object) => {
                                return (
                                  <View key={object} style={{ paddingRight: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={style.t5}>{object}</Text>
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
                                      borderWidth: 1,
                                      borderColor: 'rgba(0,255,0,1.0)'
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