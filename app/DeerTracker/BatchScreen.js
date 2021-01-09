import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  View,
  TouchableOpacity
} from 'react-native';

import Moment from 'moment';

import Database from './Database';

import style from './style';

export default class BatchScreen extends React.Component {

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
        <ScrollView>
          {this.state.batches.map((batch) => {
            return (
              <TouchableOpacity key={batch['id']} style={style.locationButton}>

                <View style={{ flexDirection: 'row' }}>
                  <Text style={style.t3}>{Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}</Text>
                  <Text style={style.t3}>{batch['num_photos']}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView >
    );
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectBatches().then((batches) => {
      this.setState({
        isLoading: false,
        batches: batches
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}