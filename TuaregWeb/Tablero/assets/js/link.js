
var texto = document.getElementById('txtArea');
var note= document.getElementById('notas');
var seMuestra=false;
var htm=document.getElementById('docum'); 

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

