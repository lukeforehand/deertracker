import React from 'react';
import {
  Dimensions,
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

const root = RNFS.DocumentDirectoryPath;

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
    this.checkFiles = setInterval(() => { this.setFiles() }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.checkFiles);
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
        <Text style={style.t2}>{this.state.location['name']}</Text>
        <Text style={style.t1}>
          Insert the camera card and use the Files app to move the photos into the DeerTracker folder.
            {'\n'}{'\n'}All photos in the DeerTracker folder will be imported for location: "{this.state.location['name']}"
          </Text>
        <Text style={style.t2}>Photos to import: {this.state.files.length}</Text>
        <TouchableOpacity
          disabled={this.importDisabled()}
          style={this.importDisabled() ? style.buttonDisabled : style.button} onPress={() => { this.setState({ modalVisible: true }) }}>
          <Text style={style.h1}>Import</Text>
        </TouchableOpacity>
        <ScrollView>
          <View style={style.grid}>
            {this.state.files.map((file) => {
              return (
                <Image key={file.path} source={{ uri: file.path }} style={style.thumbnail} />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView >
    );
  }

  importDisabled() {
    return !this.state.files || this.state.files.length <= 0;
  }

  async setFiles() {
    files = await this.recursiveFindFiles(root);
    this.setState({
      isLoading: false,
      files: files
    });
  }

  async recursiveFindFiles(dir) {
    results = await RNFS.readDir(dir);
    results = results.filter((result) => {
      return !result.name.startsWith(".");
    });
    files = []
    for (result of results) {
      if (result.isDirectory()) {
        files = files.concat(await this.recursiveFindFiles(result.path));
      } else {
        files.push(result);
      }
    }
    return files;
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });
    this.setFiles();

  }

}