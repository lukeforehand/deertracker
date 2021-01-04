import { StyleSheet, Dimensions } from 'react-native';
//fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'

export default StyleSheet.create({
  h1: {
    color: '#C1CDCD',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 20,
    margin: 10,
  },
  t1: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'normal',
    margin: 10,
    fontSize: 18
  },
  activity: {
    flex: 1,
    justifyContent: 'center'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    position: 'absolute',
    top: '50%'
  },
  button: {
    backgroundColor: 'darkred',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  modal: {
    marginTop: 170,
    marginLeft: 25,
    marginRight: 25,
    maxHeight: 90,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10
  }
});
