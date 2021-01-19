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
          {Object.keys(this.state.objects).map((day) => {
            return (
              <View key={day}>
                <Text style={style.h3}>
                  {Moment(new Date(day)).format('ddd, MMM Do YYYY')}
                </Text>
                <View>
                  {Object.keys(this.state.objects[day]).map((location) => {
                    return this.state.objects[day][location].map((object) => {
                      let ratio = thumbWidth / object.width;
                      return (
                        <TouchableOpacity
                          key={object.label}
                          style={style.locationButton}
                          onPress={() => { alert("fetch annotated photos for day, label") }}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={style.h2}>{object.location_name}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                            <Text style={style.t4}>
                              {object.label}: {object.num_objects}
                            </Text>
                            <View>
                              <Image source={{ uri: root + '/' + object.photo_path }}
                                style={{ width: parseInt(thumbWidth), height: parseInt(object.height * ratio) }} />
                              <View style={{
                                ...StyleSheet.absoluteFillObject,
                                left: parseInt(object.x * ratio),
                                top: parseInt(object.y * ratio),
                                width: parseInt(object.w * ratio),
                                height: parseInt(object.h * ratio),
                                borderWidth: 2,
                                borderColor: 'rgba(0,255,0,0.7)'
                              }} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    });
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
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