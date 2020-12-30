import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  h1: {
    color: '#C1CDCD',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    paddingTop: 10,
    fontSize: 16,
    //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
  },
  t1: {
    color: '#C1CDCD',
    textAlign: 'left',
    fontWeight: 'normal',
    marginLeft: '5%',
    marginRight: '5%',
    lineHeight: 24,
    fontSize: 18,
    //fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'
  },
  activity: {
    flex: 1,
    justifyContent: 'center'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});
