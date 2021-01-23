import React from 'react';
import {
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  View,
  TouchableOpacity,
  RefreshControl
} from 'react-native';

import Upload from 'react-native-background-upload';

import Icon from 'react-native-vector-icons/FontAwesome5';

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
    this.focusListener = this.props.navigation.addListener('didFocus', () => { this.fetchConfig(); });
  }


  componentWillUnmount() {
    this.focusListener.remove();
  }


  componentWillUnmount() {
    clearInterval(this.checkUploads);
    clearInterval(this.checkProcess);
  }

  refreshing() {
    return this.state.isLoading;
  }

  render() {

    const batches = this.state.batches;

    if (!batches) {
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
        <ScrollView style={{ height: '100%' }} refreshControl={
          <RefreshControl
            title='Refresh'
            titleColor='black'
            tintColor='black'
            refreshing={this.refreshing()} onRefresh={this.fetchData.bind(this)} />
        }>
          {batches && batches.length <= 0 &&
            <Text style={style.t3}>No photos, load card or pull down to refresh</Text>
          }
          {batches.map((batch) => {
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
                  onPress={() => { this.getPhotos(batch) }}>
                  <Text style={style.h3}>
                    {Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}
                  </Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <Image source={require('./assets/images/crosshairs.png')} style={{ marginLeft: 10, width: 30, height: 30 }} />
                      <Text style={style.h2}>{batch['location_name']}</Text>
                    </View>
                    {progress < 100 &&
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <ActivityIndicator size='small' />
                        <Text style={style.t4}>{progress}%</Text>
                      </View>
                    }
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Icon style={{ paddingLeft: 15 }} name='eye' color='black' size={18} />
                        <Text style={style.t5}>{batch['num_objects']} Sightings</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Icon style={{ paddingLeft: 15 }} name='camera' color='black' size={18} />
                        <Text style={style.t5}>{batch['num_photos']} Photos</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Icon style={{ paddingLeft: 15 }} name='upload' color='black' size={18} />
                        <Text style={style.t5}>{batch['num_uploaded']} Uploaded</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Icon style={{ paddingLeft: 15 }} name='check' color='black' size={18} />
                        <Text style={style.t5}>{batch['num_processed']} Processed</Text>
                      </View>
                    </View>
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
          } else if (this.state.config.get('discard_empty') == 'true') {
            console.log(`discarding ${JSON.stringify(photo)}`);
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
                }).filter((batch) => {
                  // TODO VERIFY THIS WORKS
                  return batch['num_photos'] > 0;
                }),
                photosToProcess: prevState.photosToProcess - 1
              }));
            });
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
          this.setState({
            photosToProcess: 0
          });
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
            'lon': photo['location_lon']
          }
        }).then((photoId) => {
          Upload.addListener('error', photoId, (err) => {
            console.log(photoId + ' ' + JSON.stringify(err));
            Upload.cancelUpload(photoId).then(() => {
              this.setState(prevState => ({
                photosToUpload: prevState.photosToUpload - 1
              }));
            });
          });
          Upload.addListener('completed', photoId, (data) => {
            console.log(photoId + ' ' + ' POST ' + data.responseCode + ' ' + data.responseBody);
            if (data.responseCode !== 200 || data.responseBody === null) {
              console.log(photoId + ' responseBody: ' + data.responseBody);
              this.setState(prevState => ({
                photosToUpload: prevState.photosToUpload - 1
              }));
              return;
            }
            let r = JSON.parse(data.responseBody);
            this.db.updatePhoto(photoId, r.upload_id, r.time, r.width, r.height).then((uploadedPhoto) => {
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

  getPhotos(batch) {
    let batchId = batch['id'];
    let title = Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A');
    let subTitle = batch['location_name'];
    this.db.selectBatchPhotos(batchId).then((photos) => {
      if (photos.length > 0) {
        this.props.navigation.navigate('PhotoScreen', {
          title: title,
          subTitle: subTitle,
          showCrops: false,
          photos: photos.map((photo) => {
            photo.photo_path = root + '/' + photo.photo_path;
            photo.location_name = batch['location_name'];
            return photo;
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

  async fetchData() {
    this.setState({
      isLoading: true
    });
    this.db.selectBatches().then((batches) => {
      this.fetchConfig().then(() => {
        this.setState({
          isLoading: false,
          batches: batches
        });
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  async fetchConfig() {
    this.db.selectConfig().then((config) => {
      this.setState({
        config: config
      });
    })
  }

}