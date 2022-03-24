window.focus();
enchant();

window.onload = function () 
{

	console.log('------window.onload-------');
	console.log( mHelloLifeGameFunc()  );

	const socket = io();
	
	var mID = Math.floor(Math.random()*1000000000);
	var mPlayerID = -2;
	var mGreenTeamNo = 0;
	var mRedTeamNo = 0;
	var mWhiteTeamNo = 0;

	socket.emit('message', 'window.onload:'+mID);
	socket.emit('login', 'login:'+mID);

	socket.on('message',function(msg){
		console.log('C::message: ' + msg);
		//mPlayerID = msg;
	});

	socket.on('login',function(msg){
		console.log('C::login: ' + msg);
		mPlayerID = msg;
	});


	var gWidth =  1440; //432;
	var gHeight = gWidth/2;
	var mGsize = 10;


	var game = new Game(gWidth, gHeight+100);  
	game.fps = 15;

	var ClickSound = "/static/mBeam.wav";
		game.preload([ClickSound]);
	var CellSound = "/static/shotgun-pumpaction1.mp3";
		game.preload([CellSound]); 
	var mBGM1 = "/static/8bit-act01_title.mp3";
		game.preload([mBGM1]);
	var mBGM2 = "/static/8bit-act04_stage01.mp3";
		game.preload([mBGM2]);

	var mImgUp = "/static/image/mUp.png";
		game.preload([mImgUp]);
	var mImgDown = "/static/image/mDown.png";
		game.preload([mImgDown]);
	var mImgRight = "/static/image/mRight.png";
		game.preload([mImgRight]);
	var mImgLeft = "/static/image/mLeft.png";
		game.preload([mImgLeft]);
	var mImgG = "/static/image/mG.png";
		game.preload([mImgG]);
	var mImgS = "/static/image/mS.png";
		game.preload([mImgS]);
	var mImg1 = "/static/image/m1.png";
		game.preload([mImg1]);
	var mImg2 = "/static/image/m2.png";
		game.preload([mImg2]);

	
	game.onload = function () 
	{	
		var Point = 0;	
		var State = 0;	
		var mGrey ='rgb(80,80,80)';

		var S_MAIN = new Scene();
		game.pushScene(S_MAIN);  
		S_MAIN.backgroundColor = 'rgba(50,50,50,1)';

		var S_Text = new Label();
		S_Text.font = "14px Meiryo";
		S_Text.color = 'rgba(0,255,0,1)';
		S_Text.width = 150;
		S_Text.moveTo(gWidth*0.25, gHeight+50);
		S_MAIN.addChild(S_Text);
		S_Text.text = "Cell：0";	

		var E_Text = new Label();
		E_Text.font = "14px Meiryo";
		E_Text.color = 'rgba(255,0,0,1)';
		E_Text.width = 150;
		E_Text.moveTo(gWidth*0.75-150, gHeight+50);
		S_MAIN.addChild(E_Text);
		E_Text.text = "Cell：0";	

		var W_Text = new Label();
		W_Text.font = "14px Meiryo";
		W_Text.color = 'rgba(255,255,255,1)';
		W_Text.width = 100;	
		W_Text.moveTo(gWidth*0.5-50, gHeight+50);
		S_MAIN.addChild(W_Text);
		W_Text.text = "";	

		var C_Text = new Label(); 
		C_Text.font = "12px Meiryo";
		C_Text.color = 'rgba(255,255,255,1)';
		C_Text.width = 100;
		C_Text.moveTo(gWidth-100, gHeight+60);
		S_MAIN.addChild(C_Text);
		C_Text.text = "(c) 2020 G LLC";	


		var mPause = 0;

		//--- cell ---//
		var mCells = Array(); //new Array(nW*nH);
		var mState = Array();// 0:dead, 1:alive(me), -1:alive(enemy)
		var mPreState = Array();
		var mReady = Array();
		var mLastPos = Array(); // 0:x, 1:y
		mLastPos[0] = 0;
		mLastPos[1] = 0;

		var mCellSprite = new Sprite(gWidth, gHeight);
		var mCellSurface = new Surface(gWidth, gHeight);
		mCellSprite.image = mCellSurface;
		S_MAIN.addChild(mCellSprite);

		var nW = gWidth / mGsize;
		var nH = gHeight / mGsize;//Square
		console.log('C:: nW:'+nW);

		for(i=0;i<nH;i++){ 
			for(j=0;j<nW;j++){
				var id_ = j+i*nW;  

				mState[id_] = 0;
				mPreState[id_] = 0;
				mReady[id_] = 0; 

				mCellSurface.context.beginPath();
				mCellSurface.context.fillStyle = mGrey;//'rgb(50, 50, 50)';
				mCellSurface.context.fillRect(mGsize*j, mGsize*i, mGsize, mGsize);//X、Y、W、H
				mCellSurface.context.strokeStyle = 'rgb(0, 0, 0)';
				mCellSurface.context.strokeRect(mGsize*j, mGsize*i, mGsize, mGsize);

			}//j
		}//i

		function mSetCellColor(id_)
		{
			var color_ = mGrey;

			if(mState[id_]==0){
				
			}
			else if(mState[id_]==1){
				color_ = 'rgb(0,255,0)';
			}
			else if(mState[id_]==-1){
				color_ = 'rgb(255,0,0)';
			}

			if(mReady[id_]==1){
				color_ = 'rgb(0,126,0)';
				if(mPlayerID==2){
					color_ = 'rgb(126,0,0)';
				}
			}

			var y = Math.floor(id_/nW);
			var x = id_%nW;

			mCellSprite.image.context.beginPath();
			mCellSprite.image.context.fillStyle = color_;
			mCellSprite.image.context.fillRect(x*mGsize, y*mGsize, mGsize, mGsize);//X、Y、W、H
			mCellSprite.image.context.strokeStyle = 'rgb(0, 0, 0)';
			mCellSprite.image.context.strokeRect(x*mGsize, y*mGsize, mGsize, mGsize);	

		}//


		function mAddReadyCell()
		{
			console.log('mAddReadyCell:');

			var a_ = Array();
			var c = 0;

			for(i=0;i<nH;i++){ 
				for(j=0;j<nW;j++){
					var id_ = j+i*nW;
					if(mReady[id_]==1){
						mState[id_]=1;
						if(mPlayerID==2){
							mState[id_]=-1;
						}
						mReady[id_]=0;
						mSetCellColor(id_);

						a_[c] = id_;
						a_[c+1] = mState[id_];
						c += 2;
					}
				}
			}	

			socket.emit('addCell', a_);
		}


		function mClearCell()
		{
			console.log('mClearCell:');

			for(i=0;i<nH;i++){ 
				for(j=0;j<nW;j++){
					var id_ = j+i*nW;
						mState[id_]=0;
						mReady[id_]=0;
						mSetCellColor(id_);
				}
			}	
		}


		function mGetCellNumber()
		{
			var c_ = 0;
			for(i=0;i<nH*nW;i++){ 
				if(mState[i]==1){
					c_ += 1;
				}
			}
			return c_;
		}//

		function mGetEnemyCellNumber()
		{
			var c_ = 0;
			for(i=0;i<nH*nW;i++){ 
				if(mState[i]==-1){
					c_ += 1;
				}
			}
			return c_;
		}//

		var mDrop = new Sprite(30,30);
		mDrop.moveTo(10, 10+gHeight);		
		var surface_ = new Surface(30, 30);
			surface_.context.beginPath();
			surface_.context.fillStyle = 'rgb(0,0,255)';
			surface_.context.fillRect(0, 0, 30, 30);//X、Y、W、H
		mDrop.image = surface_;
		S_MAIN.addChild(mDrop);


		mDrop.ontouchend = function () 
		{	
			game.assets[ClickSound].clone().play();		//クリックの音を鳴らす。
			mAddReadyCell();
		};


		//--- Touch event ---//
		var mTouchDown = 0;
		S_MAIN.addEventListener('touchstart', function(e) 
		{
			mTouchDown = 1;

			if(mPlayerID==0){
				return;
			}

			//console.log('touchstart:'+ 'X:' + e.localX + ',' + 'Y:' + e.localY);
			var cx = Math.floor(e.localX/mGsize);
			var cy = Math.floor(e.localY/mGsize);
			console.log('touchstart:'+ 'X:' + cx +','+'Y:'+cy);

			if( (cx>=0) && (cx<nW) && (cy>=0) && (cy<nH) ){
				mLastPos[0] = cx;
				mLastPos[1] = cy;
				game.assets[CellSound].clone().play();

				var idx_ = cy*nW+cx;
				mReady[idx_] = (mReady[idx_]+1)%2;
				console.log('mReady:' + mReady[idx_]);

				mSetCellColor(idx_);
			}
		});
		
		
		S_MAIN.addEventListener('touchmove', function(e) 
		{
			if( mTouchDown == 0 ){
				return;
			}

			if(mPlayerID==0){
				return;
			}

			var cx = Math.floor(e.localX/mGsize);
			var cy = Math.floor(e.localY/mGsize);
			console.log('touchmove:'+ 'X:' + cx +','+'Y:'+cy);

			if( (cx>=0) && (cx<nW) && (cy>=0) && (cy<nH) )
			{
				var idx_ = cy*nW+cx;
				var last_idx_ = mLastPos[1]*nW+mLastPos[0];
				if( idx_ != last_idx_ )
				{
					game.assets[CellSound].clone().play();

					mReady[idx_] = (mReady[idx_]+1)%2;
					console.log('mReady:' + mReady[idx_]);

					mSetCellColor(idx_);

					mLastPos[0] = cx;
					mLastPos[1] = cy;
				}

			}
		});

		S_MAIN.addEventListener('touchend', function(e) 
		{
			mTouchDown = 0;
		});
		
		//--- Key command ---//
		var mDirection = 0; //0:up, 1;right, 2:down, 3:left

		function mSetReadyCell(array_)
		{
			console.log('mSetReadyCell:'+ array_.length);
			var n_ = array_.length / 2;

			for(p=0;p<n_;p++){ 
				var i = array_[p*2+1];
				var j = array_[p*2+0];
				var id_ = j+i*nW;
				mReady[id_]=1;
				mSetCellColor(id_);
			}	
		}


		mDrop.addEventListener('enterframe', function(e) 
		{
			if (game.input.left){
				console.log('left pressed:'); //-> not shown
				//game.assets[CellSound].clone().play(); //-> executed
				mDirection = 3;
				game.assets[CellSound].clone().play();
				mDirIndicator.moveTo(mBtnLeft.x-3,mBtnLeft.y-3);
			}
			if (game.input.right){
				mDirection = 1;
				game.assets[CellSound].clone().play();
				mDirIndicator.moveTo(mBtnRight.x-3,mBtnRight.y-3);
			}
			if (game.input.up){
				mDirection = 0;
				game.assets[CellSound].clone().play();
				mDirIndicator.moveTo(mBtnUp.x-3,mBtnUp.y-3);
			}   
			if (game.input.down){
				mDirection = 2;
				game.assets[CellSound].clone().play();
				mDirIndicator.moveTo(mBtnDown.x-3,mBtnDown.y-3);
			} 
			//console.log('mDirection:'+mDirection);//->OK



			if (game.input.g){
				game.assets[CellSound].clone().play();
				mSetReadyCell( mCreateGlider(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
			} 

			if (game.input.s){
				game.assets[CellSound].clone().play();
				mSetReadyCell( mCreateSpaceShipS(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
			} 

			if (game.input.one){
				game.assets[CellSound].clone().play();
				mSetReadyCell( mCreateGliderGun(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
			} 

			if (game.input.two){
				game.assets[CellSound].clone().play();
				mSetReadyCell( mCreateMax(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
			} 


			if (game.input.p){
				mPause = (mPause+1)%2;
			}

			if (game.input.space){
				game.assets[ClickSound].clone().play();
				mAddReadyCell();
			}

		});

		game.keybind(71,'g');
		game.keybind(80,'p');
		game.keybind(83,'s');
		game.keybind(32,'space');
		game.keybind(49,'one');
		game.keybind(50,'two');
		//----------------------------

		var mDirIndicator = new Sprite(36,36);
		mDirIndicator.moveTo(-200, 0);		
		var surface_d = new Surface(36, 36);
			surface_d.context.beginPath();
			surface_d.context.fillStyle = 'rgb(0,255,255)';
			surface_d.context.fillRect(0, 0, 36, 36);//X、Y、W、H
		mDirIndicator.image = surface_d;
		S_MAIN.addChild(mDirIndicator);


		var px_mBtnUp = 90;
		var mBtnUp = new Sprite(30,30);
		mBtnUp.moveTo(px_mBtnUp, gHeight+10);		
		mBtnUp.image = game.assets[mImgUp];
		S_MAIN.addChild(mBtnUp);

		mBtnUp.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mDirection = 0;
			mDirIndicator.moveTo(mBtnUp.x-3,mBtnUp.y-3);
		};


		var mBtnRight = new Sprite(30,30);
		mBtnRight.moveTo(px_mBtnUp+35, gHeight+10+25);		
		mBtnRight.image = game.assets[mImgRight];
		S_MAIN.addChild(mBtnRight);

		mBtnRight.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mDirection = 1;
			mDirIndicator.moveTo(mBtnRight.x-3,mBtnRight.y-3);
		};


		var mBtnDown = new Sprite(30,30);
		mBtnDown.moveTo(px_mBtnUp, gHeight+10+50);		
		mBtnDown.image = game.assets[mImgDown];
		S_MAIN.addChild(mBtnDown);

		mBtnDown.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mDirection = 2;
			mDirIndicator.moveTo(mBtnDown.x-3,mBtnDown.y-3);
		};


		var mBtnLeft = new Sprite(30,30);
		mBtnLeft.moveTo(px_mBtnUp-35, gHeight+10+25);		
		mBtnLeft.image = game.assets[mImgLeft];
		S_MAIN.addChild(mBtnLeft);

		mBtnLeft.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mDirection = 3;
			mDirIndicator.moveTo(mBtnLeft.x-3,mBtnLeft.y-3);
		};


		var mBtnGlider = new Sprite(30,30);
		var px_mBtnG = 200;
		var py_mBtnG = gHeight+10;
		mBtnGlider.moveTo(px_mBtnG, py_mBtnG);		
		mBtnGlider.image = game.assets[mImgG];
		S_MAIN.addChild(mBtnGlider);

		mBtnGlider.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mSetReadyCell( mCreateGlider(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
		};


		var mBtnShip = new Sprite(30,30);
		mBtnShip.moveTo(px_mBtnG+30+10, py_mBtnG);		
		mBtnShip.image = game.assets[mImgS];
		S_MAIN.addChild(mBtnShip);

		mBtnShip.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mSetReadyCell( mCreateSpaceShipS(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
		};


		var mBtnGun = new Sprite(30,30);
		mBtnGun.moveTo(px_mBtnG, py_mBtnG+30+10);		
		mBtnGun.image = game.assets[mImg1];
		S_MAIN.addChild(mBtnGun);

		mBtnGun.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mSetReadyCell( mCreateGliderGun(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
		};


		var mBtnMax = new Sprite(30,30);
		mBtnMax.moveTo(px_mBtnG+30+10, py_mBtnG+30+10);		
		mBtnMax.image = game.assets[mImg2];
		S_MAIN.addChild(mBtnMax);

		mBtnMax.ontouchend = function () 
		{	
			game.assets[CellSound].clone().play();
			mSetReadyCell( mCreateMax(mLastPos[0],mLastPos[1],nW,nH,mDirection) );
		};


		var mBarGR = new Sprite(gWidth*0.5,36);
		mBarGR.moveTo(gWidth*0.25, gHeight+10);		
		var srfBarGR = new Surface(gWidth*0.5,36);
			srfBarGR.context.beginPath();
			srfBarGR.context.fillStyle = 'rgb(0,255,0)';
			srfBarGR.context.fillRect(0, 0, gWidth*0.25, 36);//X、Y、W、H
			srfBarGR.context.fillStyle = 'rgb(255,0,0)';
			srfBarGR.context.fillRect(gWidth*0.25, 0, gWidth*0.25, 36);//X、Y、W、H
		mBarGR.image = srfBarGR;
		S_MAIN.addChild(mBarGR);

		function mUpdateBar()
		{
			var L = gWidth*0.5; //mBarGR._boundWidth;
			var g = mGetCellNumber();
			var r = mGetEnemyCellNumber();
			var n = g+r;
			var pg = g/n;
			var pr = r/n;
			var Lg = L*pg;
			var Lr = L*pr;

			mBarGR.image.context.beginPath();
			mBarGR.image.context.fillStyle = 'rgb(0,255,0)';
			mBarGR.image.context.fillRect(0, 0, L*pg, 36);//X、Y、W、H
			mBarGR.image.context.fillStyle = 'rgb(255,0,0)';
			mBarGR.image.context.fillRect(L*pg, 0, L*pr, 36);//X、Y、W、H

			//console.log("mUpdateBar"+Lg+","+Lr);
		}

		
		var mBGMStarted = 0;

		game.onenterframe = function () 
		{

			if(mPause==0)
			{
				//mUpdateCell();
				S_Text.text = "Players:"+mGreenTeamNo+", Cells:" + mGetCellNumber(); 
				E_Text.text = "Players:"+mRedTeamNo+", Cells:" + mGetEnemyCellNumber(); 
				W_Text.text = "Audience:"+mWhiteTeamNo; 
				//mPause = 1;
				mUpdateBar();

				if(mBGMStarted==0){
					game.assets[mBGM1].play();
					mBGMStarted = 1;
				}
			}

		};

		//--- Socket on ---//
	    socket.on('loginGreen',function(msg){
	        console.log('C::loginGreen:');
			mGreenTeamNo = msg[0];
			mRedTeamNo = msg[1];
			mWhiteTeamNo = msg[2];
		});
	    socket.on('loginRed',function(msg){
	        console.log('C::loginRed:');
			mGreenTeamNo = msg[0];
			mRedTeamNo = msg[1];
			mWhiteTeamNo = msg[2];
		});
	    socket.on('loginWhite',function(msg){
	        console.log('C::loginWhite:');
			mGreenTeamNo = msg[0];
			mRedTeamNo = msg[1];
			mWhiteTeamNo = msg[2];
		});

	    socket.on('updateCell',function(msg){
	        console.log('C::updateCell: ');
			//mPlayerID = msg;
			
			for(i=0;i<nH*nW;i++){ 
				mPreState[i] = mState[i];
				mState[i] = msg[i];
			}

			for(i=0;i<nH*nW;i++){ 
				if(mState[i]!=mPreState[i]){
					mSetCellColor(i);
				}
			}

	    });

		//--- Log in scene ---//
		S_Entry = new Scene();
		S_Entry.backgroundColor = 'rgba(0,0,150,1)';

		var L_GameTitle = new Label(); 	
		L_GameTitle.text = 'Life Game Battle';
		L_GameTitle.font = "100px Meiryo";
		L_GameTitle.color = 'rgba(0,0,0,1)';
		L_GameTitle.width = gWidth;	
		L_GameTitle.moveTo( (gWidth-L_GameTitle._boundWidth)/2, 100);
		S_Entry.addChild(L_GameTitle);	

		function mStartBattleBGM()
		{
			game.assets[mBGM2].play();
			game.assets[mBGM2].volume = 0.3;
			if(game.assets[mBGM2].src){
				game.assets[mBGM2].src.loop = true;
				console.log("mBGM2 by WebAudioSound");
			}
		}


		var bW = 300;
		var bH = 300;
		var mBtnEntry1 = new Sprite(bW,bH);
		var srf_BtnEntry1 = new Surface(bW,bH);
		srf_BtnEntry1.context.beginPath();
		srf_BtnEntry1.context.fillStyle = 'rgb(0,255,0)';
		srf_BtnEntry1.context.fillRect(0, 0, bW,bH);//X、Y、W、H
		mBtnEntry1.image = srf_BtnEntry1;
		mBtnEntry1.moveTo(gWidth*0.25-bW/2, 300);
		
		S_Entry.addChild(mBtnEntry1);
		mBtnEntry1.ontouchend = function () 
		{
			mPlayerID = 1;
			game.popScene();
			//game.pushScene(S_MAIN);

			socket.emit('loginGreen', 'login:'+mID);

			game.assets[mBGM1].stop();

			mStartBattleBGM();
		};

		var L_Team1 = new Label(); 	
		L_Team1.text = 'Team1で参戦';
		L_Team1.font = "50px Meiryo";
		L_Team1.color = 'rgba(0,0,0,1)';
		L_Team1.width = bW;
		L_Team1.moveTo( mBtnEntry1.x, mBtnEntry1.y+bH);	
		S_Entry.addChild(L_Team1);


		var mBtnEntry2 = new Sprite(bW,bH);
		var srf_BtnEntry2 = new Surface(bW,bH);
		srf_BtnEntry2.context.beginPath();
		srf_BtnEntry2.context.fillStyle = 'rgb(255,0,0)';
		srf_BtnEntry2.context.fillRect(0, 0, bW,bH);//X、Y、W、H
		mBtnEntry2.image = srf_BtnEntry2;
		mBtnEntry2.moveTo(gWidth*0.75-bW/2, 300);
		
		S_Entry.addChild(mBtnEntry2);
		mBtnEntry2.ontouchend = function () 
		{
			mPlayerID = 2;
			game.popScene();
			//game.pushScene(S_MAIN);
			socket.emit('loginRed', 'login:'+mID);

			game.assets[mBGM1].stop();

			mStartBattleBGM();
		};

		var L_Team2 = new Label(); 	
		L_Team2.text = 'Team2で参戦';
		L_Team2.font = "50px Meiryo";
		L_Team2.color = 'rgba(0,0,0,1)';
		L_Team2.width = bW;
		L_Team2.moveTo( mBtnEntry2.x, mBtnEntry2.y+bH);	
		S_Entry.addChild(L_Team2);


		var mBtnEntry0 = new Sprite(bW,bH);
		var srf_BtnEntry0 = new Surface(bW,bH);
		srf_BtnEntry0.context.beginPath();
		srf_BtnEntry0.context.fillStyle = 'rgb(255,255,255)';
		srf_BtnEntry0.context.fillRect(0, 0, bW,bH);//X、Y、W、H
		mBtnEntry0.image = srf_BtnEntry0;
		mBtnEntry0.moveTo(gWidth*0.5-bW/2, 300);
		
		S_Entry.addChild(mBtnEntry0);
		mBtnEntry0.ontouchend = function () 
		{
			mPlayerID = 0;
			game.popScene();
			//game.pushScene(S_MAIN);
			socket.emit('loginWhite', 'login:'+mID);

			game.assets[mBGM1].stop();

			mStartBattleBGM();
		};

		var L_Team0 = new Label(); 	
		L_Team0.text = '観戦する';
		L_Team0.font = "50px Meiryo";
		L_Team0.color = 'rgba(0,0,0,1)';
		L_Team0.width = bW;
		L_Team0.moveTo( gWidth*0.5-L_Team0._boundWidth*0.5, mBtnEntry0.y+bH);	
		S_Entry.addChild(L_Team0);


		game.pushScene(S_Entry);

	};// onload

	game.start();
};

