var express = require('express');
var app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const PORT = process.env.PORT || 7000;

app.use('/static', express.static(__dirname + '/static'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/static/index.html'));
});

var mPlayerNo = 0;
var mGreenTeamNo = 0;
var mRedTeamNo = 0;
var mWhiteTeamNo = 0;
var gWidth =  1440; //432;
var gHeight = gWidth/2;// + 100;
var mGsize = 10;
var nW = gWidth / mGsize;
var nH = gHeight / mGsize;//Square

var mState = Array();// 0:dead, 1:alive(me), -1:alive(enemy)
var mPreState = Array();

for(i=0;i<nH*nW;i++){
    mState[i]=0;
    mPreState[i]=0;
}

function mGetPlayerArray()
{
  var mdata = Array();
  mdata[0]=mGreenTeamNo;
  mdata[1]=mRedTeamNo;
  mdata[2]=mWhiteTeamNo;

  return mdata;
}

io.on('connection',function(socket)
{
    console.log('S::connected');
    var teamName = '';
    
    socket.on('message',function(msg){
        console.log('S::message: ' + msg);
        socket.emit('message', msg);
        //socket.emit('message', 1);
    });
    
    socket.on('login',function(msg){
      console.log('S::login: ' + msg);
      //io.emit('login', msg);
      //mPlayerNo += 1;
      //console.log('S::mPlayerNo: ' + mPlayerNo);
      //socket.emit('login', mPlayerNo);
    });

    socket.on('loginGreen',function(msg){
      console.log('S::loginGreen: ' + msg);
      mPlayerNo += 1;
      mGreenTeamNo += 1;
      teamName = 'G';
      console.log('S::mPlayerNo: ' + mPlayerNo);
      console.log('S::mGreenTeamNo: ' + mGreenTeamNo);
      //socket.emit('loginGreen', mGreenTeamNo);
      	var mdata = Array();
        // mdata[0]=mGreenTeamNo;
        // mdata[1]=mRedTeamNo;
        // mdata[2]=mWhiteTeamNo;
        mdata = mGetPlayerArray();
      io.emit('loginGreen', mdata );
    });
    socket.on('loginRed',function(msg){
      console.log('S::loginRed: ' + msg);
      mPlayerNo += 1;
      mRedTeamNo += 1;
      teamName = 'R';
      console.log('S::mPlayerNo: ' + mPlayerNo);
      console.log('S::mRedTeamNo: ' + mRedTeamNo);
      var mdata = Array();
      mdata = mGetPlayerArray();
      io.emit('loginRed', mdata);
    });
    socket.on('loginWhite',function(msg){
      console.log('S::loginWhite: ' + msg);
      mPlayerNo += 1;
      mWhiteTeamNo += 1;
      teamName = 'W';
      console.log('S::mPlayerNo: ' + mPlayerNo);
      console.log('S::mWhiteTeamNo: ' + mWhiteTeamNo);
      var mdata = Array();
      mdata = mGetPlayerArray();
      io.emit('loginWhite', mdata);
    });

    socket.on('setgrid',function(msg){
      console.log('S::setgrid: ' + msg);
      socket.emit('setgrid', [540, 12]);
    });

    socket.on('cell',function(msg){
        console.log('S::cell: ' + msg);
        //console.log('cell: ('+msg[0]+','+msg[1]+')->'+msg[2]);
        io.emit('cell', msg);
    });


    socket.on('addCell',function(msg){
      //console.log('S::addCell: ' + msg);
      //console.log('cell: ('+msg[0]+','+msg[1]+')->'+msg[2]);
      //io.emit('cell', msg);

      for(i=0;i<msg.length/2;i++){
          mState[msg[i*2]] = msg[i*2+1];
      }//

    });

    socket.on('disconnect', () => {
      console.log('S::disconnect:');
      mPlayerNo -= 1;
      console.log('S::mPlayerNo: ' + mPlayerNo);

      if( teamName=='G' ){
          mGreenTeamNo -= 1;
      }
      if( teamName=='R' ){
        mRedTeamNo -= 1;
      }
      if( teamName=='W' ){
        mWhiteTeamNo -= 1;
      }

      var mdata = mGetPlayerArray();
      io.emit('loginGreen', mdata );
    });


});


function mGetAroundCellCount(i, j) 
{
  //console.log('mGetCellCount[' + i +',' + j + ']');
  var is_ = Math.max(0,i-1);
  var ie_ = Math.min(nH-1,i+1);
  var js_ = Math.max(0,j-1);
  var je_ = Math.min(nW-1,j+1);
  //console.log(is_ +',' + ie_ +',' + js_ + ','+je_);

  var c = 0;
  var d = 0;
  for(i2=is_;i2<=ie_;i2++){ 
    for(j2=js_;j2<=je_;j2++)
    {
      //console.log(i2+',' + j2 );
      var idx_ = j2+i2*nW;
      d += mPreState[idx_];

      if( (i2==i) && (j2==j) ){
        continue;
      }

      if(mPreState[idx_]!=0){
        c += 1;
      }
    }
  }
 
  //console.log('c:' + c);
  //return c;

  return Array(c,d);
}// func


function mGetRandomPlusMinus()
{
  var v = 1;
  var random = Math.floor( Math.random() * 2 );// 0 or 1
  if( random == 0 ){
    v = -1;
  }
 
  return v;
}

function mUpdateCell()
{
  //console.log('S::mUpdateCell:');

  for(i=0;i<nH;i++){ 
    for(j=0;j<nW;j++){
      var id_ = j+i*nW;
      mPreState[id_]=mState[id_];
    }
  }	

  for(i=0;i<nH;i++){ 
    for(j=0;j<nW;j++){
      var id_ = j+i*nW;

      var a_ = mGetAroundCellCount(i, j);
      //console.log('id='+id_+', a:'+a_);
      var c_ = a_[0];
      var d_ = a_[1];
      //console.log('id='+id_+':'+c_+','+d_);
      if( (mPreState[id_]==0) && (c_!=3) ){ //その他
        mState[id_] = 0;
      }
      else if( (mPreState[id_]==0) && (c_==3) ){ //誕生        
        if(d_<0){
          mState[id_] = -1;
        }
        else if(d_>0){
          mState[id_] = 1;
        }
        else{ // == 0
          mState[id_] = mGetRandomPlusMinus();
        }
      }
      else if( (mPreState[id_]!=0) && ((c_==2) || (c_==3)) ){ //生存
        if(d_<0){
          mState[id_] = -1;
        }
        else if(d_>0){
          mState[id_] = 1;
        }
        else{ // == 0
          mState[id_] = mGetRandomPlusMinus();
        }
      }
      else if( (mPreState[id_]!=0) && (c_<=1) ){ //過疎
        mState[id_] = 0;
      }
      else if( (mPreState[id_]!=0) && (c_>=4) ){ //過密
        mState[id_] = 0;
      }
      
    }
  }	

}//



var i = 0;
setInterval(()=>{
    
  mUpdateCell();

  io.emit('updateCell', mState);

}, 66);

http.listen(PORT, function(){
  console.log('server listening. Port:' + PORT);
});
