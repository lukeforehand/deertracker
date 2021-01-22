import { StyleSheet, Dimensions } from 'react-native';
//fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
export const thumbWidth = screenWidth / 2;
export const thumbHeight = thumbWidth * (9 / 16);
export const photoWidth = screenWidth;
export const photoHeight = photoWidth * (9 / 16);

export default StyleSheet.create({
  h1: {
    color: '#e3e8e8',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 20,
    margin: 10
  },
  h2: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 20,
    margin: 10
  },
  h3: {
    color: '#e3e8e8',
    backgroundColor: '#4E603E',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 18,
    padding: 10
  },
  t1: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'normal',
    margin: 10,
    fontSize: 18
  },
  t2: {
    color: 'black',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 20,
    margin: 10
  },
  t3: {
    color: 'black',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 18,
    margin: 20
  },
  t4: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 18,
    margin: 10
  },
  t5: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 18,
    paddingBottom: 10,
    paddingTop: 5,
    paddingLeft: 10
  },
  t6: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 20
  },
  activity: {
    paddingTop: screenHeight / 2,
    height: '100%',
    flex: 1,
    justifyContent: 'center'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: screenWidth,
    height: screenHeight,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    position: 'absolute',
    top: '50%'
  },
  button: {
    borderRadius: 2,
    margin: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: '#4E603E',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60
  },
  locationArrow: {
    color: 'blue',
    borderRadius: 2,
    margin: 25,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50
  },
  marker: {
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    width: 30,
    height: 30
  },
  modal: {
    borderRadius: 2,
    marginTop: 110,
    marginLeft: 20,
    marginRight: 20,
    maxHeight: 90,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10
  },
  locationButton: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderRadius: 2,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    padding: 5
  },
  thumbnail: {
    borderWidth: 1,
    borderColor: 'grey'
  },
  smallThumbnail: {
    width: thumbWidth / 1.25,
    height: thumbHeight / 1.25,
    borderWidth: 1,
    borderColor: 'grey',
    margin: 10
  },
  photoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: 'black'
  },
  photo: {
    width: photoWidth,
    height: photoHeight
  },
  importScreenTop: {
    height: 150,
  },
  importScreenBottom: {
    height: screenHeight - 150 - 100, // tab nav
  },
  config: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryMenu: {
    height: screenHeight / 4,
    width: screenWidth / 2
  },
  galleryButton: {
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
    marginBottom: screenHeight / 8
  },
  picker: {
    top: 0,
    backgroundColor: 'black'
  },
  pickerItem: {
    height: 150,
    color: 'white'
  }
});
