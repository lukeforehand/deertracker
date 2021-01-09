import React from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Text,
  Image,
  View,
  TouchableOpacity
} from 'react-native';

import ImageViewer from 'react-native-image-zoom-viewer';

import RNFS from 'react-native-fs';

import Moment from 'moment';

import SwipeRow from './SwipeRow';
import Database from './Database';

import style from './style';

export default class BatchScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true, modalVisible: false }
  }

  static getDerivedStateFromProps(props, state) {
    // state may come from initial fetch, or from ImportScreen
    batches = props.navigation.getParam('batches');
    return batches === undefined || batches === state.batches ? {} : {
      batches: batches
    };
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
        <ScrollView>
          {this.state.batches.map((batch) => {
            return (
              <SwipeRow key={batch['id']} item={batch} onDelete={this.deleteBatch.bind(this)}>
                <TouchableOpacity
                  key={batch['id']}
                  style={style.locationButton}
                  onPress={() => { this.getPhotos(batch['id']) }}
                >
                  <Text style={style.h3}>
                    {Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}
                  </Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={style.t4}>
                      Batch {batch['id']}{'\n'}
                    Location: {batch['location_name']}{'\n'}
                    Photos:{batch['num_photos']}{'\n'}
                    </Text>
                    <View>
                      {batch['photo_path'] &&
                        <Image source={{ uri: batch['photo_path'] }} style={style.smallThumbnail} />
                      }
                    </View>
                  </View>
                </TouchableOpacity>
              </SwipeRow>
            );
          })}
          <Modal visible={this.state.modalVisible} transparent={true}>
            <ImageViewer imageUrls={this.state.imageUrls}
              enableSwipeDown={true}
              swipeDownThreshold={80}
              onSwipeDown={() => { this.setState({ modalVisible: false }) }}
            />
          </Modal>
        </ScrollView>
      </SafeAreaView >
    );
  }

  getPhotos(batchId) {
    this.db.selectBatchPhotos(batchId).then((photos) => {
      if (photos.length > 0) {
        this.setState({
          modalVisible: true,
          imageUrls: photos.map((photo) => {
            return {
              url: photo.path
            };
          })
        })
      }
    });
  }

  deleteBatch(batch, callback) {
    Alert.alert(
      'Delete Batch ' + batch['id'] + '?', '', [
      {
        text: 'Yes',
        onPress: () => {
          this.db.deleteBatch(batch['id']).then(() => {
            RNFS.unlink(RNFS.DocumentDirectoryPath + '/.data/batch/' + batch['id']);
            this.db.selectBatches().then((batches) => {
              this.setState({
                batches: batches
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