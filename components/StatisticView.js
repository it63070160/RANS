import { StyleSheet, View, Text, } from 'react-native';
import db from '../database/firebbaseDB';
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

import axios from 'axios'; // ดึง API

const _ = require('lodash');
const screenWidth = Dimensions.get("window").width;

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
  };

export default function StatisticView() {
    console.log('------------')
    let data = []

    let [listData, setListData] = useState([])

    let [listDataGroup, setListDataGroup] = useState([])
    
    // getList()

    async function getList(){
        try{
            await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?resource_id=db468db2-8450-4867-80fb-5844b5fbd0b4')
                    .then(response=>{
                      data = response.data.result.records
                      console.log('getList')
                      console.log('- ' + data[0]._id)
                      console.log('- ' + data[0].รายละเอียด) //แยกพัฒนาการ (ถ.พัฒนาการ - ศรีนครินทร์)
                      console.log('- ' + data[0].สำนักงานเขต) //สวนหลวง
                      console.log('- ' + data[0]["สน.พื้นที่"]) //คลองตัน,ประเวศ
                      console.log('- ' + data[0].พิกัด) //13.735236, 100.641140
                    })
                    .catch(error=>{
                      console.error(error)
                    })

            // เอาข้อมูลจาก api ใส่ firebase
            let docRef;
            for (let i=0; i<data.length;i++){
              docRef = await addDoc(collection(db, "rans-database"), {
                _id: data[i]._id,
                รายละเอียด: data[i].รายละเอียด,
                สำนักงานเขต: data[i].สำนักงานเขต,
                พิกัด: data[i].พิกัด
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
        console.log("Getting Data From Firbase.")
        // console.log(snapshot.docs[0].data())
        const d = snapshot.docs.map(doc => doc.data())

        setListData(d)

        setListDataGroup(groupData(d, 'สำนักงานเขต'))

    }

    function groupData(array, key){
      let group = _.groupBy(array, key)
      let g = Object.entries(group);
      let resGroup = []

      for (let i=0; i<g.length; i++){
        resGroup.push({
          name: g[i][0],
          quantity: g[i][1].length,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          legendFontColor: "#000000",
          legendFontSize: 15
        })
      }

      return resGroup
    }

    useEffect(()=>{
      getData();
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Statistic</Text>
            {/* {console.log(listData + "123")} */}
            {/* {console.log(listData)} */}
            <PieChart
              data={listDataGroup}
              width={screenWidth}
              height={800}
              chartConfig={chartConfig}
              accessor={"quantity"}
              backgroundColor={"transparent"}
              paddingLeft={"50"}
              center={[10, 60]}
              absolute
            />
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
