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
import ProfileScreen from './ProfileScreen';
import ConfigScreen from './ConfigScreen';

const ImportScreenNavigator = createStackNavigator({
  LocationScreen: {
    screen: LocationScreen,
    navigationOptions: {
      title: 'Load Card',
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
      title: 'Import',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  }
});


const BatchScreenNavigator = createStackNavigator({
  BatchScreen: {
    screen: BatchScreen,
    navigationOptions: {
      title: 'Card History',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
  PhotoScreen: {
    screen: PhotoScreen,
    navigationOptions: {
      title: 'Gallery',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  }
});

const SightingScreenNavigator = createStackNavigator({
  SightingScreen: {
    screen: SightingScreen,
    navigationOptions: {
      title: 'Sightings',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  },
  PhotoScreen: {
    screen: PhotoScreen,
    navigationOptions: {
      title: 'Gallery',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  }
});

const ProfileScreenNavigator = createStackNavigator({
  ProfileScreen: {
    screen: ProfileScreen,
    navigationOptions: {
      title: 'Profile',
      headerTitleStyle: {
        fontSize: 20
      },
      headerTitleAlign: 'center'
    },
  }
});

const ConfigScreenNavigator = createStackNavigator({
  SightingScreen: {
    screen: ConfigScreen,
    navigationOptions: {
      title: 'Settings',
      headerTitleStyle: {
        fontSize: 20
      },
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
      labelStyle: {
        fontSize: 14,
        //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
      }
    }
  }
);

export default createAppContainer(TabNavigator);
