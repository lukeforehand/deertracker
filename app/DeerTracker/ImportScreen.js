import React from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';

import RNFS from 'react-native-fs';
import Database from './Database';

import PhotoGrid from './PhotoGrid';

import style from './style';

const root = RNFS.DocumentDirectoryPath;

RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = {};
  }

  render() {

    const location = this.props.navigation.getParam('location');
    const files = this.props.navigation.getParam('files');

    return (
      <SafeAreaView>
        <View style={style.importScreenTop}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('./assets/images/crosshairs.png')}
              style={{ width: 25, height: 25 }} />
            <Text style={style.t2}>{location['name']}</Text>
          </View>
          <TouchableOpacity
            style={style.button} onPress={this.importPhotos.bind(this)}>
            <Text style={style.h1}>Import {files.length} Photos</Text>
          </TouchableOpacity>
        </View>
        <View style={style.importScreenBottom}>
          <PhotoGrid
            photos={files}
            showCrops={false}
            onRefresh={() => { this.props.navigation.goBack() }} />
        </View>
      </SafeAreaView >
    );
  }

  importPhotos() {
    const location = this.props.navigation.getParam('location');
    const files = this.props.navigation.getParam('files');
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
  }

}