import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Text,
  View,
  Switch,
  ScrollView,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import RNFS from 'react-native-fs';

import Database from './Database';

import style from './style';

import User from './User';

const root = RNFS.DocumentDirectoryPath;

export default class ConfigScreen extends React.Component {

  constructor(props) {
    super(props);
    this.db = new Database();
    this.state = {};
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    let config = this.state.config;
    if (!config) {
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
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Discard Empty Photos</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#4E603E' }}
                onValueChange={(v) => this.toggle('discard_empty', v)}
                value={config.get('discard_empty') == 'true'}
              />
            </View>
            <Text style={style.t1}>During object detection, automatically discard photos with no recognizable objects (Recommended).</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Time Range Filter</Text>
            </View>
            <Picker
              selectedValue={config.get('lookback_days')}
              style={{ width: '100%' }}
              itemStyle={{ height: 80 }}
              onValueChange={(itemValue, itemIndex) => this.pickLookbackDays(itemValue)}>
              <Picker.Item label="last 2 weeks" value="14" />
              <Picker.Item label="last month" value="30" />
              <Picker.Item label="last 3 months" value="90" />
              <Picker.Item label="last 6 months" value="180" />
              <Picker.Item label="last year" value="360" />
              <Picker.Item label="last 2 years" value="720" />
              <Picker.Item label="all time" value="0" />
            </Picker>
            <Text style={style.t1}>Only see results within the specified time range.</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Remove Data</Text>
            </View>
            <View style={{ height: 20 }} />
            <TouchableOpacity style={style.button} onPress={() => {
              Alert.alert(
                'Delete ' + this.state.archive.length + ' photos?', '', [
                {
                  text: 'Yes',
                  onPress: () => {
                    for (photo of this.state.archive) {
                      this.db.deletePhotoObjects(photo.photo_id).then(() => {
                        this.db.deletePhoto(photo.photo_id).then(() => {
                          let path = root + '/' + photo.photo_path;
                          console.log("deleting " + path);
                          RNFS.exists(path).then((exists) => {
                            if (exists) {
                              RNFS.unlink(path);
                            }
                          });
                          let thumbPath = RNFS.CachesDirectoryPath + '/thumb_' + photo.photo_id + '.jpg';;
                          console.log("deleting " + thumbPath);
                          RNFS.exists(thumbPath).then((exists) => {
                            if (exists) {
                              RNFS.unlink(thumbPath);
                            }
                          });
                          for (object of photo.objects) {
                            let cropPath = RNFS.CachesDirectoryPath + '/crop_' + object.id + '.jpg';
                            console.log("deleting " + cropPath);
                            RNFS.exists(cropPath).then((exists) => {
                              if (exists) {
                                RNFS.unlink(cropPath);
                              }
                            });
                          }
                          this.fetchData();
                        });
                      });
                    }
                  }
                }, { text: 'No' }], { cancelable: false });
            }}>
              <Text style={style.h1}>Delete {this.state.archive.length} Photos</Text>
            </TouchableOpacity>
            <View style={{ height: 10 }} />
            <Text style={style.t1}>Remove unused data outside the time range.</Text>
          </View>
          {/*
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Sync Archive</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#4E603E' }}
                onValueChange={(v) => this.toggle('auto_archive', v)}
                value={config.get('auto_archive') == 'true'}
              />
            </View>
            <Text style={style.t1}>Automatically copy archive data to cloud storage (Recommended).</Text>
          </View>
          {config.get('auto_archive') == 'true' &&
            <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
              <View style={style.config}>
                <Text style={style.h2}>Google Drive Key</Text>
                <TextInput secureTextEntry={true} style={style.h2}>{config.get('google_drive_key')}</TextInput>
              </View>
              <Text style={style.t1}>Provide Google Drive API Key</Text>
            </View>
          }
        */}
        </ScrollView>
      </SafeAreaView >
    );
  }

  toggle(key, value) {
    this.db.updateConfig(key, new Boolean(value).toString()).then(() => {
      this.fetchData();
    });
  }

  pickLookbackDays(days) {
    this.db.updateConfig('lookback_days', days).then(() => {
      this.fetchData();
    });
  }

  fetchData() {
    this.db.selectConfig().then((config) => {
      User.getUser().then((user) => {
        this.db.selectArchive().then((archive) => {
          this.setState({
            config: config,
            user: user,
            archive: archive
          });
        });
      })
    }).catch((error) => {
      console.log(error);
    });
  }

}