import React  from "react";
import Image from "next/image";

const Tile = ({piece,id,color})=>{
   

 
 
  
           
           
      
            
        return(
            <div 
                className={`${color === 'white'?'bg-green-700':'bg-gray-400'}   ${piece&& 'piece'} `} 
                
                
            >
              
                    
               { piece &&<img
                    src={`/chessPieces/${piece.type}/${piece.name}.png`}
                    
                    className="w-[60px] h-[60px] object-contain  absolute "
                />}
              
            </div>

        );



}
export default Tile;