import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
   inputBox:{
   backgroundColor:"#c9c8c8",
   margin:1,
   flexDirection:'row',
   justifyContent:"space-between",
   alignItems:'center',
   padding:10,
   } ,
   inputText:{
      fontSize:20,
      fontWeight:'bold',
      color:"#8a8989"

   },
   timeContainer:{
   flexDirection:'row',
   justifyContent:'space-between',
   width:100,
   backgroundColor:'white',
   borderRadius:50,
   padding:10
   
   },
   row:{
  flexDirection:'row',
  alignItems:'center',
  marginTop:10,
  borderBottomWidth:1,
  borderColor:'grey'
   },
   iconContainer:{
   backgroundColor:'#cdcccc',
   padding:15,
   borderRadius:50,
   margin:10,
  
   
  

   },
   destinationText:{
      fontWeight:'500',
      fontSize:16,
     
     

   }

})
export default styles;