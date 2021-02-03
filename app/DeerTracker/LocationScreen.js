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

import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

import Database from './Database';
import SwipeRow from './SwipeRow';

import style from './style';

const root = RNFS.DocumentDirectoryPath;

RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });

export default class LocationScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
  }

  componentDidUpdate() {
    let locations = this.props.navigation.getParam('locations');
    if (locations && locations !== this.state.locations) {
      this.setState({
        locations: locations
      });
    }
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
          <Text style={style.t3}>Where were these photos taken?</Text>
          {this.state.locations.map((location) => {
            return (
              <SwipeRow key={location['id']} item={location} onDelete={this.deleteLocation.bind(this)}>
                <TouchableOpacity
                  key={location['id']}
                  style={style.locationButton}
                  onPress={() => { this.pickFiles(location) }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={require('./assets/images/crosshairs.png')} style={{ margin: 10, width: 60, height: 60 }} />
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={style.h2}>{location['name']}</Text>
                      <Text style={style.h2}>({location['lat'].toFixed(5)}, {location['lon'].toFixed(5)})</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </SwipeRow>
            );
          })}
          <View style={{ height: 20 }} />
          <TouchableOpacity style={style.button} onPress={() => {
            this.props.navigation.navigate('AddLocationScreen', {
              locations: this.state.locations
            })
          }}>
            <Text style={style.h1}>New Location</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  pickFiles(location) {
    DocumentPicker.pickMultiple({
      type: [DocumentPicker.types.images],
      mode: 'import',
    }).then((files) => {
      files = files.map((file) => {
        file.photo_path = file.uri;
        file.url = file.uri;
        file.path = file.uri;
        file.location_name = location.name;
        file.props = {
          photo: file
        };
        return file;
      });
      Alert.alert(
        'Import ' + files.length + ' photos from location ' + location['name'] + '?', '', [
        {
          text: 'Yes',
          onPress: () => {
            this.setState({ isLoading: true });
            this.db.insertBatch(location['id']).then((rs) => {
              let batchId = rs[0]['insertId'];
              let relativePath = '.data/batch/' + batchId;
              let destPath = root + '/' + relativePath;
              RNFS.mkdir(destPath, { NSURLIsExcludedFromBackupKey: true }).then(() => {
                Promise.all(files.map(async (file) => {
                  return RNFS.hash(file.path, 'md5').then((hash) => {
                    let relativeDestFile = relativePath + '/' + hash + '.jpg';
                    this.db.insertPhoto(hash, relativeDestFile, location['lat'], location['lon'], batchId).then(() => {
                      RNFS.copyFile(file.path, root + '/' + relativeDestFile);
                    }).catch((error) => {
                      console.log(error);
                      console.log("deleting " + file.path);
                      RNFS.unlink(file.path);
                    });
                  });
                })).then(() => {
                  this.db.selectBatches().then((batches) => {
                    this.props.navigation.popToTop('LocationScreen');
                    this.props.navigation.navigate('BatchScreen', {
                      batches: batches
                    });
                  });
                });
              });
            });
          }
        }, { text: 'No' }], { cancelable: false });
    }).catch((err) => {
      if (DocumentPicker.isCancel(err)) {
      } else {
        throw err;
      }
    });
  }

  deleteLocation(location, callback) {
    Alert.alert(
      'Delete Location ' + location['name'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteLocation(location['id']).then(() => {
            this.db.selectLocations().then((locations) => {
              this.props.navigation.navigate('LocationScreen', {
                locations: locations
              });
            });
          });
          callback();
        }
      },
      { text: 'No', onPress: callback }], { cancelable: false });
  }

  fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectLocations().then((locations) => {
      this.setState({
        isLoading: false,
        locations: locations
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}