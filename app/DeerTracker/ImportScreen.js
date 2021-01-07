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

import RNFS from 'react-native-fs';

import Database from './Database';

import style from './style';

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  static getDerivedStateFromProps(props, state) {
    location = props.navigation.getParam('location');
    return location === undefined || location === state.location ? {} : {
      location: location
    };
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
          <Text style={style.t2}>{this.state.location['name']}</Text>
          {this.state.files.map((file) => {
            return (
              <View style={{ flexDirection: 'row' }}>
                <Text style={style.h2}>{file.path}</Text>
              </View>
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

    // FIXME: write to here RNFS.DocumentDirectoryPath
    RNFS.readDir(RNFS.DocumentDirectoryPath).then((results) => {
      console.log(results);
      this.setState({
        isLoading: false,
        files: results
      });
    }).catch((err) => {
      console.log(err.message, err.code);
    });
  }
}