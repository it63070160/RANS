import { StyleSheet, View, Text, ActivityIndicator , ScrollView, TouchableOpacity} from 'react-native';
import db from '../database/firebaseDB';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { Dimensions } from "react-native";
import { useEffect, useState } from 'react';
// https://npm.io/package/react-native-animated-charts
import BarChart from './BarChart';
import { graphColor } from '../constants/colors'
import { groupBy } from "lodash";

import axios from 'axios'; // ดึง API

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;


export default function StatisticView() {

    let data = []

    let [listData, setListData] = useState([])

    let [listDataGroup, setListDataGroup] = useState([])

    let [listDataGroupSort, setListDataGroupSort] = useState([])

    // let [labels, setLabels] = useState([])

    // let [dataY, setDataY] = useState([])

    // show {n} elements first
    const showTop = 5

    async function getList(){
        try{
            // await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?resource_id=db468db2-8450-4867-80fb-5844b5fbd0b4')
            //         .then(response=>{
            //           data = response.data.result.records
            //         })
            //         .catch(error=>{
            //           console.error(error)
            //         })
            // ดึงข้อมูลจากไฟล์ json หากเว็บ api ล่ม
            const customData = require('../assets/RiskArea.json')
            data = customData.result.records
            // เอาข้อมูลจาก api ใส่ firebase
            let docRef;
            for (let i=0; i<data.length;i++){
              docRef = await addDoc(collection(db, "rans-database"), {
                _id: data[i]._id,
                รายละเอียด: data[i].รายละเอียด,
                สำนักงานเขต: data[i].สำนักงานเขต,
                พิกัด: data[i].พิกัด,
                like: 0,
                dislike: 0
              });
            console.log("Document written with ID: ", docRef.id);
          }
        }catch(err){
            console.error(err)
        }
    }

    // ดึงข้อมูล row จาก db -> collection
    async function getData() {

        const col = collection(db, 'rans-database');
        const snapshot = await getDocs(col);
        console.log("Getting Data From Firebase.")

        const d = snapshot.docs.map(doc => doc.data())

        setListData(d)

        // groupData(d, 'สำนักงานเขต')

        formatGraph(groupData(d, 'สำนักงานเขต'))

    }

    function groupData(array, key){
      let group = groupBy(array, key)
      let g = Object.entries(group);

      let resGroup = []

      for (let j=0; j<g.length; j++){
          resGroup.push({label: g[j][0], dataY: g[j][1].length})
      }

      setListDataGroup(resGroup)

      return resGroup
    }

    function formatGraph(dt){
      let sortedData = dt.sort(
        (p, n) => (p.dataY < n.dataY) ? 1 : (p.dataY > n.dataY) ? -1 : 0);

        let resGroupSec = []

        // let lb = []
        // let dtY = []

        for (let j=0; j<sortedData.length; j++){
          resGroupSec.push({label: sortedData[j].label, dataY: sortedData[j].dataY})
          // if (j < showTop){
          //   lb.push(sortedData[j].label + "\n (" + sortedData[j].dataY + " จุด)")
          //   dtY.push(sortedData[j].dataY)
          // }
        }

        // setLabels(lb)
        // setDataY(dtY)

        setListDataGroupSort(resGroupSec)
    }

    function generateList(value, index){
      if (index >= showTop){
        return <View style={styles.listBox} key={index+6}>
          <Text style={{width: '10%', textAlign: 'center'}}>{index + 1}</Text>
          <View style={{width: '1%', borderRightColor: 'black', borderRightWidth: 1, height: '100%'}}></View>
          <Text style={{width: '60%', paddingLeft: '5%'}}>{value.label}</Text>
          <Text style={{width: '20%', textAlign: 'center'}}>{value.dataY} จุด</Text>
        </View>
      }
    }

    useEffect(()=>{
      // getList()
      getData();
    }, [])

    return (
        <View style={styles.container}>
          {(listDataGroup.length != 0)?
          <View style={{width: '100%', height: '100%'}}>
            <View style={styles.graphContainer}>
              <Text style={styles.graphHeader}>{showTop} อันดับเขตที่มีจำนวนจุดเสี่ยงสูงที่สุดในกรุงเทพมหานคร</Text>
              <BarChart
                labels={listDataGroupSort.map((value, index) => value.label + "\n (" + value.dataY + " จุด)").slice(0, showTop)}
                dataY={listDataGroupSort.map((value, index) =>  value.dataY).slice(0, showTop)}
                color={graphColor}
                height={screenHeight * .28}
                containerStyles={styles.barChart}
              />
            </View>
            <ScrollView style={styles.bgScroll}>
              {listDataGroupSort.map(generateList)}
            </ScrollView>
            <View style={{backgroundColor: '#233212'}}>
              <TouchableOpacity onPress={() => getData()} style={styles.button}>
                  <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            </View>
            :<ActivityIndicator color={'green'} size={'large'}></ActivityIndicator>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      width: '100%',
      height: '100%',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    graphContainer: {
      backgroundColor: '#D7CCC8',
      width: '100%',
      height: screenHeight*0.4,
    },
    graphStyle: {
      position: 'absolute',
      bottom: 0,
    },
    graphHeader: {
      marginTop: 20,
      fontSize: 25,
      textAlign: 'center',
    },
    bgScroll: {
      width: "100%",
      height: "100%",
      backgroundColor: "#D7CCC8"
    },
    button: {
      backgroundColor:"#7CB342",
      width:screenWidth*.3,
      // height:40,
      borderRadius:30,
      alignItems:"center",
      justifyContent:"center",
      alignSelf: 'flex-end',
      marginBottom: 30,
      marginTop: 30,
      marginRight: 30,
      padding: 20
    },
    buttonText: {
        color:"white",
        fontSize: 25
    },
    barChart: {
        backgroundColor:"transparent",
        height:screenHeight*.28,
        width: '100%',
        position: 'absolute',
        bottom: '3%',
        borderBottomColor: 'black',
        borderBottomWidth: 2,
        alignItems: 'center',
        alignSelf: 'center',
    },
    listBox: {
      width: '90%',
      alignItems: 'center',
      alignSelf: 'center',
      margin: '1%',
      padding: '2%',
      flexDirection: 'row',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderRadius: 50,
      backgroundColor: "#fff"
    },
});
