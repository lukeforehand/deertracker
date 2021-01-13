import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import RNFS from 'react-native-fs';
import Database from './Database';

import PhotoGallery from './PhotoGallery';

import style from './style';

const root = RNFS.DocumentDirectoryPath;

RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, importDisabled: true }
  }

  componentDidMount() {
    this.findFiles();
    this.checkFiles = setInterval(() => { this.findFiles() }, 3000);
    console.log(this.props.navigation.dangerouslyGetParent());
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

    const location = this.props.navigation.getParam('location');
    const importDisabled = this.state.importDisabled;

    return (
      <SafeAreaView>
        <View style={style.importScreenTop}>
          <Text style={style.t2}>{location['name']}</Text>
          <TouchableOpacity
            disabled={importDisabled}
            style={importDisabled ? style.buttonDisabled : style.button} onPress={this.importPhotos.bind(this)}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ActivityIndicator animating={importDisabled} size='small' />
              <Text style={importDisabled ? style.h1 : style.h1}>Import {this.state.files.length} Photos</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={style.importScreenBottom}>
          {this.state.files && this.state.files.length <= 0 &&
            <Text style={style.t3}>No Photos found, insert camera card and use the Files app to move photos to DeerTracker folder.</Text>
          }
          <PhotoGallery imageUrls={this.state.imageUrls} />
        </View>
      </SafeAreaView >
    );
  }

  importPhotos() {
    const location = this.props.navigation.getParam('location');
    Alert.alert(
      'Import ' + this.state.files.length + ' photos for location ' + location['name'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.setState({ isLoading: true });
          this.db.insertBatch(location['id']).then((rs) => {
            let batchId = rs[0]['insertId'];
            let relativePath = '.data/batch/' + batchId;
            let destPath = root + '/' + relativePath;
            RNFS.mkdir(destPath, { NSURLIsExcludedFromBackupKey: true }).then(() => {
              Promise.all(this.state.files.map(async (file) => {
                return RNFS.hash(file.path, 'md5').then((hash) => {
                  let relativeDestFile = relativePath + '/' + hash + '.jpg';
                  this.db.insertPhoto(hash, relativeDestFile, batchId).then(() => {
                    RNFS.moveFile(file.path, root + '/' + relativeDestFile);
                  }).catch((error) => {
                    console.log(error);
                    console.log("deleting " + file.path);
                    RNFS.unlink(file.path);
                  });
                });
              })).then(() => {
                this.removeEmptyFolders();
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

  async findFiles() {
    if (this.state.importDisabled) {
      let files = await this.recursiveFindFiles(root);
      if (this.state.files && this.state.files.length === files.length && files.length > 0) {
        // found files is same length as previous attempt, to enable import button.
        this.setState({
          importDisabled: false
        });
        return;
      } else {
        // update files and imageUrls
        this.setState({
          isLoading: false,
          files: files,
          imageUrls: files.map((file) => {
            return {
              url: file.path
            };
          })
        });
      }
    }
  }

  async removeEmptyFolders() {
    results = await RNFS.readDir(root);
    results = results.filter((result) => {
      return !result.name.startsWith(".");
    });
    for (result of results) {
      if (result.isDirectory()) {
        dir = result.path;
        files = await this.recursiveFindFiles(dir);
        if (files.length <= 0) {
          console.log("deleting " + dir);
          RNFS.unlink(dir);
        }
      }
    }
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

}