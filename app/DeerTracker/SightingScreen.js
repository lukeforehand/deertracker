import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';

import Moment from 'moment';

import Database from './Database';

import style from './style';

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
          {this.state.objects.map((object) => {
            return (
              <View key={object['day']} style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={style.h3}>
                  {Moment(new Date(object['day'])).format('ddd, MMM Do YYYY hh:mm A')}
                </Text>
                <Text style={style.h2}>{object['label']} {object['num_objects']}</Text>
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