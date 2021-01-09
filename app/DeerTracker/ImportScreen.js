import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  Modal,
  View,
  TouchableOpacity
} from 'react-native';

import ImageViewer from 'react-native-image-zoom-viewer';

import RNFS from 'react-native-fs';
import Database from './Database';

import style from './style';

const root = RNFS.DocumentDirectoryPath;
RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, modalVisible: false }
  }

  componentDidMount() {
    this.setFiles();
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

    const location = this.props.navigation.getParam('location');

    return (
      <SafeAreaView>
        <View style={style.importScreenTop}>
          <Text style={style.t2}>{location['name']}</Text>
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
                    <TouchableOpacity key={file.path} onPress={() => { this.setState({ modalVisible: true, file: file }) }}>
                      <Image key={file.path} source={{ uri: file.path }} style={style.thumbnail} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          }
          {this.state.file &&
            <Modal visible={this.state.modalVisible} transparent={true}>
              <ImageViewer imageUrls={this.state.imageUrls} index={this.state.files.indexOf(this.state.file)}
                enableSwipeDown={true}
                swipeDownThreshold={80}
                onSwipeDown={() => { this.setState({ modalVisible: false }) }}
              />
            </Modal>
          }
        </View>
      </SafeAreaView>
    );
  }

  importDisabled() {
    return !this.state.files || this.state.files.length <= 0;
  }

  importPhotos() {
    const location = this.props.navigation.getParam('location');
    Alert.alert(
      'Import ' + this.state.files.length + ' photos for location ' + location['name'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.setState({ isLoading: true });
          this.db.insertBatch().then((rs) => {
            let batchId = rs[0]['insertId'];
            let destPath = root + '/.data/batch/' + batchId;
            RNFS.mkdir(destPath, { NSURLIsExcludedFromBackupKey: true }).then(() => {
              Promise.all(this.state.files.map((file) => {
                return RNFS.hash(file.path, 'md5').then((hash) => {
                  let destFile = destPath + '/' + hash + '.jpg';
                  RNFS.moveFile(file.path, destFile).then(() => {
                    this.db.insertPhoto(hash, destFile, batchId).catch((error) => {
                      console.log(error);
                    });
                  }).catch((error) => {
                    console.log(error);
                    if (error.includes("already exists")) {
                      RNFS.unlink(file.path);
                    }
                  });
                });
              })).then(() => {
                this.removeEmptyFolders();
                this.db.selectBatches().then((batches) => {
                  this.props.navigation.replace('LocationScreen');
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

  async setFiles() {
    if (this.state.modalVisible) {
      // pause file update when modal is open
      return;
    }
    files = await this.recursiveFindFiles(root);
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