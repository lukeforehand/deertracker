import { StyleSheet, Dimensions } from 'react-native';

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
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
  },
  h1: {
    color: '#e3e8e8',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    margin: 10
  },
  h2: {
    color: 'black',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    marginLeft: 10,
    marginRight: 10
  },
  h3: {
    color: '#e3e8e8',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    padding: 10,
  },
  h4: {
    color: '#e3e8e8',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
  },
  h5: {
    color: '#e3e8e8',
    backgroundColor: '#4E603E',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    padding: 10
  },
  h6: {
    color: '#e3e8e8',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    padding: 10,
  },
  t1: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'normal',
    margin: 10,
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
  },
  t2: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    margin: 15
  },
  t3: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    margin: 15
  },
  t4: {
    color: 'black',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    margin: 10
  },
  t5: {
    color: 'black',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    paddingBottom: 10,
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 10
  },
  t6: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
  },
  t7: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
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
  sightingMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1
  },
  markerContainer: {
    top: -42,
    left: 18
  },
  markerLabel: {
    color: '#e3e8e8',
    fontWeight: 'normal',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal'
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
    width: screenWidth - 40 - 40 - 40 - 40,
    marginLeft: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  locationArrow: {
    color: '#e3e8e8',
    borderRadius: 10,
    margin: 15,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
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
  subscribeModal: {
    borderRadius: 10,
    marginTop: 120,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10
  },
  profileModal: {
    borderRadius: 10,
    marginTop: 60,
    marginLeft: 60,
    marginRight: 60,
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
  shareButton: {
    borderRadius: 10,
    marginTop: 280,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10
  },
  itemHeader: {
    backgroundColor: '#4E603E',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButton: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1
  },
  highlightButton: {
    borderRadius: 10,
    marginLeft: 60,
    marginRight: 60,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
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
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'courier',
  },
  subscribeButton: {
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
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
    backgroundColor: 'rgba(255, 103, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  picker: {
    backgroundColor: 'black',
    height: 180
  },
  moon: {
    borderRadius: 50, shadowColor: '#000',
    shadowOpacity: 1.0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5
  }

});
