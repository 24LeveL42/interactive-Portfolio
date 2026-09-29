@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

*{
  box-sizing:border-box;
}

html,
body{
  margin:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#07131c;
  font-family:Inter,Arial,sans-serif;
  color:white;
}

#game{
  position:relative;
  width:100%;
  height:100%;
  overflow:hidden;
}

canvas{
  position:absolute;
  inset:0;
  display:block;
}

/* LOADING */

#loading{
  position:fixed;
  z-index:50;
  inset:0;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  background:
    radial-gradient(
      circle at center,
      #17495a 0%,
      #0b2632 40%,
      #06131b 100%
    );

  transition:opacity .8s;
}

#loading.hide{
  opacity:0;
  pointer-events:none;
}

.loader-ring{
  width:48px;
  height:48px;

  border:2px solid #285a69;
  border-top-color:#4df6ff;
  border-right-color:#a7fff3;

  border-radius:50%;

  animation:spin 1s linear infinite;

  margin-bottom:22px;
}

@keyframes spin{
  to{
    transform:rotate(360deg);
  }
}

.loading-title{
  font-size:30px;
  font-weight:900;
}

.loading-title span,
.brand span{
  color:#4df6ff;
}

.loading-sub{
  margin-top:8px;

  font-size:10px;
  letter-spacing:4px;

  color:#b3d5df;
}

/* TOP BAR */

.topbar{
  position:absolute;
  z-index:10;

  top:0;
  left:0;
  right:0;

  height:76px;

  padding:0 34px;

  display:flex;
  align-items:center;
  justify-content:space-between;

  pointer-events:none;

  background:
    linear-gradient(
      180deg,
      rgba(3,18,28,.7),
      transparent
    );
}

.brand{
  font-size:20px;
  font-weight:900;
}

.module{
  font-size:10px;
  letter-spacing:2px;
  color:#d0e5ec;
}

#menuBtn{
  pointer-events:auto;

  padding:11px 16px;

  border:1px solid #4b7b8a;
  border-radius:3px;

  background:rgba(8,34,46,.7);

  color:white;

  cursor:pointer;

  font-size:10px;
  letter-spacing:2px;

  box-shadow:
    0 0 18px rgba(77,246,255,.12);
}

/* INTRO */

.intro{
  position:absolute;
  z-index:5;

  top:110px;
  left:34px;

  pointer-events:none;

  text-shadow:
    0 3px 30px rgba(0,0,0,.5);
}

.eyebrow{
  font-size:10px;
  letter-spacing:3px;

  color:#4df6ff;

  font-weight:700;
}

.intro h1{
  margin:13px 0 14px;

  font-size:clamp(34px,5vw,68px);

  line-height:.98;

  letter-spacing:-3px;

  font-weight:700;
}

.intro h1 strong{
  font-weight:900;
}

.intro p{
  font-size:12px;
  color:#d1e3e9;
}

.hint{
  margin-top:18px;

  font-size:10px;

  color:#a1bbc5;

  letter-spacing:1px;
}

/* HUD */

#hud{
  position:absolute;
  z-index:5;

  bottom:26px;
  left:30px;
  right:30px;

  display:flex;
  justify-content:space-between;

  font-size:9px;
  letter-spacing:1.7px;

  color:#b3cbd3;

  pointer-events:none;
}

.hud-left span{
  color:#4df6ff;
  font-size:12px;
}

#speedValue{
  color:#4df6ff;

  font-weight:800;

  text-shadow:
    0 0 8px rgba(77,246,255,.7);
}

/* CROSSHAIR */

#crosshair{
  position:absolute;
  z-index:4;

  left:50%;
  top:50%;

  width:12px;
  height:12px;

  transform:translate(-50%,-50%);

  border:1px solid rgba(255,255,255,.6);

  border-radius:50%;

  pointer-events:none;

  box-shadow:
    0 0 8px #4df6ff;
}

/* PANELS */

#panel,
#menu{
  position:absolute;
  z-index:20;

  top:50%;
  left:50%;

  transform:translate(-50%,-50%);

  background:
    rgba(7,28,39,.95);

  border:1px solid #4c8999;

  box-shadow:
    0 30px 100px rgba(0,0,0,.5),
    0 0 35px rgba(77,246,255,.12);

  backdrop-filter:blur(15px);
}

#panel{
  width:min(570px,calc(100% - 40px));

  padding:38px;
}

.hidden{
  display:none !important;
}

#closePanel,
#closeMenu{
  position:absolute;

  right:17px;
  top:14px;

  border:0;

  background:none;

  color:#b4cbd3;

  font-size:27px;

  cursor:pointer;
}

#panelTag{
  font-size:9px;

  letter-spacing:3px;

  color:#4df6ff;

  font-weight:700;
}

#panelTitle{
  margin:12px 0 18px;

  font-size:38px;

  line-height:1;

  letter-spacing:-2px;
}

#panelBody{
  color:#c5d8de;

  font-size:13px;

  line-height:1.75;
}

#panelLink{
  display:inline-block;

  margin-top:23px;

  color:#4df6ff;

  border-bottom:1px solid #4df6ff;

  text-decoration:none;

  font-size:10px;

  letter-spacing:2px;

  font-weight:700;
}

/* MENU */

#menu{
  width:min(470px,calc(100% - 40px));

  padding:38px 32px;
}

.menu-title{
  font-size:10px;

  letter-spacing:3px;

  color:#4df6ff;

  margin-bottom:22px;
}

.menu-item{
  border-top:1px solid #31505d;

  padding:18px 2px;

  color:#86a1aa;

  font-size:10px;

  letter-spacing:2px;

  cursor:pointer;

  transition:.2s;
}

.menu-item:last-of-type{
  border-bottom:1px solid #31505d;
}

.menu-item span{
  color:white;

  margin-left:22px;

  font-weight:700;
}

.menu-item:hover{
  padding-left:8px;

  color:#4df6ff;
}

.menu-footer{
  font-size:9px;

  color:#8ba2aa;

  margin-top:22px;

  line-height:1.6;
}

/* MOBILE */

#mobileControls{
  display:none;

  position:absolute;

  z-index:10;

  left:20px;
  bottom:60px;
}

#mobileControls button{
  width:46px;
  height:42px;

  margin:2px;

  background:
    rgba(8,34,46,.72);

  border:1px solid #4b7b8a;

  color:white;

  border-radius:5px;

  touch-action:none;
}

#mobileControls>button{
  display:block;

  margin-left:52px;
}

@media(max-width:700px){

  .topbar{
    height:60px;
    padding:0 18px;
  }

  .module{
    display:none;
  }

  .intro{
    top:83px;
    left:18px;
  }

  .intro h1{
    font-size:39px;
    letter-spacing:-2px;
  }

  .intro p{
    font-size:10px;
  }

  #hud{
    left:18px;
    right:18px;
    bottom:15px;
  }

  .hud-right{
    display:none;
  }

  #mobileControls{
    display:block;
  }
}
