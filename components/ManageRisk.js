import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { SearchBar } from 'react-native-elements';
import { AntDesign } from '@expo/vector-icons';
import { Cache } from "react-native-cache";
import { collection, query, getDocs, orderBy, updateDoc, where, doc } from "firebase/firestore";
import db from '../database/firebaseDB';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ManageRisk({ navigation, route }) {
  // *********************** Risk Area API ***********************
  // data เก็บข้อมูลจุดเสี่ยง 100 จุดจาก API
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [pageData, setPageData] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [start, setStart] = useState(1);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailId, setDetailId] = useState(0);
  const [alreadyLike, setalreadyLike] = useState([]);
  const [alreadyDisLike, setalreadyDisLike] = useState([]);
  // function GetPosition ดึงข้อมูลจุดเสี่ยง 100 จุดจาก API
  async function GetPosition(){
    try{
      const customData = require('../assets/RiskArea.json')
      setData(customData.result.records)
      // await axios.get('https://data.bangkok.go.th/api/3/action/datastore_search?&resource_id=0b1bbe5f-7cf1-4931-b064-f33388def4b3')
      //         .then(response=>{
      //           setData(response.data.result.records)
      //         })
      //         .catch(error=>{
      //           console.error(error)
      //         })
    }catch(err){
      console.error(err)
    }
  }

  async function GetData() {
    const q = query(collection(db, "rans-database"), orderBy("_id", 'asc'));
    const querySnapshot = await getDocs(q);
    const d = querySnapshot.docs.map(doc => doc.data())
    setData(d)
    // const startPage = d.filter((item)=>item._id>=start && item._id<start+5)
    setPageData(d)
    // setPageData(startPage)
    // if(start==1){
    //   setStart(start+5)
    // }
  }

  async function GetCache(){
    setalreadyLike(await cache.get('like'))
    setalreadyDisLike(await cache.get('dislike'))
  }

  function NextPage(){
    if((pageCount+1)>Math.round(data.length/5)){
      return
    }
    const startPage = data.filter((item)=>item._id>=start && item._id<start+5)
    setPageData(startPage)
    setStart(start+5)
    setPageCount(pageCount+1)
  }

  function PreviousPage(){
    if((pageCount-1)<1){
      return
    }
    const startPage = data.filter((item)=>item._id>=start-10 && item._id<start-5)
    setPageData(startPage)
    setStart(start-5)
    setPageCount(pageCount-1)
  }

  function RisksDetail(){
    const listArea = []
    data.filter((item)=>item._id==detailId).map((item, index)=>{
      listArea.push(
        <View key={index}>
          <Text style={styles.modalText}>
            <Text><Text style={{ fontWeight: 'bold' }}>รายละเอียด</Text>: {item.รายละเอียด}{"\n"}</Text>
            <Text><Text style={{ fontWeight: 'bold' }}>สำนักงานเขต</Text>: {item.สำนักงานเขต}{"\n"}</Text>
          </Text>
          <View style={styles.modalButtonContainer}>
            <Pressable
              style={[styles.button, styles.buttonLike]}
              onPress={() => { updateLike(item._id);closeInfo(); } }>
              <Text style={styles.textStyle}>
                <AntDesign name="like1" size={24} color={alreadyLike==undefined?'black':alreadyLike.filter((likeitem)=>likeitem==item._id).length>0?'#6BF38B':'black'} />
                {'\t'}{item.like}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonDislike]}
              onPress={() => { updateDislike(item._id);closeInfo(); } }>
              <Text style={styles.textStyle}>
                <AntDesign name="dislike1" size={24} color={alreadyDisLike==undefined?'black':alreadyDisLike.filter((dislikeitem)=>dislikeitem==item._id).length>0?'#F36C6C':'black'} />
                {'\t'}{item.dislike}
              </Text>
            </Pressable>
          </View>
        </View>
      )
    })
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailVisible}
        onRequestClose={() => {
          closeInfo();
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
          <TouchableOpacity style={styles.infoButtonContainer} onPress={closeInfo}>
            <AntDesign name="close" size={24} color="black" />
          </TouchableOpacity>
            <Text style={styles.modalTextHeader}>รายละเอียด</Text>
            {listArea}
          </View>
        </View>
      </Modal>
    );
  }

  function showInfo(id){
    setDetailId(id)
    setDetailVisible(true)
  }

  function closeInfo(){
    setDetailVisible(false)
  }

  // อัพเดตข้อมูล row จาก db -> collection -> update
  async function updateLike(id) {
    const q = query(collection(db, "rans-database"), where("_id", "==", id));
    const querySnapshot = await getDocs(q);
    const likeCache = await cache.get('like');
    const disLikeCache = await cache.get('dislike');
    let likeCheck = []
    let disLikeCheck = []
    if(disLikeCache!=undefined){
      disLikeCheck = disLikeCache.filter((item)=>item==id)
    }
    if(likeCache==undefined){
      await cache.set('like', [id])
    }else{
      likeCheck = likeCache.filter((item)=>item==id)
      if(likeCheck.length==0 && disLikeCheck.length==0){
        likeCache.push(id)
        querySnapshot.forEach(async (snapDoc) => {
          await updateDoc(doc(db, "rans-database", snapDoc.id), {
            like: snapDoc.data().like+1
          }).then(
            console.log("Like Updated")
          )
        });
      }else if(likeCheck.length>0){
        likeCache.splice(likeCache.findIndex((item)=>item==id), 1)
        querySnapshot.forEach(async (snapDoc) => {
          await updateDoc(doc(db, "rans-database", snapDoc.id), {
            like: snapDoc.data().like-1
          }).then(
            console.log("Like Updated")
          )
        });
      }else{
        alert('Already Dislike')
      }
      await cache.set('like', likeCache)
    }
    GetCache()
  }

  async function updateDislike(id) {
    const q = query(collection(db, "rans-database"), where("_id", "==", id));
    const querySnapshot = await getDocs(q);
    const likeCache = await cache.get('like');
    const disLikeCache = await cache.get('dislike');
    let likeCheck = []
    let disLikeCheck = []
    if(likeCache!=undefined){
      likeCheck = likeCache.filter((item)=>item==id)
    }
    if(disLikeCache==undefined){
      await cache.set('dislike', [id])
    }else{
      disLikeCheck = disLikeCache.filter((item)=>item==id)
      if(disLikeCheck.length==0 && likeCheck.length==0){
        disLikeCache.push(id)
        querySnapshot.forEach(async (snapDoc) => {
          await updateDoc(doc(db, "rans-database", snapDoc.id), {
            dislike: snapDoc.data().dislike+1
          }).then(
            console.log("Dislike Updated")
          )
        });
      }else if(disLikeCheck.length>0){
        disLikeCache.splice(disLikeCache.findIndex((item)=>item==id), 1)
        querySnapshot.forEach(async (snapDoc) => {
          await updateDoc(doc(db, "rans-database", snapDoc.id), {
            dislike: snapDoc.data().dislike-1
          }).then(
            console.log("Dislike Updated")
          )
        });
      }else{
        alert('Already Like')
      }
      await cache.set('dislike', disLikeCache)
    }
    GetCache()
  }

  const onChangeSearch = query => setSearch(query);

  function Search(){
    const startPage = [] 
    data.map((item)=>{
      if(item.รายละเอียด.indexOf(search)>=0 || item.สำนักงานเขต.indexOf(search)>=0){
        startPage.push(item)
      }
    })
    setPageData(startPage)
  }

  const cache = new Cache({
    namespace: "RANS",
    policy: {
        maxEntries: 50000, // if unspecified, it can have unlimited entries
        stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
    },
    backend: AsyncStorage
  });

  useEffect(()=>{
    GetData()
    GetCache()
  }, [])

  return (
    <ScrollView stickyHeaderIndices={[1]} style={[styles.container, {backgroundColor:detailVisible?'rgba(0,0,0,0.3)':'rgba(255,255,255,1)'}]}>
      <RisksDetail/>
      <SearchBar
        placeholder="Search"
        containerStyle={{backgroundColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: 'transparent'}}
        inputContainerStyle={{backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderBottomWidth: 1, opacity:detailVisible?0.3:1}}
        onChangeText={onChangeSearch}
        value={search}
      />
      <TouchableOpacity style={styles.button} onPress={Search}>
        <Text>Here</Text>
      </TouchableOpacity>
      {(pageData.length)>0?pageData.map((item, index)=>(
        <View style={[styles.riskContainer, {opacity:detailVisible?0.3:1}]} key={index}>
          <Text style={styles.riskTitle}>{item.รายละเอียด}</Text>
          <View style={styles.infoButtonContainer}>
            <TouchableOpacity style={styles.infoButton} onPress={()=>{showInfo(item._id)}}>
              <AntDesign name="infocirlceo" size={24} color="black"/>
            </TouchableOpacity>
          </View>
          <View style={styles.riskButtonContainer}>
            <TouchableOpacity style={styles.riskButton} onPress={()=>{updateLike(item._id)}}>
              <AntDesign name="like1" size={24} color={alreadyLike==undefined?'black':alreadyLike.filter((likeitem)=>likeitem==item._id).length>0?'#6BF38B':'black'}/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.riskButton} onPress={()=>{updateDislike(item._id)}}>
              <AntDesign name="dislike1" size={24} color={alreadyDisLike==undefined?'black':alreadyDisLike.filter((dislikeitem)=>dislikeitem==item._id).length>0?'#F36C6C':'black'}/>
            </TouchableOpacity>
          </View>
        </View>
      )):<ActivityIndicator color={'green'} size={'large'}></ActivityIndicator>}
      
      {/* <View style={styles.pageNavContainer}>
        <TouchableOpacity style={[styles.nav, {opacity:detailVisible?0.3:1}]} onPress={PreviousPage}>
          <Text>{'<'}</Text>
        </TouchableOpacity>
        <TextInput style={[styles.nav, {opacity:detailVisible?0.3:1}]} value={pageCount.toString()} keyboardType="numeric" textAlign='center'/>
        <TouchableOpacity style={[styles.nav, {opacity:detailVisible?0.3:1}]} onPress={NextPage}>
          <Text>{'>'}</Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  riskContainer: {
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    backgroundColor: "#FFF",
  },
  riskTitle: {
    fontWeight: 'bold',
    margin: 10,
    marginBottom: 0,
    width: '85%'
  },
  infoButtonContainer: {
    position: 'absolute',
    top: '3%',
    right: '2%'
  },
  infoButton: {
    margin: 3,
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
  riskButtonContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  riskButton: {
    margin: '3%'
  },
  redButton: {
    backgroundColor: '#F36C6C'
  },
  greenButton: {
    backgroundColor: "#6BF38B"
  },
  pageNavContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  nav: {
    margin: '3%',
    marginTop: '1%',
    padding: '5%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 5,
    backgroundColor: "#fff"
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
  modalText: {
    
  },
  modalTextHeader: {
    marginBottom: 15,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtonContainer:{
    flexDirection: 'row',
    alignSelf: 'center'
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
  textStyle: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
