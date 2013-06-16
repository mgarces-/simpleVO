/* http://www.harrymaugans.com/2007/03/24/one-click-toggle-for-sliding-animated-div/ */

/* This script was heavily modified by F. Stoehr, ST-ECF, 2009. 
   The index is not the name of the div but the object itself. This allows to open
   and close divs that have no id. The startslide was modified so that also divs with
   dynamic content can be used. It is required that all divs that are to be slided have
   overflow: hidden; in their css description. Specifying a height is not necessary any more. */
   

var timerlen = 5;
var slideAniLen = 1000;

var timerID = new Array();
var startTime = new Array();
var obj = new Array();
var endHeight = new Array();
var moving = new Array();
var dir = new Array();

function slidedown(objname){
        if(moving[objname])
                return;

        if(objname.style.display != "none")
                return; // cannot slide down something that is already visible

        moving[objname] = true;
        dir[objname] = "down";
        startslide(objname);
}

function slideup(objname){
        if(moving[objname])
                return;

        if(objname.style.display == "none")
                return; // cannot slide up something that is already hidden

        moving[objname] = true;
        dir[objname] = "up";
        startslide(objname);
}

function startslide(objname){
   obj[objname] = objname;

   if(dir[objname] == "down"){
   obj[objname].style.height = "1px";
   }

   obj[objname].style.display = "block";
   startTime[objname] = (new Date()).getTime();
   endHeight[objname] = obj[objname].scrollHeight;
   timerID[objname] = setInterval('slidetick(\'' + objname + '\');',timerlen);
}

function slidetick(objname){
        var elapsed = (new Date()).getTime() - startTime[objname];

        if (elapsed > slideAniLen)
                endSlide(objname)
        else {
                var d =Math.round(elapsed / slideAniLen * endHeight[objname]);
                if(dir[objname] == "up")
                        d = endHeight[objname] - d;

                obj[objname].style.height = d + "px";
        }

        return;
}

function endSlide(objname){
        clearInterval(timerID[objname]);

        if(dir[objname] == "up")
                obj[objname].style.display = "none";

        obj[objname].style.height = endHeight[objname] + "px";

        delete(moving[objname]);
        delete(timerID[objname]);
        delete(startTime[objname]);
        delete(endHeight[objname]);
        delete(obj[objname]);
        delete(dir[objname]);

        return;
}

