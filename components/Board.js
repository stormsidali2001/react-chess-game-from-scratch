import { useEffect ,useState,useRef} from "react";
import { allowedMovesIfKingCheck, allowedVectorMoves, getKingCoordinates, initBoard, isKingInChec ,pieceSide} from "../helpers/chessBoardHelpers";
import Tile from "./Tile";

const Board  = ()=>{
    const [pieces,setPieces] = useState(initBoard);
    const [pieceInHand,setPieceInHand] = useState({html:null,x:-1,y:-1});
    const [heighlightedTiles,setHeighlightedTiles] = useState([]);
    const [movesVector,setMovesVector] = useState([]);
    const [deadBlackPieces,setDeadBlackPieces] = useState([]);
    const [deadWhitePieces,setDeadWhitePieces] = useState([]);
    const [turn,setTurn] = useState('black');
  
    const boardRef = useRef(null);
    useEffect(()=>{
        const tiles = boardRef.current.children;
        let arr = [];
        for(let i=0;i<tiles.length;i++)
        {
            const bg = tiles[i].style.backgroundColor;       
            arr.push({bg,num:i});
        }
   
       setHeighlightedTiles(arr);
    },[])

  

    const handleHoldingPiece = (e)=>{
       
        //resetting the colors of the tiles
        const tiles = boardRef.current.children;
        heighlightedTiles.forEach(el=>{
            tiles[el.num].style.backgroundColor = el.bg;
            tiles[el.num].style.border = "none";
            tiles[el.num].style.opacity = "1";


        });
       
       
      

        const tile_html = e.target.parentElement;
     
        if(!tile_html.classList.contains("piece")) return;

        
        const tile_w = tiles[0].getBoundingClientRect().width;
        const tile_h = tiles[0].getBoundingClientRect().height;
        let x = e.clientX - boardRef.current.getBoundingClientRect().x;
        let y = e.clientY - boardRef.current.getBoundingClientRect().top;
        x =Math.floor(x/tile_w) ;
        y =Math.floor(y/tile_h) ;

        const p = pieces[`${x}-${y}`]; // holded piece

        if(p.type !== turn ){
            console.log(p,'its not your turn')
            setMovesVector([])
            return;
           
        }

        // calculate the allowed vector of moves
        let newMovesVect;
       
        const {inChec,checPieces,kingCoord} = isKingInChec(pieces,turn);
        console.log(`${p.type} king in chec`,inChec)
       
      
       

        if(inChec && p.name!= 'king'){
            newMovesVect = allowedMovesIfKingCheck({x:x,y:y,pieceName:p.name,pieceType:p.type},pieces,checPieces,kingCoord);
           
        }else{
             newMovesVect = allowedVectorMoves({x,y,pieceName:p.name,pieceType:p.type},pieces);
        }

       
        /*

            will king be in chec after that move
        */
       for(let i=0;i<newMovesVect.length;i++){
           const mv = newMovesVect[i];
          
           
           const pb ={...pieces[`${x}-${y}`]};
           const tmpPices = {...pieces};
          
           if(!tmpPices[`${x + mv.x}-${y +mv.y}`]){

            tmpPices[`${x + mv.x}-${y +mv.y}`] = pb
         

           }else{
            tmpPices[`${x + mv.x}-${y +mv.y}`] = pb;
           }
           delete tmpPices[`${x}-${y}`];
     

           const {inChec,checPieces} = isKingInChec(tmpPices,turn);
           console.log(`${x + mv.x}-${y +mv.y} ${inChec} ${turn} `,checPieces)
           if(inChec) {
               newMovesVect.splice(i,1);
               i--;
            }
           
          
       }
        /*

            ***********************************
        */
       
       
      
        if(newMovesVect)newMovesVect.forEach(m=>{
            highlightTileNum({x:m.x+x,y:m.y+y})
        })


        setPieceInHand({html:e.target,x:x,y:y})
        setMovesVector(newMovesVect);
     
     


    }
    const handleLettingPiece = (e)=>{
          //resetting the colors of the tiles
          const tiles = boardRef.current.children;
          heighlightedTiles.forEach(el=>{
              tiles[el.num].style.backgroundColor = el.bg;
              tiles[el.num].style.border = "none";
              tiles[el.num].style.opacity = "1";
  
  
          })

          
          if(pieceInHand.html==null) return;
          
              
            const tile_w = tiles[0].getBoundingClientRect().width;
            const tile_h = tiles[0].getBoundingClientRect().height;
             // x,y where we drop the piece47
             let x = e.clientX - boardRef.current.getBoundingClientRect().x;
                 x =Math.floor(x/tile_w) ;
             let y = e.clientY- boardRef.current.getBoundingClientRect().top;
                 y =Math.floor(y/tile_h) ;
          
              
             const beginingPieceX = pieceInHand.x;
             const beginingPieceY = pieceInHand.y;
           
             let counter = 0;
            
           
              // if one of the piece moves happen to be where we drop the piece 
              if(movesVector!=null) movesVector.forEach((el)=>{
                       
                       if(((el.x+beginingPieceX)===x) && ((el.y+beginingPieceY)===y) && !el.blocked)
                       {
                        
                          counter++;
                         

                       }
                   })
  
             
                
             if(counter ===0) {
             
               let html = pieceInHand.html;
               html.style.left = '';
               html.style.top = '';
               setPieceInHand({html:null,x:-1,y:-1})
               setMovesVector([]);
            
              return ;
          }
              
              const pb ={...pieces[`${beginingPieceX}-${beginingPieceY}`]};
              const newPieces = {...pieces};
             
              if(!newPieces[`${x}-${y}`]){

                newPieces[`${x}-${y}`] = pb
            

              }else{
                newPieces[`${x}-${y}`] = pb;
              }
             
              delete newPieces[`${beginingPieceX}-${beginingPieceY}`];

              const pTarget = newPieces[`${x}-${y}`];
              console.log(pTarget,'****************************')
              if(pTarget.name ==="pawn" && ((y===0)&&(pieceSide(pTarget.type)==="down") || ((y===7)&&(pieceSide(pTarget.type)==="top"))))
              {
                  newPieces[`${x}-${y}`].name = 'queen'
                  console.log('changed to queen..............................')
                  
              }
        
            
              let b = pb.type ==="black";
              const deadPieces = (b?deadBlackPieces:deadWhitePieces);
              deadPieces.push(pb);
              if(b)
              {
                  setDeadBlackPieces(deadPieces)
              }else
              {
                  setDeadWhitePieces(deadPieces);
              }
            
            setPieces(newPieces)
            
           let opType;
        if(turn ==='white'){
            opType = 'black'
        }else if( turn === 'black'){
            opType = 'white'
        }
        // chec mate detection 
        console.log('checking chec mate------------------------------')
        const {inChec,kingCoord,checPieces} = isKingInChec(newPieces,opType);
        const opKingMoves = allowedVectorMoves({x:kingCoord.x,y:kingCoord.y,pieceName:'king',pieceType:opType},newPieces);
        const movesExist = false;
        console.log(inChec,opKingMoves,opType)
        console.log('newPieces',newPieces)
        if(inChec && opKingMoves.length === 0){
            for(const key in newPieces){
                const p = newPieces[key];
                if(p.type != opType && p.name!='king') continue;
                const [px,py] = key.split('-');
                 p = {...p,x:+px,y:+py};
                const moves =  allowedMovesIfKingCheck({x:p.x,y:p.y,pieceName:p.name,pieceType:p.type},newPieces,checPieces,kingCoord);
                console.log(p,moves)
                if(moves.length != 0){
                    movesExist = true;
                  
                }
            }
        }
        if(!movesExist && inChec && opKingMoves.length === 0){
           setTimeout(()=>{
            alert('checkmate !!!!!!!!!!!!!',turn,' won the game')
            window.location.reload()

           },500) 
        }
        console.log('checking chec mate------------------------------')


     
       
       if(turn === 'white'){
        setTurn('black')
    }else if( turn === 'black'){
        setTurn('white')
    }
         
        
        
     
        
    }
    const handleMovingPiece = (e)=>{
        
        e.preventDefault();
        const piece = pieceInHand.html;
      
         if(pieceInHand.html) 
         {
          
        
      
         
         let numY = parseFloat(piece.getBoundingClientRect().top)-18;
         let numX = parseFloat(piece.getBoundingClientRect().left)-18;
         const limits = boardRef.current.getBoundingClientRect();
     
         numY += (e.pageY-numY)*0.4;
         numX +=  (e.pageX-numX)*0.4;
 
         if(numX < limits.x) 
         {
             numX = limits.x;
         }
         if( numX >limits.x+limits.width-piece.getBoundingClientRect().width) 
         {
             numX = limits.x+limits.width-piece.getBoundingClientRect().width;
         }
         //
         if(numY < limits.top) 
         {
             numY = limits.top;
         }
         if( numY >limits.bottom- piece.getBoundingClientRect().height) 
         {
             numY = numY >limits.bottom-piece.getBoundingClientRect().height;
         }
        
         piece.style.top=numY+"px";
         piece.style.left=numX+"px";
         }
    }
    const highlightTileNum = (tileCoordinates)=>
    {
        
        const getNumFromCoordinates = (tileCoordinates)=>{
            return (tileCoordinates.x)+tileCoordinates.y*8;
        }
        
        const tiles = boardRef.current.children;
   
        let num = getNumFromCoordinates(tileCoordinates);
        if(num>63 || num<0){
            console.log("ERROR:highlightTileNum failed the coordinates of the tile are not valide");
            return;
        }

        tiles[num].style.backgroundColor="green";
        tiles[num].style.opacity="0.5";
        tiles[num].style.border="1px solid black"
       
     


       
     
    }
    return (
        <div 
            ref={boardRef} 
            className="grid grid-cols-8 grid-rows-8 w-[500px] h-[500px]  border-2"
            onMouseDown={handleHoldingPiece}
            onMouseUp={handleLettingPiece}
            onMouseMoveCapture={handleMovingPiece}
        >
                <div className='text-center'>{turn === 'black' ? 'black': 'white'} turn </div>
            {
                new Array(8).fill(0).map((_,i)=>{
                    return(
                        new Array(8).fill(0).map((_,j)=>{
                            
                            return(
                                <Tile
                                    key ={`${i}-${j}`}
                                    color = {(i+j)% 2 === 0 ?'white':'black'}
                                    piece = {pieces[`${j}-${i}`]}
                                />

                            )
                         
                        })
                    )
                })
            }
        </div>
    )

} 


export default Board;
