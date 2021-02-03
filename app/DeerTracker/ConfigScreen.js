import React from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  Text,
  TextInput,
  View,
  Switch,
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
        <View>
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
              <Text style={style.h2}>Lookback Period</Text>
            </View>
            <Text style={style.t1}>Time period used for fetching data.</Text>
            <Picker
              selectedValue={config.get('lookback_days')}
              style={{ width: '100%' }}
              itemStyle={{ height: 80 }}
              onValueChange={(itemValue, itemIndex) => this.pickLookbackDays(itemValue)}>
              <Picker.Item label="1 month" value="30" />
              <Picker.Item label="2 months" value="60" />
              <Picker.Item label="3 months" value="90" />
              <Picker.Item label="6 months" value="180" />
              <Picker.Item label="1 year" value="360" />
              <Picker.Item label="2 years" value="720" />
              <Picker.Item label="All time" value="0" />
            </Picker>
          </View>
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Auto Archive Photos</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#4E603E' }}
                onValueChange={(v) => this.toggle('auto_archive', v)}
                value={config.get('auto_archive') == 'true'}
              />
            </View>
            <Text style={style.t1}>Automatically move old photos to cloud storage over time (Recommended).</Text>
            {config.get('auto_archive') == 'true' &&
              <Picker
                selectedValue={config.get('auto_archive_days')}
                style={{ width: '100%' }}
                itemStyle={{ height: 80 }}
                onValueChange={(itemValue, itemIndex) => this.pickArchiveDays(itemValue)}>
                <Picker.Item label="after 3 days" value="3" />
                <Picker.Item label="after 1 week" value="7" />
                <Picker.Item label="after 2 weeks" value="14" />
                <Picker.Item label="after 1 month" value="30" />
              </Picker>
            }
          </View>
          <View style={{ borderWidth: 1, borderColor: 'grey', padding: 5 }}>
            <View style={style.config}>
              <Text style={style.h2}>Google Drive Key</Text>
              <TextInput secureTextEntry={true} style={style.h2}>{config.get('google_drive_key')}</TextInput>
            </View>
            <Text style={style.t1}>Provide Google Drive API Key</Text>
          </View>
        </View>
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

  pickArchiveDays(days) {
    this.db.updateConfig('auto_archive_days', days).then(() => {
      this.fetchData();
    });
  }

  fetchData() {
    this.db.selectConfig().then((config) => {
      this.setState({
        config: config
      });
    }).catch((error) => {
      console.log(error);
    });
  }

}