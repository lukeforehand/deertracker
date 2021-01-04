import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

import Database from './Database';

import style from './style';

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  componentDidMount() {
    this.fetchData()
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
          <TouchableOpacity style={style.button} onPress={this.onButtonPress.bind(this)}>
            <Text style={style.h1}>Add Location</Text>
          </TouchableOpacity>
          <Text style={style.h1}>Batch ID: {this.state.data.batch_id}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  onButtonPress() {
    this.props.navigation.navigate('LocationScreen');
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectBatches().then((batches) => {
      console.log(batches);
      this.db.selectLocations().then((locations) => {
        console.log(locations);
        this.setState({
          isLoading: false,
          data: {
            batches: batches,
            locations: locations
          }
        });
      }).catch((error) => {
        console.log(error);
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}