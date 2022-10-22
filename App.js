import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Button, View, Text, TouchableOpacity } from 'react-native';
import MapsView from './components/MapsView';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Text>=</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>RANS</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapsView style={styles.map}/>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  header:{
    width: '100%',
    height: '10%',
    borderWidth: 2
  },
  headerText:{
    margin: 10,
    fontSize: 25,
    alignSelf: 'center',
  },
  mapContainer: {
    width: '100%',
    height: '90%',
    position: 'absolute',
    bottom: 0,
  }
});
