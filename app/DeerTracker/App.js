import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import LocationScreen from './LocationScreen';
import AddLocationScreen from './AddLocationScreen';
import ImportScreen from './ImportScreen';

import BatchScreen from './BatchScreen';

const ImportScreenNavigator = createStackNavigator({
  LocationScreen: {
    screen: LocationScreen,
    navigationOptions: {
      title: 'Location',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
  AddLocationScreen: {
    screen: AddLocationScreen,
    navigationOptions: {
      title: 'Add Location',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
  ImportScreen: {
    screen: ImportScreen,
    navigationOptions: {
      title: 'Photos',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
});


const BatchScreenNavigator = createStackNavigator({
  BatchScreen: {
    screen: BatchScreen,
    navigationOptions: {
      title: 'Batches',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
});


const TabNavigator = createBottomTabNavigator(
  {
    Import: {
      screen: ImportScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Pull Card',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='upload' style={{ transform: [{ rotateX: '180deg' }] }} color={tintColor} size={20} />
        )
      }
    },
    Photos: {
      screen: BatchScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Photos',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='camera' color={tintColor} size={20} />
        )
      }
    },
  },
  {
    tabBarOptions: {
      labelStyle: {
        fontSize: 14,
        //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      }
    }
  }
);

export default createAppContainer(TabNavigator);
