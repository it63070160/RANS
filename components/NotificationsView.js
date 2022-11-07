import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import db from '../database/firebaseDB';
import { collection, query, where, getDocs, updateDoc, doc} from "firebase/firestore";

export default function NotificationsView({ navigation, route }) {
  const listArea = (route.params?route.params.listArea:[])
  
  function likeHandle(id, index){
    updateLike(id)
    listArea.splice(index, 1);
    navigation.navigate("Notifications", {listArea: listArea})
  }

  function dislikeHandle(id, index){
    updateDislike(id)
    listArea.splice(index, 1);
    navigation.navigate("Notifications", {listArea: listArea})
  }

  // อัพเดตข้อมูล row จาก db -> collection -> update
  async function updateLike(index) {
    const q = query(collection(db, "rans-database"), where("_id", "==", index));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (snapDoc) => {
      // doc.data() is never undefined for query doc snapshots
      await updateDoc(doc(db, "rans-database", snapDoc.id), {
        like: snapDoc.data().like+1
      }).then(
        console.log("Like Updated")
      )
    });
  }
  async function updateDislike(index) {
    const q = query(collection(db, "rans-database"), where("_id", "==", index));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (snapDoc) => {
      // doc.data() is never undefined for query doc snapshots
      await updateDoc(doc(db, "rans-database", snapDoc.id), {
        dislike: snapDoc.data().dislike+1
      }).then(
        console.log("Dislike Updated")
      )
    });
  }

  return (
    <ScrollView style={styles.container}>
      {listArea.length>0?listArea.map((item, index)=>(
        <View style={styles.notiContainer} key={index}>
          <Text style={styles.notiTitle}>{item.detail}</Text>
          <View style={styles.notiButtonContainer} >
            <TouchableOpacity style={[styles.notiButton, styles.greenButton]} onPress={()=>{likeHandle(item.id, index)}}>
              <Text style={{textAlign:'center'}}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.notiButton, styles.redButton]} onPress={()=>{dislikeHandle(item.id, index)}}>
              <Text style={{textAlign:'center'}}>👎</Text>
            </TouchableOpacity>
          </View>
        </View>
      )):null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notiContainer: {
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
  notiTitle: {
    fontWeight: 'bold',
    margin: 10
  },
  notiButtonContainer: {
    flexDirection: 'row',
    alignSelf: 'center'
  },
  notiButton: {
    flex: 1,
    padding: 10,
    margin: 10,
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
  redButton: {
    backgroundColor: '#F36C6C'
  },
  greenButton: {
    backgroundColor: "#6BF38B"
  }
});
