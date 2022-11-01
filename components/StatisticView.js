import { StyleSheet, View, Text, } from 'react-native';
import db from '../database/firebaseDB';
import { collection, addDoc, getDocs } from "firebase/firestore";
import {
    LineChart,
    BarChart,
    PieChart,
    ProgressChart,
    ContributionGraph,
    StackedBarChart
  } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useEffect, useState } from 'react';
import { graphColor } from '../constants/colors';

import axios from 'axios'; // ดึง API

const grp = require('lodash');
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    strokeWidth: 3, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
  };

export default function StatisticView() {

    let data = []

    let [listData, setListData] = useState([])

    let [listDataGroup, setListDataGroup] = useState([])

    // แสดงกี่ลำดับแรก
    let eventIndex = 6
    // แสดงสีไหนก่อน
    var indexColor = 0
    
    // getList()

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
        // console.log("Getting Data From Firebase.")

        const d = snapshot.docs.map(doc => doc.data())

        setListData(d)

        setListDataGroup(groupData(d, 'สำนักงานเขต'))

    }

    function groupData(array, key){
      let group = grp.groupBy(array, key)
      let g = Object.entries(group);
      let resGroup = []

      for (let i=0; i<g.length; i++){
        resGroup.push({
          name: g[i][0],
          quantity: g[i][1].length,
        })
      }

      return formatGraph(resGroup)
    }

    function formatGraph(dt){
      let sortedData = dt.sort(
        (p, n) => (p.quantity < n.quantity) ? 1 : (p.quantity > n.quantity) ? -1 : 0);
      
      let primaryGroup = []
      let secondaryGroup = {
        name: 'อื่นๆ (' + (sortedData.length - eventIndex) + ' เขต)', 
        quantity: 0,
        legendFontColor: "#000000",
        legendFontSize: 15
      }

      for (let j = 0; j < sortedData.length; j++){
        if (j < eventIndex){
          primaryGroup.push(sortedData[j])
          primaryGroup[j].color = graphColor[indexColor]
          primaryGroup[j].legendFontColor = "#000000"
          primaryGroup[j].legendFontSize = 15
          if (++indexColor > (graphColor.length - 1)){
            indexColor = 0
          }
        }
        else {
          secondaryGroup.quantity += sortedData[j].quantity
        }
      }

      secondaryGroup.color = graphColor[indexColor == 0 ? indexColor + 1 : indexColor]
      primaryGroup.push(secondaryGroup)

      return primaryGroup
    }

    useEffect(()=>{
      // getList()
      getData();
    }, [])

    return (
        <View style={styles.container}>
            <View style={{height: '100%', width: '100%'}}>
              <PieChart
                data={listDataGroup}
                width={screenWidth-100}
                height={screenHeight-200}
                chartConfig={chartConfig}
                accessor={"quantity"}
                backgroundColor={"transparent"}
                paddingLeft={"150"}
                center={[0, 0]}
                absolute
              />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
      },
    text: {
        color: 'red',
        fontSize: 50,
        textAlign: 'center',
    },
});
