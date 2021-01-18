import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity
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
                <View>
                  {Object.keys(this.state.objects[day]).map((location) => {
                    return this.state.objects[day][location].map((object) => {
                      return (
                        <TouchableOpacity
                          key={object.label}
                          style={style.locationButton}
                          onPress={() => { alert("fetch annotated photos for day, label") }}>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={style.h2}>{object.location_name}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={style.t4}>
                              {object.label}: {object.num_objects}{'\n'}
                            </Text>
                            <Image source={{ uri: root + '/' + object.photo_path }} style={style.smallThumbnail} />
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