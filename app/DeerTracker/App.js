import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import LocationScreen from './LocationScreen';
import AddLocationScreen from './AddLocationScreen';
import ImportScreen from './ImportScreen';

import BatchScreen from './BatchScreen';
import PhotoScreen from './PhotoScreen';
import SightingScreen from './SightingScreen';
import ReviewScreen from './ReviewScreen';
import ProfileListScreen from './ProfileListScreen';
import ProfileScreen from './ProfileScreen';
import ConfigScreen from './ConfigScreen';

import style, { headerHeight, footerHeight } from './style';

const ImportScreenNavigator = createStackNavigator({
  LocationScreen: {
    screen: LocationScreen,
    navigationOptions: {
      title: 'Load Card',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  AddLocationScreen: {
    screen: AddLocationScreen,
    navigationOptions: {
      title: 'Add Location',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  ImportScreen: {
    screen: ImportScreen,
    navigationOptions: {
      title: 'Import',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  }
});


const BatchScreenNavigator = createStackNavigator({
  BatchScreen: {
    screen: BatchScreen,
    navigationOptions: {
      title: 'Card History',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  PhotoScreen: {
    screen: PhotoScreen,
    navigationOptions: {
      title: 'Gallery',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  }
});

const SightingScreenNavigator = createStackNavigator({
  SightingScreen: {
    screen: SightingScreen,
    navigationOptions: {
      title: 'Sightings',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  ReviewScreen: {
    screen: ReviewScreen,
    navigationOptions: {
      title: 'New Sightings',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  PhotoScreen: {
    screen: PhotoScreen,
    navigationOptions: {
      title: 'Gallery',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  }
});

const ProfileScreenNavigator = createStackNavigator({
  ProfileListScreen: {
    screen: ProfileListScreen,
    navigationOptions: {
      title: 'Profiles',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  ProfileScreen: {
    screen: ProfileScreen,
    navigationOptions: {
      title: 'Profile',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  },
  PhotoScreen: {
    screen: PhotoScreen,
    navigationOptions: {
      title: 'Gallery',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  }
});

const ConfigScreenNavigator = createStackNavigator({
  ConfigScreen: {
    screen: ConfigScreen,
    navigationOptions: {
      title: 'Settings',
      headerStyle: { height: headerHeight },
      headerTitleStyle: style.header,
      headerTitleAlign: 'center'
    },
  }
});


const TabNavigator = createBottomTabNavigator(
  {
    Import: {
      screen: ImportScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Load Card',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='upload' color={tintColor} size={18} />
        )
      }
    },
    History: {
      screen: BatchScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'History',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='camera' color={tintColor} size={18} />
        )
      }
    },
    Sightings: {
      screen: SightingScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Sightings',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='eye' color={tintColor} size={18} />
        )
      },
    },
    Profiles: {
      screen: ProfileScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Profiles',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='paw' color={tintColor} size={18} />
        )
      },
    },
    Settings: {
      screen: ConfigScreenNavigator,
      navigationOptions: {
        tabBarLabel: 'Settings',
        tabBarIcon: ({ tintColor }) => (
          <Icon name='cog' color={tintColor} size={18} />
        )
      },
    },
  },
  {
    tabBarOptions: {
      style: { height: footerHeight },
      labelStyle: {
        fontSize: 12,
        //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      }
    }
  }
);

export default createAppContainer(TabNavigator);
