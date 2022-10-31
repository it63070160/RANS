import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
// MapsView Screen
import MapsView from './components/MapsView';
import NotificationsView from './components/NotificationsView';
import StatisticView from './components/StatisticView';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{ headerStyle: styles.header, headerTitleAlign: 'center'}}>
        <Drawer.Screen name="Maps" component={MapsView} options={{title:'RANS Maps'}}/>
        <Drawer.Screen name="Notifications" component={NotificationsView}/>
        <Drawer.Screen name="Statistic" component={StatisticView}/>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  header:{
    borderBottomWidth: 2,
    borderBottomColor: 'black'
  },
});
