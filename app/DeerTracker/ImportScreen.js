import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
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
            <Image style={{ height: 200, width: 300 }} source={{ uri: 'https://pbs.twimg.com/profile_images/428316729220276224/EdBZ2Kgp.jpeg' }} />
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

  onButtonPress() {
    this.props.navigation.navigate('Second_screen');
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