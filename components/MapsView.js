import MapView, {Marker} from 'react-native-maps';
import { StyleSheet, View, Button } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import * as TaskManager from "expo-task-manager"
import * as Location from 'expo-location';

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

export default function MapsView() {
  const [data, setData] = useState([]);

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

  // Define position state: {latitude: number, longitude: number}
  const [position, setPosition] = useState({latitude: 13.736717, longitude: 100.523186})

  // Request permissions right after starting the app
  useEffect(() => {
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync()
      if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
    }
    requestPermissions()
  }, [])

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
      },
      location => {
        setPosition(location.coords)
      }
    )
  }

  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove()
    setPosition({latitude: 13.736717, longitude: 100.523186})
  }

  // Start location tracking in background
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
    }
    requestPermissions()
    GetPosition();
  }, [])

  return (
    <View style={styles.container}>
      <Button title="start" onPress={startForegroundUpdate}/>
      <Button title="stop" onPress={stopForegroundUpdate}/>
      {/* <MapView style={styles.map} region={{latitude: 13.736717, longitude: 100.523186, latitudeDelta: 0.005, longitudeDelta: 0.005 }}> */}
      <MapView style={styles.map} region={{latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}>
        <Marker title={"You"} coordinate={position}/>
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
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  map: {
    width: '100%',//Dimensions.get('window').width,
    height: '100%',//Dimensions.get('window').height,
  },
});
