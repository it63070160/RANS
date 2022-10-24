import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Modal, Pressable, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios'; // ดึง API
import * as TaskManager from "expo-task-manager" // จัดการ task ตอน tracking
import * as Location from 'expo-location'; // track user location
import { getPreciseDistance } from 'geolib'; // Calculate Distrance between 2 locations
import TimeNotifications from './TimeNotifications';

// *********************** Tracking User Location (Task Manager) ***********************
const LOCATION_TASK_NAME = "LOCATION_TASK_NAME"
let foregroundSubscription = null

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error)
    return
  }
  if (data) {
    // Extract location coordinates from data
    const { locations } = data
    const location = locations[0]
    if (location) {
      console.log("Location in background", location.coords)
    }
  }
})

// Geofencing Task
// TaskManager.defineTask("LOCATION_GEOFENCE", ({ data: { eventType, region }, error }) => {
//   if (error) {
//     // check `error.message` for more details.
//     return;
//   }
//   if (eventType === Location.GeofencingEventType.Enter) {
//     console.log("You've entered region:", region);
//   } else if (eventType === Location.GeofencingEventType.Exit) {
//     console.log("You've left region:", region);
//   }
// });

export default function MapsView() {
  // *********************** Risk Area API ***********************
  // data เก็บข้อมูลจุดเสี่ยง 100 จุดจาก API
  const [data, setData] = useState([]);
  // function GetPosition ดึงข้อมูลจุดเสี่ยง 100 จุดจาก API
  async function GetPosition(){
    try{
      await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?resource_id=db468db2-8450-4867-80fb-5844b5fbd0b4')
              .then(response=>{
                setData(response.data.result.records)
              })
              .catch(error=>{
                console.error(error)
              })
    }catch(err){
      console.error(err)
    }
  }

  useEffect(()=>{
    GetPosition();
  }, [])

  // *********************** Notifications ***********************
  const [modalVisible, setModalVisible] = useState(false);
  const [AlertMe, setAlertMe] = useState(false);

  function closeModal(){
    setModalVisible(false)
  }

  function RiskNotification(){
    const listArea = []
    listRiskArea.map((item, index)=>{
      listArea.push(
        <Text key={index} style={styles.modalText}>
          <Text>{item.detail} </Text>
          <Text style={{fontWeight:'bold'}}>[{item.distrance} เมตร]</Text>
        </Text>)
    })
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          closeModal();
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTextHeader}>พบจุดเสี่ยงใกล้ท่าน</Text>
            {listArea}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => closeModal()}>
              <Text style={styles.textStyle}>❌ (
               <TimeNotifications closeModal={closeModal}/> 
              )</Text>
              
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // *********************** Tracking User Location ***********************
  // position เก็บข้อมูลละติจูดและลองจิจูดของผู้ใช้ **Need Default Value** {latitude: number, longitude: number}
  const [position, setPosition] = useState({latitude: 13.736717, longitude: 100.523186})
  // Calculate Distance between two locations
  const [listRiskArea, setlistRiskArea] = useState([])

  const calculatePreciseDistance = (position, data) => {
    var RiskArea = []
    data.map((item)=>{
      var pdis = getPreciseDistance(
        position,
        item.พิกัด.indexOf(" ")>=0?{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" ")))}:{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",")+1))}
      );
      if(pdis<=1500){
        RiskArea.push({detail: item.รายละเอียด, distrance: pdis})
      }
    })
    console.log(RiskArea)
    if(RiskArea.length>0){
      setModalVisible(true)
    }
    setlistRiskArea(RiskArea)
  };

  // Start location tracking in foreground
  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const { granted } = await Location.getForegroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure that foreground location tracking is not running
    foregroundSubscription?.remove()

    // Start watching position in real-time
    foregroundSubscription = await Location.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: Location.Accuracy.BestForNavigation,
        enableHighAccuracy:true,
        timeInterval: 23000
      },
      location => {
        setPosition(location.coords)
        calculatePreciseDistance(position, data)
      }
    )
  }

  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove()
  }

  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const { granted } = await Location.getBackgroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME)
    if (!isTaskDefined) {
      console.log("Task is not defined")
      return
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      console.log("Already started")
      return
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // For better logs, we set the accuracy to the most sensitive option
      accuracy: Location.Accuracy.BestForNavigation,
      // Make sure to enable this notification if you want to consistently track in the background
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
    })
  }

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log("Location tacking stopped")
    }
  }

  useEffect(()=>{
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync()
      if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
      let location = await Location.getCurrentPositionAsync({});
      setPosition(location.coords)
      // for geofencing หรือ การทำระยะล้อมจุดที่กำหนดและสามารถแจ้งเตือนขณะ user เข้าในระยะ
      // let region = {identifier:"1", latitude: 13.7547773, longitude: 100.5134903, radius:1}
      // Location.startGeofencingAsync("LOCATION_GEOFENCE", [region])
    }
    requestPermissions();
  }, [])

  return (
    <View style={styles.container}>
      <View style={{position: 'absolute', bottom:10, right: 10}}>
        <TouchableOpacity style={styles.bottomButton}>
          <Text style={{fontSize: 20}}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={()=>{AlertMe?stopForegroundUpdate():startForegroundUpdate();setAlertMe(!AlertMe)}}>
          <Text style={{fontSize: 20}}>{AlertMe?'Stop':'Start'}</Text>
        </TouchableOpacity>
      </View>
      <RiskNotification/>
      <MapView style={styles.map} region={{latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
      >
        { data.filter((item)=>item._id<101).map((item, index) => (
          <Marker key={index} pinColor = {"green"} title={"จุดเสี่ยงที่ "+(index+1)+" (จากระบบ)"} description={item.รายละเอียด} coordinate = {item.พิกัด.indexOf(" ")>=0?{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" ")))}:{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",")+1))}}/>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomButton: {
    position:'relative',
    width: 70,
    height: 70,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#F36C6C',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTextHeader: {
    marginBottom: 15,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
