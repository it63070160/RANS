import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/firebaseDB';
import { collection, query, getDocs, addDoc, orderBy} from "firebase/firestore";
import { TextInput } from 'react-native-gesture-handler';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; // track user location
import { Cache } from "react-native-cache";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddRisk(props, { navigation, route }) {
  const [marker, setMarker] = useState(null) // กำหนด Marker เมื่อผู้ใช้กดบริเวณแผนที่
  const [focusPos, setfocusPos] = useState({latitude: 13.736717, longitude: 100.523186}) // ตำแหน่งของผู้ใช้
  const [userCoords, setUserCoords] = useState(); // จับตำแหน่งเมื่อผู้ใช้ขยับ
  const [data, setData] = useState([]); // เก็บข้อมูลจุดเสี่ยง
  const [detail, setDetail] = useState(""); // เก็บข้อมูลรายละเอียดจุดเสี่ยง
  const [latitude, setlatitude] = useState(0); // เก็บข้อมูลรายละเอียดจุดเสี่ยง
  const [longitude, setlongitude] = useState(0); // เก็บข้อมูลรายละเอียดจุดเสี่ยง
  const [validateDetailFail, setvalidateDetailFail] = useState(false); // ตรวจสอบช่องที่รายละเอียดผู้ใช้ต้องกรอก
  const [validatePosFail, setvalidatePosFail] = useState(false); // ตรวจสอบช่องที่พิกัดผู้ใช้ต้องกรอก
  
  // function GetData ดึงข้อมูลจาก Firebase Database
  async function GetData() {
    const q = query(collection(db, "rans-database"), orderBy("_id", 'asc'));
    const querySnapshot = await getDocs(q);
    const d = querySnapshot.docs.map(doc => doc.data())
    setData(d)
  }
  
  // หากมีการพิมพ์ในช่องจะ setstate
  const onChangeDetail = query => setDetail(query);
  const onChangeLati = query => setlatitude(Number(query));
  const onChangeLongi = query => setlongitude(Number(query));

  // เมื่อผู้ใช้กดเพิ่ม
  async function handleAddPress(){
    if(detail == ""){ // Validate
      setvalidateDetailFail(true)
    }
    if(!marker){
      setvalidatePosFail(true)
    }
    if(detail && !marker){
      setvalidateDetailFail(false)
    }else if(detail == "" && marker){
      setvalidatePosFail(false)
    }
    if(detail != "" && marker){ // Add
      props.closeAddModal()
      setvalidateDetailFail(false)
      setvalidatePosFail(false)
      const col = collection(db, 'rans-database');
      const snapshot = await getDocs(col);
      const docRef = await addDoc(col, {
        _id: snapshot.docs.length+1,
        รายละเอียด: detail,
        สำนักงานเขต: "-",
        พิกัด: (Math.round(marker.latitude*1000000)/1000000).toFixed(6)+", "+(Math.round(marker.longitude*1000000)/1000000).toFixed(6),
        like: 0,
        dislike: 0
      });
      const userRiskID = await cache.get("createID")
      if(userRiskID==undefined){
        await cache.set("createID", [snapshot.docs.length+1])
      }else{
        userRiskID.unshift(snapshot.docs.length+1)
        await cache.set("createID", userRiskID)
      }
      console.log("Document written with ID: ", docRef.id);
    }
  }

  // สร้าง Marker หากผู้ใช้พิมพ์พิกัดเอง
  function createMarkerwithInput(){
    if(latitude && longitude){
      setMarker({latitude: latitude, longitude: longitude})
      setfocusPos({latitude: latitude, longitude: longitude})
    }
  }

  // รับค่าจาก Cache ที่เก็บในตัวเครื่องของผู้ใช้
  async function GetCache(){
    setalreadyLike(await cache.get('like'))
    setalreadyDisLike(await cache.get('dislike'))
  }

  // ตั้งค่า cache
  const cache = new Cache({
    namespace: "RANS",
    policy: {
        maxEntries: 50000, // if unspecified, it can have unlimited entries
        stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
    },
    backend: AsyncStorage
  });

  useEffect(()=>{
    const getStartLocation = async () => { // จับตำแหน่งของผู้ใช้
        let location = await Location.getCurrentPositionAsync({});
        setfocusPos(location.coords)
    }
    getStartLocation();
    GetData();
  }, [])

  return (
      <View>
          <View>
              <Text style={styles.InputHeader}>รายละเอียด <Text style={{color:"red", fontSize:validateDetailFail?12:0}}>* กรุณากรอกรายละเอียด</Text></Text>
              <TextInput style={[styles.Input, {borderColor:validateDetailFail?"red":"black"}]} placeholder='รายละเอียด' multiline={true} onChangeText={onChangeDetail} value={detail}/>
              <Text style={styles.InputHeader}>ระบุตำแหน่ง <Text style={{color:"red", fontSize:validatePosFail?12:0}}>* กรุณาระบุพิกัด</Text></Text>
              <View style={styles.posContainer}>
                <TextInput style={[styles.posInput, {borderColor:validatePosFail?"red":"black"}]} placeholder='ละติจูด' keyboardType='numeric' value={latitude} onChangeText={onChangeLati} onChange={createMarkerwithInput}/>
                <TextInput style={[styles.posInput, {borderColor:validatePosFail?"red":"black"}]} placeholder='ลองจิจูด' keyboardType='numeric' value={longitude} onChangeText={onChangeLongi} onChange={createMarkerwithInput}/>
              </View>
          </View>
          <MapView 
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            region={{latitude: focusPos.latitude, longitude: focusPos.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
            onPress={(e)=>{setMarker(e.nativeEvent.coordinate);setlatitude((Math.round(e.nativeEvent.coordinate.latitude*1000000)/1000000).toFixed(6).toString());setlongitude((Math.round(e.nativeEvent.coordinate.longitude*1000000)/1000000).toFixed(6).toString())}}
            onUserLocationChange={(e)=>setUserCoords(e.nativeEvent.coordinate)}
          >
            {marker && <Marker coordinate={marker} pinColor={"aqua"}/>}
            { data.map((item, index) => (
              <Marker key={index} pinColor={item.like>=50?"red":item.like>=25?"yellow":"green"} title={"จุดเสี่ยงที่ "+(index+1)+(item.like>=50?" (อันตราย)":item.like>=25?" (โปรดระวัง)":"")} description={item.รายละเอียด} coordinate = {item.พิกัด.indexOf(" ")>=0?{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(" ")))}:{latitude: Number(item.พิกัด.slice(0, item.พิกัด.indexOf(","))), longitude: Number(item.พิกัด.slice(item.พิกัด.indexOf(",")+1))}}/>
            ))}
          </MapView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={()=>{setMarker(userCoords);setfocusPos(userCoords)}}>
              <MaterialIcons name="my-location" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.redButton]} onPress={()=>{setMarker(null);setDetail("");setlatitude("");setlongitude("")}}>
              <FontAwesome name="trash-o" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.greenButton]} onPress={handleAddPress}>
              <FontAwesome name="check" size={24} color="black" />
            </TouchableOpacity>
          </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  posContainer: {
    flexDirection:'row',
    justifyContent:'space-between'
  },
  posInput: {
    width: '45%',
    padding: 10,
    margin: 10,
    borderBottomWidth: 1
  },
  InputHeader:{
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 10
  },
  Input: {
    borderBottomWidth: 1,
    borderRadius: 10,
    padding: 10,
    margin: 10
  },
  map: {
    width: '95%',
    height: '55%',
    margin: 10
  },
  buttonContainer: {
    flexDirection:'row',
    justifyContent: 'flex-end'
  },
  button: {
    padding: 12,
    marginRight: 10,
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  redButton: {
    backgroundColor: '#F36C6C'
  },
  greenButton: {
    backgroundColor: "#6BF38B"
  }
});