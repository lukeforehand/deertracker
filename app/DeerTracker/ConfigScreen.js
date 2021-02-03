import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Text,
  TextInput,
  View,
  Switch,
  ScrollView,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import Database from './Database';

import style from './style';

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
              <Text style={style.h2}>Data will be archived</Text>
            </View>
            <Picker
              selectedValue={config.get('lookback_days')}
              style={{ width: '100%' }}
              itemStyle={{ height: 80 }}
              onValueChange={(itemValue, itemIndex) => this.pickLookbackDays(itemValue)}>
              <Picker.Item label="after 1 month" value="30" />
              <Picker.Item label="after 2 months" value="60" />
              <Picker.Item label="after 3 months" value="90" />
              <Picker.Item label="after 6 months" value="180" />
              <Picker.Item label="after 1 year" value="360" />
              <Picker.Item label="after 2 years" value="720" />
              <Picker.Item label="Never" value="0" />
            </Picker>
            <Text style={style.t1}>Archive data will not be displayed or used in calculations.</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Remove archive data</Text>
            </View>
            <View style={{ height: 15 }} />
            <TouchableOpacity style={style.button} onPress={() => {
              Alert.alert(
                'Delete ' + this.state.archiveCount + ' photos?', '', [
                {
                  text: 'Yes',
                  onPress: () => {
                    //TODO: write me
                    //this.db.deleteProfile(profile.profile_id).then(() => {
                    //  this.fetchData();
                    //});
                  }
                },
                { text: 'No' }], { cancelable: false });
            }}>
              <Text style={style.h1}>Delete {this.state.archiveCount} Photos</Text>
            </TouchableOpacity>
            <Text style={style.t1}>Delete archive data from device.</Text>
          </View>
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
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Google Drive Key</Text>
              <TextInput secureTextEntry={true} style={style.h2}>{config.get('google_drive_key')}</TextInput>
            </View>
            <Text style={style.t1}>Provide Google Drive API Key</Text>
          </View>
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
      this.db.selectArchivePhotoCount().then((photoCount) => {
        this.setState({
          config: config,
          archiveCount: photoCount
        });
      });
    }).catch((error) => {
      console.log(error);
    });
  }

}