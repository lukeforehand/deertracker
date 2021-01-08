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
        <View style={style.importScreenTop}>
          <Text style={style.t2}>{this.state.location['name']}</Text>
          <TouchableOpacity
            disabled={this.importDisabled()}
            style={this.importDisabled() ? style.buttonDisabled : style.button} onPress={this.importPhotos.bind(this)}>
            <Text style={style.h1}>Import {this.state.files.length} Photos</Text>
          </TouchableOpacity>
        </View>
        <View style={style.importScreenBottom}>
          {this.importDisabled() &&
            <Text style={style.t3}>No Photos found, insert camera card and use the Files app to move photos to DeerTracker folder.</Text>
          }
          {!this.importDisabled() &&
            <ScrollView>
              <View style={style.grid}>
                {this.state.files.map((file) => {
                  return (
                    <TouchableOpacity key={file.path} onPress={() => { this.props.navigation.navigate('PhotoScreen', { file: file, files: this.state.files }) }}>
                      <Image key={file.path} source={{ uri: file.path }} style={style.thumbnail} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          }
        </View>
      </SafeAreaView>
    );
  }

  importDisabled() {
    return !this.state.files || this.state.files.length <= 0;
  }

  importPhotos() {
    Alert.alert(
      'Import ' + this.state.files.length + ' photos for location ' + this.state.location['name'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          // FIXME: import the photos
        }
      },
      { text: 'No' }], { cancelable: false });
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