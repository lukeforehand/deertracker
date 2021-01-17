import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Image,
} from 'react-native';

import RNFS from 'react-native-fs';

import Moment from 'moment';

import Database from './Database';

import style from './style';

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
    if (this.refreshing()) {
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
        <ScrollView style={{ height: '100%' }}>
          {Object.keys(this.state.objects).map((day) => {
            return (
              <View key={day}>
                <Text style={style.h3}>
                  {Moment(new Date(day)).format('ddd, MMM Do YYYY')}
                </Text>
                {this.state.objects[day].map((object) => {
                  return (
                    <View key={object.label} >
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
                        <Text style={style.t3}>
                          {object.location_name}
                        </Text>
                        <Text style={style.t3}>
                          {object.label}
                        </Text>
                        <Text style={style.t3}>
                          {object.num_objects}
                        </Text>
                      </View>
                      <Image source={{ uri: root + '/' + object.photo_path }} style={style.smallThumbnail} />
                    </View>
                  )
                })}
              </View>
            );
          })}
        </ScrollView >
      </SafeAreaView >
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