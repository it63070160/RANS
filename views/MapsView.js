import React, { useCallback } from 'react';
import { StyleSheet, View, Modal, Pressable, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign, Entypo } from '@expo/vector-icons'; // Icon
import axios from 'axios'; // ดึง API
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as TaskManager from "expo-task-manager" // จัดการ task ตอน tracking
import * as Location from 'expo-location'; // track user location
import { getPreciseDistance } from 'geolib'; // Calculate Distrance between 2 locations
import db from '../database/firebaseDB'; // Database
import { collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore"; // firebase
import { Cache } from 'react-native-cache'; // cache
import AsyncStorage from '@react-native-async-storage/async-storage'; // cache storage
import { HeaderButtons, Item } from "react-navigation-header-buttons"; // header button
import CustomHeaderButton from '../components/CustomHeaderButton'; // header button
import TimeNotifications from '../components/TimeNotifications'; // count time
import AddRisk from './AddRisk'; // Add Risk View
import { useFocusEffect } from "@react-navigation/native"; // check user is focus or not
import { encrypt } from '../components/Encryption'; // encrypt device id
import * as Device from 'expo-device'; // get device id
import * as Application from 'expo-application'; // get device id

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

function CheckFocusScreen(props) {
  useFocusEffect(
    useCallback(() => {
      props.CheckFakeRisk();
      props.lightMode();
      return () => {
        props.stopForegroundUpdate();
      };
    }, [])
  );
  return <View />;
}

export default class MapsView extends React.Component {
  constructor(){
    super();
    this.state = {
      data: [],
      listRiskArea: [],
      Ignored_Notification: [],
      position: {latitude: 13.736717, longitude: 100.523186},
      deviceId: "",
      addPress: false,
      AlertMe: false,
      modalVisible: false,
      refresh: false,
      dark: false
    }
    
    this.autoCloseModal = this.autoCloseModal.bind(this)
    this.closeAddModal = this.closeAddModal.bind(this)
    this.stopForegroundUpdate = this.stopForegroundUpdate.bind(this)
    this.handleLightMode = this.handleLightMode.bind(this)
    this.CheckLightMode = this.CheckLightMode.bind(this)
  }
  
  componentDidMount(){
    // ตั้งค่า cache
    this.cache = new Cache({
      namespace: "RANS",
      policy: {
        maxEntries: 50000, // if unspecified, it can have unlimited entries
        stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
      },
      backend: AsyncStorage
    });
    this.unsub = onSnapshot(collection(db, "rans-database"), this.getCollection);
    const { navigation } = this.props
    navigation.setOptions({
      headerRight:()=>(
        <HeaderButtons HeaderButtonComponent={CustomHeaderButton}>
          <Item title='refresh' iconName='refresh' onPress={()=>{
            this.stopForegroundUpdate();
            this.setState({
              refresh:true
            })
            this.GetData();
          }}/>
        </HeaderButtons>
      )
    });
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync()
      if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
      let location = await Location.getCurrentPositionAsync({});
      this.setState({
        position: location.coords
      })
    }
    requestPermissions();
    this.GetDeviceID();
    this.darkMapStyle = [
      {
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#242f3e"
          }
        ]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#746855"
          }
        ]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#242f3e"
          }
        ]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#d59563"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#38414e"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#212a37"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9ca5b3"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#bababa"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#746855"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#1f2835"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#f3d19c"
          }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#2f3948"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#17263c"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#515c6d"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#17263c"
          }
        ]
      }
    ]
    this.defaultMapStyle = []
  }

  componentWillUnmount(){
    this.unsub();
    this.stopForegroundUpdate();
    this.setState({
      AlertMe: false
    })
  }

  // ดึงข้อมูลแบบ Real time
  getCollection = (querySnapshot) => {
    const all_data = [];
    querySnapshot.forEach((res) => {
      const { _id, dislike, like, owner, พิกัด, รายละเอียด, สำนักงานเขต } = res.data();
      all_data.push({
        key: res.id,
        _id, dislike, like, owner, พิกัด, รายละเอียด, สำนักงานเขต
      });
    });
    this.setState({
      data: all_data,
    });
  };

  async GetPosition() {
    try{
    //       // JSON หาก API ล่ม
    //       // const customData = require('../assets/RiskArea.json')
    //       // setData(customData.result.records)
          
      // API
      await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?&resource_id=6cc7a43f-52b3-4381-9a8f-2b8a35c3174a')
              .then(response=>{
                this.setState({
                  data: response.data.result.records
                })
              })
              .catch(error=>{
                console.error(error)
              })
    }catch(err){
      console.error(err)
    }
  }

  // ดึงข้อมูลจาก Firebase Database
  async GetData() {
    const q = query(collection(db, "rans-database"), orderBy("_id", 'asc'));
    const querySnapshot = await getDocs(q);
    const d = querySnapshot.docs.map(doc => doc.data())
    this.setState({
      data: d,
      refresh: false
    })
  }

  // เก็บ Device ID ของผู้ใช้
  async GetDeviceID() {
    if (Device.osName == 'iPadOS' || Device.osName == 'iOS'){
      this.setState({
        deviceId: encrypt(await Application.getIosIdForVendorAsync())
      })
    }
    else{
      this.setState({
        deviceId: encrypt(Application.androidId)
      })
    }
  }
  
  // เมื่อผู้ใช้ปิด Notification
  closeModal() {
    this.setState({
      modalVisible: false
    })
  }

  // ปิด Add Modal ที่ผู้ใช้กดปุ่ม + บน Header
  closeAddModal() {
    this.setState({
      addPress: false
    })
  }

  // เมื่อระบบปิด Notification เอง **แก้ ignore เข้าไม่หมด
  async autoCloseModal() {
    this.setState({
      modalVisible: false
    })
    let ignoreList = []
    let ignoreCache = await this.cache.get("ignoreID")
    let likeCache = await this.cache.get('like');
    let disLikeCache = await this.cache.get('dislike');
    if(ignoreCache==undefined){
      ignoreCache = []
    }
    if(likeCache==undefined){
      likeCache = []
    }
    if(disLikeCache==undefined){
      disLikeCache = []
    }
    if(ignoreCache.length>0){
      ignoreList = ignoreCache
      let newlist = []
      this.state.listRiskArea.map((item)=>{
        if(ignoreCache.indexOf(item.id)<0 && (likeCache.indexOf(item.id)<0 && disLikeCache.indexOf(item.id)<0)){
          newlist.unshift(item.id)
        }
      })
      if(newlist.length>1){
        newlist.map((item)=>{
          ignoreList.unshift(item)
        })
      }else{
        newlist.map((item)=>{
          ignoreList.unshift(item)
        })
        
      }
    }else{
      this.state.listRiskArea.map((item)=>{
        if(likeCache.indexOf(item.id)<0 && disLikeCache.indexOf(item.id)<0){
          ignoreList.push(item.id)
        }
      })
    }
    await this.cache.set('ignoreID', ignoreList)
    this.forceUpdate();
  }

  // คำนวณระยะห่างระหว่างผู้ใช้กับจุดเสี่ยง
  calculatePreciseDistance(position, data) {
    var RiskArea = []
    data.map((item)=>{
      var pdis = getPreciseDistance(
        position,
        item.พิกัด.indexOf(" ")>=0?{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" ")))}:{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",")+1))}
      );
      if(pdis<=300){
        RiskArea.push({detail: item.รายละเอียด, distrance: pdis, id: item._id, like:item.like, dislike:item.dislike})
      }
    })
    
    if(RiskArea.length>0){
      this.setState({
        modalVisible:true
      })
    }
    this.setState({
      listRiskArea: RiskArea
    })
    this.forceUpdate();
  };

  // Start location tracking in foreground
  async startForegroundUpdate() {
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
        // distanceInterval: 1,
        enableHighAccuracy:true,
        timeInterval: 23000
      },
      location => {
        this.setState({
          position: location.coords
        })
        this.calculatePreciseDistance(this.state.position, this.state.data)
      }
    )
  }

  // Stop location tracking in foreground
  async stopForegroundUpdate() {
    foregroundSubscription?.remove()
    this.setState({
      AlertMe:false
    })
  }

  // ตรวจจุดเสี่ยงที่มีคนกด dislike มากกว่าหรือเท่ากับ 100
  async CheckFakeRisk(){
    const q = query(collection(db, "rans-database"), where("dislike", '>=', 100));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (snapDoc) => {
      await deleteDoc(doc(db, "rans-database", snapDoc.id))
      .then(
        console.log("Data Deleted")
      )
    });
  }

  // ตรวจโหมดความสว่างของผู้ใช้จาก Cache ตอนเปิดโปรแกรม
  async CheckLightMode(){
    let lightMode = await this.cache.get("lightMode")
    if(lightMode == undefined){
      this.setState({
        dark: false
      })
      await this.cache.set("lightMode", "light")
    }
    else if(lightMode == "light"){
      this.setState({
        dark: false
      })
    }
    else if(lightMode == "dark"){
      this.setState({
        dark: true
      })
    }
  }

  // เมื่อผู้ใช้กดปุ่ม เพิ่ม/ลด แสง
  async handleLightMode(){
    let lightMode = await this.cache.get("lightMode")
    console.log(lightMode)
    if(lightMode == "light"){
      this.setState({
        dark: true
      })
      await this.cache.set("lightMode", "dark")
    }
    else if(lightMode == "dark"){
      this.setState({
        dark: false
      })
      await this.cache.set("lightMode", "light")
    }
  }

  // Component Function เมื่อมีการกดปุ่ม + บน Header
  AddNewRisk = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.addPress}
        onRequestClose={() => {
          this.closeAddModal();
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalViewWithMap}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={()=>{this.setState({addPress:false})}}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
            <AddRisk closeAddModal={this.closeAddModal}/>
          </View>
        </View>
      </Modal>
    )
  }

  // Component Function การแจ้งเตือนเมื่อมีจุดเสี่ยงใกล้ผู้ใช้
  RiskNotification=()=>{
    const listArea = []
    let countItem = 0
    this.state.listRiskArea.sort((a,b) => (a.distrance > b.distrance) ? 1 : ((b.distrance > a.distrance) ? -1 : 0))
    this.state.listRiskArea.map((item, index)=>{
      if(item.distrance<=250){
        countItem++
        listArea.push(
          <View key={index}>
            <Text style={styles.modalText}>
              <Text style={{color:item.like >= 50 ? "red" : item.like >= 25 ? "orange" : "green"}}>{item.detail} </Text>
              <Text>[{item.distrance} เมตร]</Text>
            </Text>
          </View>
        )
      }
    })
    if(countItem==0){
      this.state.listRiskArea.map((item, index)=>{
        listArea.push(
          <View key={index}>
            <Text style={styles.modalText}>
              <Text style={{color:item.like >= 50 ? "red" : item.like >= 25 ? "orange" : "green"}}>{item.detail} </Text>
              <Text>[{item.distrance} เมตร]</Text>
            </Text>
          </View>
        )
      })
    }
    if(listArea.length!=this.state.listRiskArea.length){
      listArea.push(
        <Text key={countItem} style={{fontWeight:'bold'}}>... and {this.state.listRiskArea.length-countItem} more</Text>
      )
    }
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.modalVisible}
        onRequestClose={() => {
          this.closeModal();
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTextHeader}>พบจุดเสี่ยงใกล้ท่าน ({this.state.listRiskArea.length} จุด)</Text>
            {listArea}
            <View style={{flexDirection: 'row'}}>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => this.closeModal()}>
                <Text style={styles.textStyle}>❌ (
                <TimeNotifications autoCloseModal={this.autoCloseModal}/> 
                )</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  render(){
    return (
      <View style={styles.container}>
        {this.state.refresh?<ActivityIndicator style={styles.loading} color={'green'} size={'large'}/>:
        <>
        <View style={styles.topRightContainer}>
          <TouchableOpacity style={styles.topRightButton} onPress={() => { this.handleLightMode() } }>
            <Entypo name={this.state.dark?"light-up":"light-down"} size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={() => { this.stopForegroundUpdate();this.setState({addPress:true}) } }>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomButton, {backgroundColor:this.state.AlertMe ? "#F36C6C":"#6BF38B"}]} onPress={() => { this.state.AlertMe ? this.stopForegroundUpdate() : this.startForegroundUpdate();this.setState({AlertMe: !this.state.AlertMe}); }}>
            <Text style={{ fontSize: 20 }}>{this.state.AlertMe ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
        </View>
        <CheckFocusScreen lightMode={this.CheckLightMode} CheckFakeRisk={this.CheckFakeRisk} stopForegroundUpdate={this.stopForegroundUpdate}/>
        <this.AddNewRisk/>
        <this.RiskNotification />
        <MapView style={styles.map} 
            region={{ latitude: this.state.position.latitude, longitude: this.state.position.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            customMapStyle={this.state.dark?this.darkMapStyle:this.defaultMapStyle}
        >
          {this.state.data.map((item, index) => (
            <Marker key={index} pinColor={item.like >= 50 ? "red" : item.like >= 25 ? "yellow" : "green"} title={"จุดเสี่ยงที่ " + (item._id) + (item.like >= 50 ? " (อันตราย)" : item.like >= 25 ? " (โปรดระวัง)" : "")} description={item.รายละเอียด} coordinate={item.พิกัด.indexOf(" ") >= 0 ? { latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" "))) } : { latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",") + 1)) }} />
          ))}
        </MapView>
        </>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonContainer:{
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 3
  },
  bottomButton: {
    position:'relative',
    width: 70,
    height: 70,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 40,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  topRightContainer: {
    position: 'absolute',
    top: 50,
    right: 6.8,
    zIndex: 3,
    opacity: 0.7
  },
  topRightButton: {
    position:'relative',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 7,
    backgroundColor: '#fff',
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
  modalViewWithMap: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCloseButton: {
    position: 'absolute',
    top: '3%',
    right: '5%'
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    margin: 2
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
