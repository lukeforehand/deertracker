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

import Moment from 'moment';

import SwipeRow from './SwipeRow';
import Database from './Database';

import style from './style';

const root = RNFS.DocumentDirectoryPath;

export default class BatchScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = { isLoading: true }
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
        <ScrollView style={{ height: '100%' }}>
          {this.state.batches && this.state.batches.length <= 0 &&
            <Text style={style.t3}>No Photos found, please Load Card.</Text>
          }
          {this.state.batches.map((batch) => {
            return (
              <SwipeRow key={batch['id']} item={batch} onDelete={this.deleteBatch.bind(this)}>
                <TouchableOpacity
                  key={batch['id']}
                  style={style.locationButton}
                  onPress={() => { this.getPhotos(batch['id']) }}>
                  <Text style={style.h3}>
                    {Moment(new Date(batch['time'])).format('ddd, MMM Do YYYY hh:mm A')}
                  </Text>
                  <Text style={style.h2}>{batch['location_name']}</Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={style.t4}>
                      Batch {batch['id']}{'\n'}
                      Photos:{batch['num_photos']}
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