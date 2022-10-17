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
    // flex: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  header:{
    width: '100%',
    height: '10%',
    borderWidth: 2
  },
  headerText:{
    marginTop: 35,
    fontSize: 25,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  }
});
