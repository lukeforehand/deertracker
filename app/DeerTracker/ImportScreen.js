import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  View,
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
          <View style={style.center}>
            <Text style={style.h1}>Batch ID: {this.state.data.batch_id}</Text>
          </View>
          {this.state.data.error &&
            <View style={style.center}>
              <Text style={style.h1}>Error: {this.state.data.error}</Text>
            </View>
          }
        </ScrollView>
      </SafeAreaView>
    );
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectBatches().then((rs) => {
      console.log(rs);
      this.setState({
        isLoading: false,
        data: rs
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}