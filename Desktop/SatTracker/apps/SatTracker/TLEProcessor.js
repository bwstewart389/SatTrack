/**
 * Created by beakman on 23/06/16.
 */
define([''], function(){

    $(document).ready(function(){
        $.getJSON('/tledata/satelliteTLE.json',function(tleResults){
            for(var i in tleResults){
                if(tleResults[i].TLELINE_0 === "0 MEXSAT 3"){
                    console.log(tleResults[i].TLELINE_0);
                }
            }

        });
    });
});