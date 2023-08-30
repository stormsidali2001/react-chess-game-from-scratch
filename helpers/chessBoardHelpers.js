
const initBoard = ()=>{

    const newPieces = {};

    const pieces = ['rook', 'knight', 'bishop', 'king',  'queen','bishop', 'knight', 'rook']

    for(let i=0; i<8; i++) {

        // fill pawns
        newPieces[`${i}-${1}`] = {name:"pawn",type:"white"};
        newPieces[`${i}-${6}`] = {name:"pawn",type:"black"};

        // fill rest pieces
        newPieces[`${i}-${0}`] = {name:pieces[i], type:"white"};
        newPieces[`${i}-${7}`] = {name:pieces[i], type:"black"};

    }

   return newPieces;
}

const pieceSide = (type)=>
{
   if(type =="white") return "top"
   else if("black") return "down";
}

const allowedVectorMoves = ({x,y,pieceType,pieceName},pieces,withoutEnemyBreak = null) => {
    
    const side = pieceSide(pieceType);
  
    if(pieceName==="pawn")
    {
      return __generatePawnMoves({x,y,pieceType,side},pieces);
    }
    else if(pieceName === "bishop")
    {
        return __generateBishopMoves({x,y,pieceType},pieces,withoutEnemyBreak)
    }
    else if(pieceName === "rook")
    {
        return __generateRookMoves({x,y,pieceType},pieces,withoutEnemyBreak);
    }
    else if (pieceName === 'queen'){
         const bishopMoves = __generateBishopMoves({x,y,pieceType},pieces,withoutEnemyBreak);
         const rookMoves = __generateRookMoves({x,y,pieceType},pieces,withoutEnemyBreak);

      return [...rookMoves,...bishopMoves];
    }
    else if (pieceName === 'knight'){
        return __generateKnightMoves({x,y,pieceType},pieces)
    }
    else if (pieceName === 'king'){
         return __generateKingMoves({x,y,pieceType,side},pieces,withoutEnemyBreak);
    }

    return [];
    
}

const allowedMovesIfKingCheck = ({x,y,pieceType,pieceName},pieces,checPieces,kingCoord)=>{
    // pieces can only move to save the king which is actually in check
    const pieceMoves = allowedVectorMoves({x:x,y:y,pieceName,pieceType},pieces);
    const tmpMv = new Set([])
           

    checPieces.forEach(cp=>{
        const cpMoves = allowedVectorMoves({x:cp.x,y:cp.y,pieceName:cp.name,pieceType:cp.type},pieces,true);
        pieceMoves.forEach(pmv=>{
         
            if(x + pmv.x === cp.x && y + pmv.y === cp.y  ){
                tmpMv.add(pmv);
            }
        })
        cpMoves.forEach(cpmv=>{
            pieceMoves.forEach(pmv=>{
                if(x + pmv.x === cp.x + cpmv.x && y + pmv.y === cp.y + cpmv.y ){
                    const maxX = Math.max(kingCoord.x,cp.x);
                    const minX = Math.min(kingCoord.x,cp.x);
                    const maxY = Math.max(kingCoord.y,cp.y);
                    const minY = Math.min(kingCoord.y,cp.y);
                    const isSameXY =  kingCoord.x === cp.x ||  kingCoord.y === cp.y ;
                    if(isSameXY){
                        if(x + pmv.x  >=minX && x + pmv.x <= maxX && y + pmv.y >=minY && y + pmv.y <= maxY){
                           
                            tmpMv.add(pmv);

                        }

                    }else{

                        if( x + pmv.x  >=minX && x + pmv.x <= maxX && y + pmv.y >=minY && y + pmv.y <= maxY ){
                            const moveVec = {x:cp.x -  (x + pmv.x),y:cp.y -  (y + pmv.y)};
                            const isADiagonalMove = Math.abs(moveVec.x) === Math.abs(moveVec.y);
                            isADiagonalMove&& tmpMv.add(pmv);
                           

                        }

                    }
                  
                   
                }
            })
        })
        
      
    })         
  return [...tmpMv]

}

const getKingCoordinates = (pieces,kingType)=>{
    for(const key in pieces){

        let [px,py] = key.split('-');
        const p = {...pieces[key],x:+px,y:+py};
        if(p.name === 'king' && p.type === kingType){ 
            return {x:p.x,y:p.y}
        }
        
    }
}

const isKingInChec = (pieces,kingType)=>{ 
   
    const king = getKingCoordinates(pieces, kingType);

    const checPieces = [];
  
    for(const key in pieces){
       
        let [px,py] = key.split('-');
        const p = {...pieces[key],x:+px,y:+py};
        if(p.type === kingType || p.name === 'king') continue;//go through the oposite type of pieces only (we dont care about the other king)

        const moves = allowedVectorMoves({x:p.x,y:p.y,pieceType:p.type,pieceName:p.name},pieces);
        for(let i=0;i<moves.length;i++){
            const mv = moves[i];
            if(mv.x +p.x === king.x && mv.y +p.y === king.y){
                checPieces.push(p);
            }
        }
        
    }
    return {inChec:checPieces.length >=1,checPieces,kingCoord:king};
}

function __generatePawnMoves({x,y,pieceType,side},pieces) { 

    const inverseY = arr => {
        return arr.map(e=>({...e,y:-e.y}))
    }

    let tmp = [];

    if(y===6 || y===1) {
           tmp =  [{x:0, y:1}, {x:0, y:2}];
           if(side == "down") 
             tmp = inverseY(tmp);
    } else {
        tmp = [{x:0,y:1}];
        if(side==="down") 
          tmp = inverseY(tmp);
    }

    //removing blocking pieces (ally or enemy)
    for(let i=0;i<tmp.length;i++){
        const vecEl = tmp[i];
        if(pieces[`${vecEl.x+x}-${vecEl.y+y}`]) {
                tmp.splice(i,1);
                i--;
        }
    }

    // addding pieces which we can capture
    let p = pieces[`${x+1}-${(side==="down"?-1:1)+y}`];
    if(p && (pieceSide(p.type)!=side)){  //right capture move
        tmp.push({x:1,y:1*((side==="down")?-1:1),capture:true})
    }

    p = pieces[`${x-1}-${(side==="down"?-1:1)+y}`];
    if(p && (pieceSide(p.type)!=side)){  //left capture move
        tmp.push({x:-1,y:1*((side==="down")?-1:1),capture:true})
    }
    
    return tmp;
}

function __generateRookMoves({x,y,pieceType},pieces,withoutEnemyBreak = null){
    let tmp = [];
        
    for(let i=0;i<2;i++)
    {
     const unitVecL = {x:-1*(1-i),y:-i}
     const unitVecR = {x:1*(1-i),y:i}
     for(let j=0;j<2;j++){
         const uv = j === 0 ?unitVecL :unitVecR;
         let rook = {x:x,y:y};
         rook.x += uv.x;
         rook.y += uv.y;
         while(rook.x>=0 && rook.x<=7 && rook.y>=0 && rook.y<=7)
         {             
          
             /*
                 we loop through all the pieces to see if our current bishop move is blocked by a piece or not
             */
            if(pieces[`${rook.x}-${rook.y}`]){
                const p = pieces[`${rook.x}-${rook.y}`];
                if(p.type ===pieceType)
                {         
                   //Ally piece : dont push and stop
                  
                   break;
                }else
                {
                     //enemy piece  : push and stop
                     tmp.push({x:rook.x-x , y : rook.y-y})
                     if(!withoutEnemyBreak || withoutEnemyBreak && p.name!='king')   break;  
                }

            }else{
             tmp.push({x:rook.x-x , y : rook.y-y})
            

            }
             rook.x += uv.x;
             rook.y += uv.y;
         }
        
     }
   
    }
    return tmp;
    
}
function __generateBishopMoves({x,y,pieceType},pieces,withoutEnemyBreak = null){
    let tmp = [];
        
    for(let i=0;i<2;i++)
    {
     const unitVecL = {x:-1,y:1*((i===0)?-1:1)}
     const unitVecR = {x:1,y:1*((i===0)?-1:1)}
     for(let j=0;j<2;j++){
         const uv = j === 0 ?unitVecL :unitVecR;
         let bishop = {x:x,y:y};
         bishop.x += uv.x;
         bishop.y += uv.y;
         while(bishop.x>=0 && bishop.x<=7 && bishop.y>=0 && bishop.y<=7)
         {             
          
             /*
                 we loop through all the pieces to see if our current bishop move is blocked by a piece or not
             */
            if(pieces[`${bishop.x}-${bishop.y}`]){
                const p = pieces[`${bishop.x}-${bishop.y}`];
                if(p.type ===pieceType)
                {         
                   //Ally piece : dont push and stop
                  
                   break;
                }else
                {
                     //enemy piece  : push and stop
                     tmp.push({x:bishop.x-x , y : bishop.y-y})
                     if(!withoutEnemyBreak || withoutEnemyBreak&&p.name!='king')   break; 
                }

            }else{
             tmp.push({x:bishop.x-x , y : bishop.y-y})
            

            }
           
            
 
            
             //
            
              
             bishop.x += uv.x;
             bishop.y += uv.y;
         }
        
     }
   
   


 

    }
        

     return tmp;

}
function __generateKnightMoves({x,y,pieceType},pieces){
    let tmp = [];
        
    for(let i=0;i<4;i++)
    {
        let x1,x2,y1,y2;
        switch (i){
            case 0:
                x1 = -1;
                y1 = 2;
                //
                x2 = 1;
                y2 = 2;

                break;
            case 1:
                x1 = -1;
                y1 = -2;
                //
                x2 = 1;
                y2 = -2;
                break;
            case 2:
                //permutation
                x1 = 2;
                y1 = 1;
                //
                x2 = 2;
                y2 = -1;
                break;
            case 3:
                x1 = -2;
                y1 = 1;
                //
                x2 = -2;
                y2 = -1;
                break;

        }
     
     const unitVecL = {x:x1,y:y1}
     const unitVecR = {x:x2,y:y2}
     for(let j=0;j<2;j++){
         const uv = j === 0 ?unitVecL :unitVecR;
         let knight = {x:x,y:y};
         knight.x += uv.x;
         knight.y += uv.y;
         if(knight.x>=0 && knight.x<=7 && knight.y>=0 && knight.y<=7)
         {             
          
             /*
                 we loop through all the pieces to see if our current knight move is blocked by a piece or not
             */
            if(pieces[`${knight.x}-${knight.y}`]){
                const p = pieces[`${knight.x}-${knight.y}`];
                if(p.type ===pieceType)
                {         
                   //Ally piece : dont push and stop
                  
                  
                }else
                {
                     //enemy piece  : push and stop
                     tmp.push({x:knight.x-x , y : knight.y-y})
                    
                }

            }else{
             tmp.push({x:knight.x-x , y : knight.y-y})
            

            }
           
            
 
            
             //
            
              
             knight.x += uv.x;
             knight.y += uv.y;
         }
        
     }
   
   


 

    }
        

     return tmp;
    
}
function __generateKingMoves({x,y,pieceType},pieces){
    let tmp = [];
    let vec = [{x:1,y:1},{x:-1,y:1} , {x:1,y:-1},{x:-1,y:-1} , {x:1,y:0},{x:-1,y:0}, {x:0,y:1},{x:0,y:-1}];
    //removing out of board moves
    for(let i=0;i<vec.length;i++)
           {
               const v = vec[i];

               if((v.x+x <0) || (v.x+x>=8) || (v.y+y <0) || (v.y+y>=8) ) {
                   
                vec.splice(i,1);
              
                i--; // cuz the indices will be changed after deleting an item from an array
                
                }
                if(pieces[`${x+v.x}-${y+v.y}`]){
                  
                    if(pieces[`${x+v.x}-${y+v.y}`].type === pieceType){
                        vec.splice(i,1);
                        i--;

                    }
                   
                   
                }
           }
    // going through all the oponent pieces
   
    for(const key in pieces){
        const [px,py] = key.split('-');
        const p = {...pieces[key],...{x:+px,y:+py}};
      
        if(p.type === pieceType) continue; // ignore our pieces
       
        
             let moves;
             if(p.name === 'pawn'){
                    moves = [];
                      // only pawn capture moves can make a king in chec
               
                      if(p.x +1 <=7) moves.push({x:1,y:1*((pieceSide(p.type)==="down")?-1:1)})
                 
                
                      if(p.x -1 >=0) moves.push({x:-1,y:1*((pieceSide(p.type)==="down")?-1:1)})
                    

       
    
             }else if(p.name === 'king'){
                    // console.log('king',p.type)
                    let vec = [{x:1,y:1},{x:-1,y:1} , {x:1,y:-1},{x:-1,y:-1} , {x:1,y:0},{x:-1,y:0}, {x:0,y:1},{x:0,y:-1}];
                    //removing out of board moves
                    for(let i=0;i<vec.length;i++)
                            {
                                const v = vec[i];
                
                                if((v.x+x <0) || (v.x+x>=8) || (v.y+y <0) || (v.y+y>=8) ) {
                                    
                                vec.splice(i,1);
                            
                                i--; // cuz the indices will be changed after deleting an item from an array
                                
                                }
                                if(pieces[`${x+v.x}-${y+v.y}`]){
                                
                                    if(pieces[`${x+v.x}-${y+v.y}`].type === pieceType){
                                        vec.splice(i,1);
                                        i--;
                
                                    }
                                    
                                    
                                }
                            }
                            moves = vec;
                  
             }else {
                moves = allowedVectorMoves({x:p.x,y:p.y,pieceType:p.type,pieceName:p.name},pieces);
             }
            
            
              
           if(moves) for(let i=0;i<moves.length;i++){
                const mv = moves[i];
                
                for(let j=0;j<vec.length;j++){
                    const v = vec[j];
                   
                  
                    if( (p.x +mv.x === x + v.x) && (p.y + mv.y === y + v.y)){
                      
                       
                         vec.splice(j,1);
                         j--;
                    }
                }
            }
          

        


    }      
   
           return vec;
           
}

export   {initBoard,allowedVectorMoves,isKingInChec,getKingCoordinates,pieceSide,allowedMovesIfKingCheck};

