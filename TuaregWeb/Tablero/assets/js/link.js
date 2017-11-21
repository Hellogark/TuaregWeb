
var texto = document.getElementById('txtArea');
var note= document.getElementById('notas');
var seMuestra=false;
var htm=document.getElementById('docum'); 
var w = $(document).height();
note.onclick=function(event){
    if(seMuestra==false){
          htm.style.overflowY='scroll';
          texto.style.display='block';
        
    seMuestra=true;
        
        
    }else{if(seMuestra=true){
        window.scrollTo(900,0);
        
        texto.style.display='none';
       seMuestra=false;
        htm.style.overflowY='hidden';
        
      }    
    }
}
htm.onresize=function(event){
if(w<=1100){
        htm.style.overflowY='scroll';
        }
}

