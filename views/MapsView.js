import React, { useCallback } from 'react';
import { StyleSheet, View, Modal, Pressable, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons'; // Icon
import axios from 'axios'; // ดึง API
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as TaskManager from "expo-task-manager" // จัดการ task ตอน tracking
import * as Location from 'expo-location'; // track user location
import { getPreciseDistance } from 'geolib'; // Calculate Distrance between 2 locations
import db from '../database/firebaseDB'; // Database
import { collection, query, where, getDocs, orderBy, onSnapshot} from "firebase/firestore"; // firebase
import { Cache } from 'react-native-cache'; // cache
import AsyncStorage from '@react-native-async-storage/async-storage'; // cache storage
import { HeaderButtons, Item } from "react-navigation-header-buttons"; // header button
import CustomHeaderButton from '../components/CustomHeaderButton'; // header button
import TimeNotifications from '../components/TimeNotifications'; // count time
import AddRisk from './AddRisk'; // Add Risk View
import { useFocusEffect } from "@react-navigation/native";
import { encrypt } from '../components/Encryption';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

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

// export default function MapsView({ navigation, route }) {
//   const [addPress, setAddPress] = useState(false); // boolean ผู้ใช้กดปุ่ม add บน Header หรือไม่
//   const [refresh, setRefresh] = useState(false); // boolean ผู้ใช้กดปุ่ม add บน Header หรือไม่
//   const [data, setData] = useState([]); // data เก็บข้อมูลจุดเสี่ยง
//   const [position, setPosition] = useState({latitude: 13.736717, longitude: 100.523186}) // position เก็บข้อมูลละติจูดและลองจิจูดของผู้ใช้ **Need Default Value** {latitude: number, longitude: number}
//   const [listRiskArea, setlistRiskArea] = useState([]) // Calculate Distance between two locations
//   const [deviceId, setDeviceId] = useState("")
//   // *********************** Notifications ***********************
//   const [modalVisible, setModalVisible] = useState(false);
//   const [AlertMe, setAlertMe] = useState(false);
//   const [Ignored_Notification, setIgnored_Notification] = useState([])

//   // function GetPosition ดึงข้อมูลจุดเสี่ยง 100 จุดจาก API
//   async function GetPosition(){
//     try{
//       // JSON หาก API ล่ม
//       // const customData = require('../assets/RiskArea.json')
//       // setData(customData.result.records)
      
//       // API
//       await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?&resource_id=6cc7a43f-52b3-4381-9a8f-2b8a35c3174a')
//               .then(response=>{
//                 setData(response.data.result.records)
//               })
//               .catch(error=>{
//                 console.error(error)
//               })
//     }catch(err){
//       console.error(err)
//     }
//   }

//   // ดึงข้อมูลจาก Firebase Database
//   async function GetData() {
//     const q = query(collection(db, "rans-database"), orderBy("_id", 'asc'));
//     const querySnapshot = await getDocs(q);
//     const d = querySnapshot.docs.map(doc => doc.data())
//     setData(d)
//     setRefresh(false)
//   }

//   async function GetDeviceID() {
//     if (Device.osName == 'iPadOS' || Device.osName == 'iOS'){
//       setDeviceId(encrypt(await Application.getIosIdForVendorAsync()))
//     }
//     else{
//       setDeviceId(encrypt(Application.androidId))
//     }
//   }

//   useEffect(()=>{
//     GetData();
//     GetDeviceID();
//   }, [])

//   // เมื่อผู้ใช้ปิด Notification
//   function closeModal(){
//     setModalVisible(false)
//   }

//   // เมื่อระบบปิด Notification เอง
//   function autoCloseModal(){
//     let alreadyIgnore = false
//     setModalVisible(false)
//     listRiskArea.map((item)=>{
//       if(Ignored_Notification.length>0){
//         Ignored_Notification.map((Ignoreitem)=>{
//           if(Ignoreitem.id==item.id){
//             alreadyIgnore = true
//           }
//         })
//         if(alreadyIgnore == false){
//           setIgnored_Notification((prevIgnored_Notification)=>([...prevIgnored_Notification, item]))
//         }
//       }else{
//         setIgnored_Notification([item])
//       }
//     })
//     console.log("autoClose", Ignored_Notification)
//   }

//   // Component Function แสดง Notification เมื่อผู้ใช้ใกล้จุดเสี่ยง
//   function RiskNotification(){
//     const listArea = []
//     listRiskArea.sort((a,b) => (a.distrance > b.distrance) ? 1 : ((b.distrance > a.distrance) ? -1 : 0))
//     listRiskArea.map((item, index)=>{
//       listArea.push(
//         <View key={index}>
//           <Text style={[styles.modalText, {fontWeight:item.distrance<=100?"bold":"normal"}]}>
//             <Text style={{color:item.like >= 50 ? "red" : item.like >= 25 ? "orange" : "green"}}>{item.detail} </Text>
//             <Text>[{item.distrance} เมตร]</Text>
//           </Text>
//         </View>
//       )
//     })
//     if(listArea.length>3){
//       let alllength = listArea.length
//       listArea.splice(3, listArea.length)
//       listArea.push(
//         <Text key={alllength} style={{fontWeight:'bold'}}>... and {alllength-3} more</Text>
//       )
//     }
//     return (
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => {
//           closeModal();
//         }}>
//         <View style={styles.centeredView}>
//           <View style={styles.modalView}>
//             <Text style={styles.modalTextHeader}>พบจุดเสี่ยงใกล้ท่าน ({listRiskArea.length} จุด)</Text>
//             {listArea}
//             <View style={{flexDirection: 'row'}}>
//               <Pressable
//                 style={[styles.button, styles.buttonClose]}
//                 onPress={() => closeModal()}>
//                 <Text style={styles.textStyle}>❌ (
//                 <TimeNotifications autoCloseModal={autoCloseModal}/> 
//                 )</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

  
//   // คำนวณระยะห่างระหว่างผู้ใช้กับจุดเสี่ยง
//   const calculatePreciseDistance = (position, data) => {
//     var RiskArea = []
//     data.map((item)=>{
//       var pdis = getPreciseDistance(
//         position,
//         item.พิกัด.indexOf(" ")>=0?{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" ")))}:{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",")+1))}
//       );
//       if(pdis<=300){
//         RiskArea.push({detail: item.รายละเอียด, distrance: pdis, id: item._id, like:item.like, dislike:item.dislike})
//       }
//     })
//     if(RiskArea.length>0){
//       setModalVisible(true)
//     }
//     setlistRiskArea(RiskArea)
//   };

//   // Start location tracking in foreground
//   const startForegroundUpdate = async () => {
//     // Check if foreground permission is granted
//     const { granted } = await Location.getForegroundPermissionsAsync()
//     if (!granted) {
//       console.log("location tracking denied")
//       return
//     }

//     // Make sure that foreground location tracking is not running
//     foregroundSubscription?.remove()

//     // Start watching position in real-time
//     foregroundSubscription = await Location.watchPositionAsync(
//       {
//         // For better logs, we set the accuracy to the most sensitive option
//         accuracy: Location.Accuracy.BestForNavigation,
//         // distanceInterval: 1,
//         enableHighAccuracy:true,
//         timeInterval: 23000
//       },
//       location => {
//         setPosition(location.coords)
//         calculatePreciseDistance(position, data)
//       }
//     )
//   }

//   // Stop location tracking in foreground
//   const stopForegroundUpdate = async () => {
//     foregroundSubscription?.remove()
//     const ignoreID = await cache.get('ignoreID');
//     if(Ignored_Notification.length>0){
//       const list_ignoreID = []
//       Ignored_Notification.map((item)=>{
//         list_ignoreID.push(item.id)
//       })
//       if(ignoreID==undefined){
//         await cache.set('ignoreID', list_ignoreID) // ถ้าไม่มี Cache จะ set ใหม่
//       }else{
//         ignoreID.map((item)=>{
//           if(list_ignoreID.indexOf(item)>=0){
//             list_ignoreID.splice(list_ignoreID.indexOf(item), 1)
//           }
//         })
//         list_ignoreID.map((item)=>{
//           ignoreID.unshift(item)
//         })
//         await cache.set('ignoreID', ignoreID) // Update Cache
//       }
//     }
//   }

//   useFocusEffect(
//     useCallback(() => {
//       CheckFakeRisk()
//       return () => {
//         stopForegroundUpdate();
//         setAlertMe(false);
//       };
//     }, [])
//   );

//   useEffect(()=>{
//     const requestPermissions = async () => {
//       const foreground = await Location.requestForegroundPermissionsAsync()
//       if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
//       let location = await Location.getCurrentPositionAsync({});
//       setPosition(location.coords)
//     }
//     requestPermissions();
//   }, [])
  
//   // ตั้งค่า cache
//   const cache = new Cache({
//     namespace: "RANS",
//     policy: {
//         maxEntries: 50000, // if unspecified, it can have unlimited entries
//         stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
//     },
//     backend: AsyncStorage
//   });

//   // Component Function เมื่อมีการกดปุ่ม + บน Header
//   function AddNewRisk(){
//     return (
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={addPress}
//         onRequestClose={() => {
//           closeAddModal();
//         }}
//       >
//         <View style={styles.centeredView}>
//           <View style={styles.modalViewWithMap}>
//             <TouchableOpacity style={styles.modalCloseButton} onPress={()=>{setAddPress(false)}}>
//               <AntDesign name="close" size={24} color="black" />
//             </TouchableOpacity>
//             <AddRisk closeAddModal={closeAddModal}/>
//           </View>
//         </View>
//       </Modal>
//     )
//   }

//   // ปิด Add Modal ที่ผู้ใช้กดปุ่ม + บน Header
//   function closeAddModal(){
//     setAddPress(false)
//   }

//   // กำหนด onPress ให้ปุ่ม refresh บน Header
//   useEffect(() => {
//     navigation.setOptions({
//       headerRight:()=>(
//         <HeaderButtons HeaderButtonComponent={CustomHeaderButton}>
//           <Item title='refresh' iconName='refresh' onPress={()=>{GetData();setRefresh(true)}}/>
//         </HeaderButtons>
//       )
//     });
//   }, [navigation, data]);

//   async function CheckFakeRisk(){
//     const q = query(collection(db, "rans-database"), where("dislike", '>=', 100));
//     const querySnapshot = await getDocs(q);
//     const d = querySnapshot.docs.map(doc => doc.id)
//     console.log(d)
//   }

//   return (
//     <View style={styles.container}>
//       {refresh?<ActivityIndicator style={styles.loading} color={'green'} size={'large'}/>:
//       <>
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity style={styles.bottomButton} onPress={() => { setAddPress(true); } }>
//           <Ionicons name="add" size={24} color="black" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.bottomButton} onPress={() => { AlertMe ? stopForegroundUpdate() : startForegroundUpdate(); setAlertMe(!AlertMe); } }>
//           <Text style={{ fontSize: 20 }}>{AlertMe ? 'Stop' : 'Start'}</Text>
//         </TouchableOpacity>
//       </View>
//       <AddNewRisk />
//       <RiskNotification />
//       <MapView style={styles.map} 
//           region={{ latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
//           provider={PROVIDER_GOOGLE}
//           showsUserLocation={true}
//       >
//         {data.map((item, index) => (
//           <Marker key={index} pinColor={item.like >= 50 ? "red" : item.like >= 25 ? "yellow" : "green"} title={"จุดเสี่ยงที่ " + (index + 1) + (item.like >= 50 ? " (อันตราย)" : item.like >= 25 ? " (โปรดระวัง)" : "")} description={item.รายละเอียด} coordinate={item.พิกัด.indexOf(" ") >= 0 ? { latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" "))) } : { latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",") + 1)) }} />
//         ))}
//       </MapView>
//       </>}
//     </View>
//   );
// }

function CheckFocusScreen(props) {
  useFocusEffect(
    useCallback(() => {
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
      refresh: false
    }
    
    this.autoCloseModal = this.autoCloseModal.bind(this)
    this.closeAddModal = this.closeAddModal.bind(this)
    this.stopForegroundUpdate = this.stopForegroundUpdate.bind(this)
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
  }

  componentWillUnmount(){
    this.unsub();
    this.stopForegroundUpdate();
    this.setState({
      AlertMe: false
    })
  }

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
  // async autoCloseModal() {
  //   let ignoreList = []
  //   let ignoreCache = await this.cache.get("ignoreID")
  //   if(ignoreCache==undefined){
  //     ignoreCache = []
  //   }
  //   this.setState({
  //     modalVisible: false
  //   })
  //   this.state.listRiskArea.map((item)=>{
  //     if(ignoreCache.length>0){
  //       if(ignoreCache.indexOf(item.id)<0){
  //         ignoreList.push(item.id)
  //       }
  //     }else{
  //       ignoreList.push(item.id)
  //     }
  //   })
  //   this.setState({
  //     Ignored_Notification: ignoreList
  //   })
  //   this.forceUpdate();
  // }

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
  // async stopForegroundUpdate() {
  //   foregroundSubscription?.remove()
  //   this.setState({
  //     AlertMe:false
  //   })
  //   const ignoreID = await this.cache.get('ignoreID');
  //   let likeCache = await this.cache.get('like');
  //   let disLikeCache = await this.cache.get('dislike');
  //   const list_ignoreID = this.state.Ignored_Notification;
  //   if(this.state.Ignored_Notification.length>0){
  //     if(likeCache==undefined){
  //       likeCache = []
  //     }
  //     if(disLikeCache==undefined){
  //       disLikeCache = []
  //     }
  //     this.state.Ignored_Notification.map((item, index)=>{
  //       if(likeCache.indexOf(item)>=0 || disLikeCache.indexOf(item)>=0){
  //         list_ignoreID.splice(index, 1)
  //       }
  //     })
  //     if(ignoreID==undefined){
  //       await this.cache.set('ignoreID', list_ignoreID) // ถ้าไม่มี Cache จะ set ใหม่
  //     }else{
  //       list_ignoreID.map((item)=>{
  //         ignoreID.unshift(item)
  //       })
  //       await this.cache.set('ignoreID', ignoreID) // Update Cache
  //     }
  //   }
  // }

  async CheckFakeRisk(){
    const q = query(collection(db, "rans-database"), where("dislike", '>=', 100));
    const querySnapshot = await getDocs(q);
    const d = querySnapshot.docs.map(doc => doc.id)
    console.log(d)
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

  RiskNotification=()=>{
    const listArea = []
    this.state.listRiskArea.sort((a,b) => (a.distrance > b.distrance) ? 1 : ((b.distrance > a.distrance) ? -1 : 0))
    this.state.listRiskArea.map((item, index)=>{
      listArea.push(
        <View key={index}>
          <Text style={[styles.modalText, {fontWeight:item.distrance<=100?"bold":"normal"}]}>
            <Text style={{color:item.like >= 50 ? "red" : item.like >= 25 ? "orange" : "green"}}>{item.detail} </Text>
            <Text>[{item.distrance} เมตร]</Text>
          </Text>
        </View>
      )
    })
    if(listArea.length>3){
      let alllength = listArea.length
      listArea.splice(3, listArea.length)
      listArea.push(
        <Text key={alllength} style={{fontWeight:'bold'}}>... and {alllength-3} more</Text>
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={() => { this.stopForegroundUpdate;this.setState({addPress:true}) } }>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={() => { this.state.AlertMe ? this.stopForegroundUpdate() : this.startForegroundUpdate();this.setState({AlertMe: !this.state.AlertMe}); }}>
            <Text style={{ fontSize: 20 }}>{this.state.AlertMe ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
        </View>
        <CheckFocusScreen stopForegroundUpdate={this.stopForegroundUpdate}/>
        <this.AddNewRisk/>
        <this.RiskNotification />
        <MapView style={styles.map} 
            region={{ latitude: this.state.position.latitude, longitude: this.state.position.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
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
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: '#ffffff',
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
  buttonLike: {
    backgroundColor: '#fff',
  },
  buttonDislike: {
    backgroundColor: '#fff',
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
