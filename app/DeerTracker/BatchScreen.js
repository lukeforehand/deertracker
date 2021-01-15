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
    this.uploadPhotos();
    this.processPhotos();
    this.checkUploads = setInterval(() => { this.uploadPhotos() }, 3000);
    this.checkProcess = setInterval(() => { this.processPhotos() }, 3000);
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
          {this.state.batches.map((batch) => {
            let progress = parseInt(100 * ((batch['num_uploaded'] + batch['num_processed']) / (batch['num_photos'] * 2)));
            return (
              <SwipeRow key={batch['id']} item={batch} onDelete={this.deleteBatch.bind(this)}>
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
                      Processed: {batch['num_processed']}{'\n'}
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

  processPhotos() {
    if (this.state.photosToProcess <= 0) {
      this.db.selectPhotosToProcess().then((photos) => {
        if (photos.length == 0) {
          return;
        }
        this.setState({
          photosToProcess: photos.length
        }, () => {
          for (photo of photos) {
            fetch(detectorUrl + '/' + photo['id']).then((response) => {
              if (response.status !== 200) {
                console.log("not found: " + photo['id']);
                this.setState(prevState => ({
                  photosToProcess: prevState.photosToProcess - 1
                }));
                return;
              }
              response.json().then((r) => {
                console.log(r);
                if (!r.objects) {
                  this.setState(prevState => ({
                    photosToProcess: prevState.photosToProcess - 1
                  }));
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
              });
            }).catch((err) => {
              console.log(err);
              this.setState(prevState => ({
                photosToProcess: prevState.photosToProcess - 1
              }));
              return;
            });
          }
        });
      });
    }
  }

  uploadPhotos() {
    if (this.state.photosToUpload <= 0) {
      this.db.selectPhotosToUpload().then((photos) => {
        if (photos.length == 0) {
          return;
        }
        this.setState({
          photosToUpload: photos.length
        }, () => {
          for (photo of photos) {
            let path = root + '/' + photo.path;
            Upload.startUpload({
              url: detectorUrl,
              path: path,
              type: 'multipart',
              field: 'image',
              parameters: {
                'lat': photo['location_lat'],
                'lon': photo['location_lon']
              }
            }).then((id) => {
              console.log("waiting for server: " + photo['id']);
              Upload.addListener('error', id, (data) => {
                console.log('error ' + photo['id']);
                console.log(data);
              });
              Upload.addListener('completed', id, (data) => {
                console.log('completed ' + photo['id']);
                if (data.responseCode == 200) {
                  let r = JSON.parse(data.responseBody);
                  this.db.setPhotoUpload(
                    photo['id'],
                    r['upload_id'],
                    r['time']).then(() => {
                      let batchId = photo['batch_id'];
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
                }
              });
            }).catch((err) => {
              console.log(err);
            });
          }
        });
      });
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

  deleteBatch(batch, callback) {
    Alert.alert(
      'Delete Batch ' + batch['id'] + '?', '', [
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
      this.setState({
        isLoading: false,
        batches: batches
      });
    }).catch((error) => {
      console.log(error);
    });
  }
}