
var texto = document.getElementById('txtArea');
var note= document.getElementById('notas');
var seMuestra=false;
var htm=document.getElementById('docum'); 
var bod=document.getElementById('cuerpo');
    var w = $(document).height();
note.onclick=function(event){
    if(seMuestra==false){
        
          htm.style.overflowY='scroll';
        htm.style.maxWidth='100%';
          texto.style.display='block';
        
    seMuestra=true;
        
        
    }else{
        if(seMuestra==true){
        window.scrollTo(-900,0);
        
        texto.style.display='none';
           // htm.style.overflowY='hidden';
       seMuestra=false;
         //window.scrollTo(0,-900);
       
    }
}
}
htm.onresize=function (event){
 if($(window).width()<=1100  ){
            htm.style.overflowY='scroll';
            
        }else
            { if($(window).width()>=1101 && document.bod.scrollTop == 0){
            
            window.scrollTo(-9000,0); 
            htm.style.overflowY='hidden';
                bod.style.overflowY='scroll';
            }
            }
}

         
        


