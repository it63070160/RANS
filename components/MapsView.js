import MapView, {Marker} from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
// import * as Location from 'expo-location';
import * as Location from 'expo-location';

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

  useEffect(()=>{
    GetPosition();
  }, [])

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={{latitude: getLocation?location.coords.latitude:13.736717, longitude: getLocation?location.coords.longitude:100.523186, latitudeDelta: 0.005, longitudeDelta: 0.005 }}>
        {/* <Marker title={"You"} coordinate={location.coords}/> */}
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