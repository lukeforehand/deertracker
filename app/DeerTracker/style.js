import { StyleSheet, Dimensions } from 'react-native';
//fontFamily: Platform.OS === 'ios' ? 'Metamorphous' : 'metamorphous_regular'

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
export const thumbWidth = screenWidth / 2;
export const thumbHeight = thumbWidth * (3 / 4);
export const photoWidth = screenWidth;
export const photoHeight = photoWidth * (4 / 4);

export const footerHeight = 50;
export const headerHeight = 65;

export default StyleSheet.create({
  header: {
    fontSize: 18
  },
  h1: {
    color: '#e3e8e8',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    margin: 10
  },
  h2: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 18,
    marginLeft: 10,
    marginRight: 10
  },
  h3: {
    color: '#e3e8e8',
    backgroundColor: '#4E603E',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    padding: 10
  },
  h4: {
    color: '#e3e8e8',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16
  },
  h5: {
    color: '#e3e8e8',
    backgroundColor: '#4E603E',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    padding: 10
  },
  h6: {
    color: '#e3e8e8',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
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
    fontSize: 16,
    margin: 15
  },
  t3: {
    color: 'black',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    margin: 15
  },
  t4: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    margin: 10
  },
  t5: {
    color: 'black',
    textAlign: 'left',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
    paddingBottom: 10,
    paddingTop: 5,
    paddingLeft: 10
  },
  t6: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
  },
  t7: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16
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
    borderRadius: 10,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#4E603E',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  mapButton: {
    width: screenWidth - 40 - 40 - 40,
    marginLeft: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#4E603E',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  locationArrow: {
    color: 'blue',
    borderRadius: 10,
    margin: 15,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40
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
    borderRadius: 10,
    marginTop: 110,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  profileModal: {
    borderRadius: 10,
    marginTop: 60,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  saveProfileModal: {
    height: 100,
    borderRadius: 10,
    marginTop: 20 + 280,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  saveToCameraButton: {
    borderRadius: 10,
    marginTop: 280,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#4E603E',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10
  },
  locationButton: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1
  },
  sightingButton: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#4E603E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightButton: {
    borderRadius: 10,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgb(255, 103, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    position: 'absolute',
    bottom: 15,
    width: screenWidth - 120,
  },
  highlightButtonText: {
    color: '#e3e8e8',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontSize: 16,
  },
  thumbnail: {
    borderWidth: 1,
    borderColor: 'grey'
  },
  smallThumbnail: {
    width: thumbWidth,
    height: thumbHeight,
    marginBottom: 10
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
    height: 100,
  },
  importScreenBottom: {
    height: screenHeight - 100 - headerHeight - footerHeight
  },
  config: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryMenu: {
    width: screenWidth / 2 - 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'gray',
    paddingTop: 10,
    marginLeft: 20,
    marginRight: 20,
    paddingBottom: 5,
  },
  galleryButton: {
    borderRadius: 10,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#4E603E',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  picker: {
    backgroundColor: 'black',
    height: 180
  }
});
