import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Text,
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';

import ImageResizer from 'react-native-image-resizer';

import ImageViewer from 'react-native-image-zoom-viewer';

import RNFS from 'react-native-fs';
import Database from './Database';

import style from './style';
import { thumbWidth, thumbHeight } from './style';

const root = RNFS.DocumentDirectoryPath;
RNFS.mkdir(root + '/.data', { NSURLIsExcludedFromBackupKey: true });

export default class ImportScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, modalVisible: false, previousFiles: 0 }
  }

  componentDidMount() {
    this.setFiles();
    this.checkFiles = setInterval(() => { this.setFiles() }, 3000);
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
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ActivityIndicator animating={this.importDisabled()} size='small' />
              <Text style={this.importDisabled() ? style.h4 : style.h1}>Import {this.state.files.length} Photos</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={style.importScreenBottom}>
          {this.state.files && this.state.files.length <= 0 &&
            <Text style={style.t3}>No Photos found, insert camera card and use the Files app to move photos to DeerTracker folder.</Text>
          }
          {this.state.files && this.state.files.length > 0 &&
            <View style={{ alignItems: 'center' }}>
              <FlatList
                numColumns={2}
                data={this.state.thumbUrls}
                renderItem={this.renderThumbnail.bind(this)}
                keyExtractor={item => item.uri}
              />
            </View>
          }
          {this.state.fileIndex &&
            <Modal visible={this.state.modalVisible} transparent={true}>
              <ImageViewer
                imageUrls={this.state.imageUrls}
                index={this.state.fileIndex}
                enableSwipeDown={true}
                swipeDownThreshold={80}
                onSwipeDown={() => { this.setState({ modalVisible: false }) }}
              />
            </Modal>
          }
        </View>
      </SafeAreaView >
    );
  }

  renderThumbnail(item) {
    const thumb = item.item;
    return (
      <TouchableOpacity key={thumb.path} onPress={() => { this.setState({ modalVisible: true, fileIndex: item.index }) }}>
        <Image
          key={thumb.path}
          source={{ uri: thumb.uri }}
          style={style.thumbnail} />
      </TouchableOpacity>
    );
  }


  importDisabled() {
    return !this.state.files ||
      this.state.previousFiles != this.state.files.length ||
      this.state.files.length <= 0;
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
            let destPath = root + '/.data/batch/' + batchId;
            RNFS.mkdir(destPath, { NSURLIsExcludedFromBackupKey: true }).then(() => {
              Promise.all(this.state.files.map(async (file) => {
                return RNFS.hash(file.path, 'md5').then((hash) => {
                  let destFile = destPath + '/' + hash + '.jpg';
                  this.db.insertPhoto(hash, destFile, batchId).then(() => {
                    RNFS.moveFile(file.path, destFile);
                  }).catch((error) => {
                    console.log(error);
                    RNFS.unlink(file.path);
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
      // don't affect the modal file index
      return;
    }

    let files = await this.recursiveFindFiles(root);
    let thumbUrls = files.map((file) => {
      return ImageResizer.createResizedImage(file.path, thumbWidth, thumbHeight, 'JPEG', 50, 0);
    });
    Promise.all(thumbUrls).then((urls) => {
      this.setState({ thumbUrls: urls });
    });

    let previousFiles = this.state.files ? this.state.files.length : 0;
    let imageUrls = files.map((file) => {
      return {
        url: file.path
      };
    })
    this.setState({
      isLoading: false,
      previousFiles: previousFiles,
      files: files,
      imageUrls: imageUrls
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