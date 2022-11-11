import { StyleSheet, View, Text, ActivityIndicator , ScrollView, TouchableOpacity} from 'react-native';
import db from '../database/firebaseDB';
import { collection, addDoc, getDocs } from "firebase/firestore";
// import {
//     LineChart,
//     BarChart,
//     PieChart,
//     ProgressChart,
//     ContributionGraph,
//     StackedBarChart
//   } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useEffect, useState } from 'react';
import { BarChart } from 'react-native-animated-charts';

import axios from 'axios'; // ดึง API

const grp = require('lodash');
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(41, 120, 59, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(120, 120, 59, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.9,
  useShadowColorFromDataset: false // optional
};

export default function StatisticView() {

    let data = []

    let [listData, setListData] = useState([])

    let [listDataGroup, setListDataGroup] = useState([])

    let [listDataGroupSec, setListDataGroupSec] = useState([])

    let [labels, setLabels] = useState([])

    let [dataY, setDataY] = useState([])
    
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

        // setListDataGroup(groupData(d, 'สำนักงานเขต'))

        formatGraph(groupData(d, 'สำนักงานเขต'))

    }

    function groupData(array, key){
      let group = grp.groupBy(array, key)
      let g = Object.entries(group);

      // console.log(g[0][0])
      // let resGroup = []

      // for (let i=0; i<g.length; i++){
      //   resGroup.push({
      //     name: g[i][0],
      //     quantity: g[i][1].length,
      //   })

      // }

      let resGroup = []

      for (let j=0; j<g.length; j++){
          resGroup.push({label: g[j][0], dataY: g[j][1].length})
      }
        
        // setLabels(lb)
        // setDataY(dtY)

      setListDataGroup(resGroup)

      // console.lolg(listDataGroup)

      // return formatGraph(resGroup)

      return resGroup
    }

    function formatGraph(dt){
      let sortedData = dt.sort(
        (p, n) => (p.dataY < n.dataY) ? 1 : (p.dataY > n.dataY) ? -1 : 0);

        let resGroupSec = []

        let lb = []
        let dtY = []

        for (let j=0; j<sortedData.length; j++){
          if (j < 5){
            lb.push(sortedData[j].label + "\n (" + sortedData[j].dataY + " จุด)")
            dtY.push(sortedData[j].dataY)
          }
          else {
            resGroupSec.push({label: sortedData[j].label, dataY: sortedData[j].dataY})
          }
        }

        setLabels(lb)
        setDataY(dtY)

        setListDataGroupSec(resGroupSec)

      // return fd;
    }

    useEffect(()=>{
      // getList()
      getData();
    }, [])

    function recalculate(){
      let values = Array.from({length: 5}, () => Math.round(10*Math.random() * 5)/10)
      setDataY(values)
      setLabels(values.map(v=>(Math.round(v*10)/10)+'k'))
    }

    return (
        <View style={styles.container}>
          {(listDataGroup.length != 0)?
          <View style={{width: '100%', height: '100%'}}> 
            <View style={styles.graphContainer}>
              <Text style={styles.graphHeader}>5 อันดับเขตที่มีจำนวนจุดเสี่ยงสูงที่สุดในกรุงเทพมหานคร</Text>
              {/* <BarChart
                style={styles.graphStyle}
                data={listDataGroup}
                width={screenWidth-20}
                height={screenHeight*0.2}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                yAxisSuffix=" จุด"
                fromZero={true}
                withInnerLines={true}
              /> */}
              <BarChart 
                labels={labels} 
                dataY={dataY} 
                color={'#a7bd4f'} 
                height={screenHeight * .28}
                containerStyles={styles.barChart}
              />
            </View>
            <ScrollView style={{width: '100%', height: '100%'}}>
              {listDataGroupSec.map((value, index) => <View style={styles.listBox} key={index+6}>
                <Text style={{width: '10%', textAlign: 'center'}}>{index + 6}</Text>
                <View style={{width: '1%', borderRightColor: 'black', borderRightWidth: 1, height: '100%'}}></View>
                <Text style={{width: '60%', paddingLeft: '5%'}}>{value.label}</Text>
                <Text style={{width: '20%', textAlign: 'center'}}>{value.dataY} จุด</Text>
              </View>)}
            </ScrollView>
            <View>
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
      backgroundColor: '#fff',
      width: '100%',
      height: screenHeight*0.4,
    },
    graphStyle: {
      position: 'absolute',
      bottom: 0,
    },
    graphHeader: {
      fontSize: 20,
      textAlign: 'center',
    },
    button: {
      backgroundColor:"#a7bd4f",
      width:screenWidth*.4,
      height:40, 
      borderRadius:30,
      alignItems:"center",
      justifyContent:"center",
      alignSelf: 'flex-end',
      marginBottom: 20,
      marginRight: 30
    },
    buttonText: {
        color:"white",
        fontSize:18
    },
    barChart: {
        backgroundColor:"transparent",
        height:screenHeight*.28,
        width:screenWidth,
        position: 'absolute',
        bottom: '3%',
        borderBottomColor: 'black',
        borderBottomWidth: 2,
        alignItems: 'center',

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
