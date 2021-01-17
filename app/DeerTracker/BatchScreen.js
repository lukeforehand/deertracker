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

import Upload from 'react-native-background-upload';

import RNFS from 'react-native-fs';

import Moment from 'moment';

import SwipeRow from './SwipeRow';
import Database from './Database';

import style from './style';

const root = RNFS.DocumentDirectoryPath;
const detectorUrl = "http://192.168.0.157:5000";

export default class BatchScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, photosToUpload: 0, photosToProcess: 0 }
  }

  componentDidUpdate() {
    let batches = this.props.navigation.getParam('batches');
    if (batches && batches !== this.state.batches) {
      this.setState({
        batches: batches
      });
    }
  }

  componentDidMount() {
    this.fetchData();
    this.uploadPhotos().then(() => {
      this.checkUploads = setInterval(() => { this.uploadPhotos() }, 5000);
    });
    this.processPhotos().then(() => {
      this.checkProcess = setInterval(() => { this.processPhotos() }, 5000);
    });
  }

  componentWillUnmount() {
    clearInterval(this.checkUploads);
    clearInterval(this.checkProcess);
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
          {this.state.batches && this.state.batches.length <= 0 &&
            <Text style={style.t3}>No Photos found, please Load Card.</Text>
          }
          {this.state.batches && this.state.batches.length > 0 && this.state.config &&
            <View style={[style.input, { flex: 1, flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Text style={style.h2}>Discard Empty Photos:</Text>
              <Text style={style.h2}>{this.state.config.get('discard_empty')}</Text>
            </View>
          }
          {this.state.batches.map((batch) => {
            let progress = parseInt(100 * ((batch['num_uploaded'] + batch['num_processed']) / (batch['num_photos'] * 2)));
            return (
              <SwipeRow
                key={batch['id']}
                item={batch}
                onDelete={this.deleteBatch.bind(this)}
                onArchive={this.archiveBatch.bind(this)}>
                <TouchableOpacity
                  key={batch['id']}
                  style={style.locationButton}
                  onPress={() => { this.getPhotos(batch['id']) }}>
                  <Text style={style.h3}>
                    {Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}
                  </Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={style.h2}>{batch['location_name']}</Text>
                    {progress < 100 &&
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Text style={style.t4}>Processing...</Text>
                        <ActivityIndicator size='small' />
                        <Text style={style.t4}>{progress}%</Text>
                      </View>
                    }
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={style.t4}>
                      Sightings: {batch['num_objects']}{'\n'}
                      Photos: {batch['num_photos']}{'\n'}
                      Uploaded: {batch['num_uploaded']}{'\n'}
                      Processed: {batch['num_processed']}
                    </Text>
                    <View>
                      {batch['photo_path'] &&
                        <Image source={{ uri: root + '/' + batch['photo_path'] }} style={style.smallThumbnail} />
                      }
                    </View>
                  </View>
                </TouchableOpacity>
              </SwipeRow>
            );
          })}
        </ScrollView>
      </SafeAreaView >
    );
  }

  async processPhotos() {
    if (this.state.photosToProcess <= 0) {
      const photos = await this.db.selectPhotosToProcess();
      if (photos.length == 0) {
        return;
      }
      this.setState({
        photosToProcess: photos.length
      });
      for (p of photos) {
        let photo = p;
        try {
          let response = await fetch(detectorUrl + '/' + photo['upload_id']);
          console.log(photo['id'] + ' GET ' + response.status);
          if (response.status !== 200) {
            this.setState({
              photosToProcess: 0
            });
            return;
          }
          let r = await response.json();
          console.log(photo['id'] + ' responseBody: ' + JSON.stringify(r));
          if (!Boolean(r.processed)) {
            this.setState({
              photosToProcess: 0
            });
            return;
          }
          if (r.objects.length > 0) {
            for (o of r.objects) {
              o['lat'] = photo['lat'];
              o['lon'] = photo['lon'];
              o['time'] = photo['time'];
              o['photo_id'] = photo['id'];
              o['location_id'] = photo['location_id'];
              this.db.insertObject(o);
            }
          } else {
            if (this.state.config.get('discard_empty') == 'true') {

              let path = root + '/' + photo['path'];
              console.log("deleting " + path);
              RNFS.unlink(path);
              this.db.deletePhoto(photo['id']).then(() => {
                let batchId = photo['batch_id'];
                this.setState(prevState => ({
                  batches: prevState.batches.map((batch) => {
                    if (batch['id'] === batchId) {
                      batch['num_photos'] = batch['num_photos'] - 1;
                      batch['num_uploaded'] = batch['num_uploaded'] - 1;
                      batch['num_processed'] = batch['num_processed'] - 1;
                    }
                    return batch;
                  }),
                  photosToProcess: prevState.photosToProcess - 1
                }));
              });
              return;
            }
          }
          this.db.processPhoto(photo['id']).then(() => {
            let batchId = photo['batch_id'];
            this.setState(prevState => ({
              batches: prevState.batches.map((batch) => {
                if (batch['id'] === batchId) {
                  batch['num_processed'] = batch['num_processed'] + 1;
                  batch['num_objects'] = batch['num_objects'] + r.objects.length;
                }
                return batch;
              }),
              photosToProcess: prevState.photosToProcess - 1
            }));
          });
        } catch (err) {
          console.log(err);
          this.setState(prevState => ({
            photosToProcess: 0
          }));
          return;
        }
      }
    }
  }

  async uploadPhotos() {
    if (this.state.photosToUpload <= 0) {
      const photos = await this.db.selectPhotosToUpload();
      if (photos.length == 0) {
        return;
      }
      this.setState({
        photosToUpload: photos.length
      });
      for (p of photos) {
        let photo = p;
        Upload.cancelUpload(photo['id']);
        Upload.startUpload({
          url: detectorUrl,
          path: root + '/' + photo['path'],
          type: 'multipart',
          customUploadId: photo['id'],
          field: 'image',
          parameters: {
            'lat': photo['location_lat'],
            'lon': photo['location_lon'],
            // FIXME: remove when not developing
            'rescore': true
          }
        }).then((photoId) => {
          Upload.addListener('error', photoId, (err) => {
            console.log(photoId + ' ' + JSON.stringify(err));
            this.setState(prevState => ({
              photosToUpload: prevState.photosToUpload - 1
            }));
          });
          Upload.addListener('completed', photoId, (data) => {
            console.log(photoId + ' ' + ' POST ' + data.responseCode);
            if (data.responseCode !== 200 || data.responseBody === null) {
              console.log(photoId + ' responseBody: ' + data.responseBody);
              this.setState(prevState => ({
                photosToUpload: prevState.photosToUpload - 1
              }));
              return;
            }
            let r = JSON.parse(data.responseBody);
            this.db.setPhotoUpload(
              photoId,
              r.upload_id,
              r.time).then((uploadedPhoto) => {
                let batchId = uploadedPhoto['batch_id'];
                this.setState(prevState => ({
                  batches: prevState.batches.map((batch) => {
                    if (batch['id'] === batchId) {
                      batch['num_uploaded'] = batch['num_uploaded'] + 1;
                    }
                    return batch;
                  }),
                  photosToUpload: prevState.photosToUpload - 1
                }));
              });
          });
        }).catch((err) => {
          console.log(err);
          this.setState(prevState => ({
            photosToUpload: prevState.photosToUpload - 1
          }));
        });
      }
    }
  }

  getPhotos(batchId) {
    this.db.selectBatchPhotos(batchId).then((photos) => {
      if (photos.length > 0) {
        this.props.navigation.navigate('PhotoScreen', {
          imageUrls: photos.map((photo) => {
            return {
              url: root + '/' + photo.path
            };
          })
        });
      }
    });
  }

  archiveBatch(batch, callback) {
    Alert.alert(
      `Archive ${batch['num_photos']} Photo(s) ?`, '', [
      {
        text: 'Yes',
        onPress: () => {
          alert("Feature coming soon...");
          callback();
        }
      },
      { text: 'No', onPress: callback }], { cancelable: false });
  }

  deleteBatch(batch, callback) {
    Alert.alert(
      `Permanently Delete ${batch['num_photos']} Photo(s) ?`, '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteBatchObjects(batch['id']).then(() => {
            this.db.deleteBatchPhotos(batch['id']).then(() => {
              this.db.deleteBatch(batch['id']).then(() => {
                let dir = RNFS.DocumentDirectoryPath + '/.data/batch/' + batch['id'];
                console.log("deleting " + dir);
                RNFS.unlink(dir);
                this.db.selectBatches().then((batches) => {
                  this.props.navigation.navigate('BatchScreen', {
                    batches: batches
                  });
                });
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
    this.db.selectBatches().then((batches) => {
      this.db.selectConfig().then((config) => {
        this.setState({
          isLoading: false,
          batches: batches,
          config: config
        });
      })
    }).catch((error) => {
      console.log(error);
    });
  }
}