import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        padding:20


    },
    image:{
        width:50,
        height:50,
        resizeMode:'contain'
    },
    time:{
        color:'#5d5d5d',
        marginLeft:10

    },
    middleContainer:{
    flex:1,
    marginHorizontal:10,
    justifyContent:'space-between'
    },

    rightContainer:{
     width:100,
     alignItems:'flex-end',
     flexDirection:'row'
    },

    type:{
        fontWeight:'bold',
        fontSize:20,
        marginHorizontal:10

    }, 
    price:{
        fontWeight:'bold',
        fontSize:20,
        marginLeft:5


    }

})
export default styles;