import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
// MapsView Screen
import MapsView from '../views/MapsView';
import NotificationsView from '../views/NotificationsView';
import StatisticView from '../views/StatisticView';
import ManageRisk from '../views/ManageRisk';
import RiskStatisticView from '../views/RickStatisticView';

const Drawer = createDrawerNavigator();
const BottomTab = createBottomTabNavigator();

function BottomTabNavigator(){
    return (
        <BottomTab.Navigator screenOptions={{headerShown:false}}>
            <BottomTab.Screen name="Statistic" component={ StatisticView } options={{tabBarIcon: () => {
                return <AntDesign name="areachart" size={24} color="black" />
            },}}/>
            <BottomTab.Screen name="RiskStatistic" component={ RiskStatisticView } options={{tabBarIcon: () => {
                return <FontAwesome name="asterisk" size={24} color="black" />
            },}}/>
        </BottomTab.Navigator>
    );
}

function DrawerNavigator(){
    return (
        <Drawer.Navigator screenOptions={{ headerStyle: styles.header, headerTitleAlign: 'center'}}>
            <Drawer.Screen name="Maps" component={MapsView} options={{title:'RANS Maps'}}/>
            <Drawer.Screen name="ManageRisks" component={ManageRisk} options={{title:'Manage Risks'}}/>
            <Drawer.Screen name="Notifications" component={NotificationsView}/>
            <Drawer.Screen name="Statistic" component={BottomTabNavigator}/>
        </Drawer.Navigator>
    );
}

export default function MainNavigator(){
    return(
        <NavigationContainer>
            <DrawerNavigator/>
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