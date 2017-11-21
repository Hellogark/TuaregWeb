
var texto = document.getElementById('txtArea');
var note= document.getElementById('notas');
var seMuestra=false;

note.onclick=function(event){
    if(seMuestra==false){
          texto.style.display='block';
    seMuestra=true;
        
    }else{if(seMuestra=true){
        texto.style.display='none';
       seMuestra=false;
        
      }    
    }
}

