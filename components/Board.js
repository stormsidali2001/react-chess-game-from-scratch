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
        console.log(tiles);
        let arr = [];
        for(let i=0;i<tiles.length;i++)
        {
            const bg = tiles[i].style.backgroundColor;       
            arr.push({bg,num:i});
        }
   
       setHeighlightedTiles(arr);
    },[])

    
    useEffect(() => {
        console.log(heighlightedTiles)
    }, [heighlightedTiles])


    const handleHoldingPiece = (e) => {

        console.log('holding the piece ');
       
        const tiles = boardRef.current.children;
        
        //resetting the colors of the tiles
        heighlightedTiles.forEach(el=>{
            tiles[el.num].style.backgroundColor = el.bg;
            tiles[el.num].style.border = "none";
            tiles[el.num].style.opacity = "1";
        });

        // e.target here pointing to img
        // e.target.parentElement pointing to wrapper of img or (tile)
        const tile_html = e.target.parentElement;
     

        // what i do : make function do nothing when user hold an empty tile (doesn't contain piece)
        if(!tile_html.classList.contains("piece")) return;

        
        // here just getting the width and height of tile (width & height of the tile in general :) should be constant?!)
        const tile_w = tiles[0].getBoundingClientRect().width;
        const tile_h = tiles[0].getBoundingClientRect().height;

        
        // The clientX : provides the horizontal coordinate within the application's viewport at which the event occurred
        // The clientY : provides the vertical coordinate within the application's viewport at which the event occurred
        

        
        // element.getBoundingClientRect()
        //  - https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
    


        // here we are getting the coordinates of mouse horizontally and vertically using clientX & clientY but within the viewport not the tiles container in other word the x and y of mouse event in the entire html 

        // and then we substract left and top bounding of rect (which is tiles container) from clientX and clientY

        // x and y are the exact coordinate of the tile
      
        let x = e.clientX - boardRef.current.getBoundingClientRect().left;
        let y = e.clientY - boardRef.current.getBoundingClientRect().top;


        // here we are getting the indexes of tile it's like (i, j in matrix)
        x = Math.floor(x/tile_w) ;
        y = Math.floor(y/tile_h) ;


        const p = pieces[`${x}-${y}`]; // holded piece

        if(p.type !== turn ){
            console.log("%cMoving not allowed(opponent turn now)", "color:orange");
            setMovesVector([])
            return;
        }

        // calculate the allowed vector of moves
        let newMovesVect;
       
        const { inChec, checPieces, kingCoord } = isKingInChec(pieces,turn);

        console.log(`%c${p.type} king in chec`, "color:purple", inChec);
       
        if(inChec && p.name != 'king'){
            newMovesVect = allowedMovesIfKingCheck({x:x,y:y,pieceName:p.name,pieceType:p.type},pieces,checPieces,kingCoord);
        }else{
            newMovesVect = allowedVectorMoves({x,y,pieceName:p.name,pieceType:p.type},pieces);
        }

       
        /*
            will king be in chec after that move
        */
        for (let i = 0; i < newMovesVect.length; i++) {

            const mv = newMovesVect[i];
            const pb = { ...pieces[`${x}-${y}`] };
            const tmpPices = { ...pieces };

            if (!tmpPices[`${x + mv.x}-${y + mv.y}`]) {
                tmpPices[`${x + mv.x}-${y + mv.y}`] = pb
            } else {
                tmpPices[`${x + mv.x}-${y + mv.y}`] = pb;
            }

            delete tmpPices[`${x}-${y}`];
            const { inChec, checPieces } = isKingInChec(tmpPices, turn);
            //    console.log(`${x + mv.x}-${y +mv.y} ${inChec} ${turn} `,checPieces)
            if (inChec) {
                newMovesVect.splice(i, 1);
                i--;
            }
        }
      
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
            //   console.log(pTarget,'****************************')
              if(pTarget.name ==="pawn" && ((y===0)&&(pieceSide(pTarget.type)==="down") || ((y===7)&&(pieceSide(pTarget.type)==="top"))))
              {
                  newPieces[`${x}-${y}`].name = 'queen'
                //   console.log('changed to queen..............................')
                  
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
        // console.log('checking chec mate------------------------------')
        const {inChec,kingCoord,checPieces} = isKingInChec(newPieces,opType);
        const opKingMoves = allowedVectorMoves({x:kingCoord.x,y:kingCoord.y,pieceName:'king',pieceType:opType},newPieces);
        const movesExist = false;
        // console.log(inChec,opKingMoves,opType)
        // console.log('newPieces',newPieces)
        if(inChec && opKingMoves.length === 0){
            for(const key in newPieces){
                const p = newPieces[key];
                if(p.type != opType && p.name!='king') continue;
                const [px,py] = key.split('-');
                 p = {...p,x:+px,y:+py};
                const moves =  allowedMovesIfKingCheck({x:p.x,y:p.y,pieceName:p.name,pieceType:p.type},newPieces,checPieces,kingCoord);
                // console.log(p,moves)
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
        // console.log('checking chec mate------------------------------')

       if(turn === 'white'){
        setTurn('black')
        }else if( turn === 'black'){
            setTurn('white')
        }  

    }

    const handleMovingPiece = (e)=> {  
        
        e.preventDefault();

        const piece = pieceInHand.html;
      
         if(pieceInHand.html) {  
            
            let numY = parseFloat(piece.getBoundingClientRect().top)-18;
            let numX = parseFloat(piece.getBoundingClientRect().left)-18;

            numY += (e.pageY - numY) * 0.4;
            numX +=  (e.pageX - numX) * 0.4;
            
            const limits = boardRef.current.getBoundingClientRect();

            // just return nothing when the piece go over boundaries
            if (numX < limits.x ||
                numX > limits.right - piece.getBoundingClientRect().width ||
                numY < limits.top ||
                numY > limits.bottom - piece.getBoundingClientRect().height
             ) return;
        
            piece.style.top= numY + "px";
            piece.style.left= numX + "px";

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
                // console.log("ERROR:highlightTileNum failed the coordinates of the tile are not valide");
                return;
            }

            tiles[num].style.backgroundColor="red";
            tiles[num].style.opacity="0.5";
            tiles[num].style.border="1px solid black"
        
    }


    return (
        <div className="flex justify-center flex-col text-2xl font-bold gap-5">
           <div className='text-center text-black'>{turn === 'black' ? 'black': 'white'} turn </div>
           <div 
            ref={boardRef} 
            className="grid grid-cols-8 grid-rows-8 w-[500px] h-[500px]  border-2"
            onMouseDown={handleHoldingPiece}
            onMouseUp={handleLettingPiece}
            onMouseMoveCapture={handleMovingPiece}
        >
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
        </div>
     
    )

} 


export default Board;
