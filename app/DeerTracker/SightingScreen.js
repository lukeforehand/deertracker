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

import { thumbWidth, thumbHeight } from './style';

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
          <RefreshControl title='Refresh' refreshing={this.refreshing()} onRefresh={this.fetchData.bind(this)} />
        }>
          {Object.keys(this.state.objects).sort().reverse().map((day) => {
            return (
              <View key={day}>
                <Text style={style.h3}>
                  {Moment(new Date(day)).format('ddd, MMM Do YYYY')}
                </Text>
                <View>
                  {Object.keys(this.state.objects[day]).map((locationKey) => {
                    let location = this.state.objects[day][locationKey];
                    let photo = Object.values(location.photos)[0];
                    let ratio = thumbWidth / photo.width;
                    return (
                      <View>
                        <TouchableOpacity
                          key={photo.photo_path}
                          style={style.locationButton}
                          onPress={() => { this.getPhotos(location.photos) }}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                              <Text style={style.h2}>{location.location_name}</Text>
                              {Object.keys(location.object_counts).sort().map((object) => {
                                return (
                                  <Text key={object} style={style.t4}>
                                    {object}: {location.object_counts[object]}
                                  </Text>
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

  getPhotos(photos) {
    this.props.navigation.navigate('PhotoScreen', {
      photos: Object.values(photos).map((photo) => {
        photo.photo_path = root + '/' + photo.photo_path;
        return photo;
      })
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