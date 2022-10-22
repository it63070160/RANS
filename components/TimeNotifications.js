import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function TimeNotifications(props) {
  const [count, setcount] = useState(10);
  
  useEffect(()=>{
    const CloseTime = setTimeout(()=>{
      props.closeModal()
    }, 11000)
    const Intime = setInterval(()=>{
      setcount(count-1);
    }, 1000)
    if(count<=0){
      setcount(10)
      clearInterval(Intime)
      clearTimeout(CloseTime)
    }
    return ()=> {clearInterval(Intime)}
  }, [count])

  return (
    <Text>{count}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
