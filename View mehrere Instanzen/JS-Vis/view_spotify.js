/* -----
   Material Design JS for ioBroker.vis
   (c) 2017 Uhula, MIT License
   https://github.com/Uhula/ioBroker-Material-Design-Style
   V1.7 28.12.2017
   o Korrektur mdui-lnav/rnav. Funktionierte mit mdui-toggle nicht korrekt  
   V1.6 16.10.2017 
   O _toggleFullscreen ge�ndert, damit die function auch im ioBroker
                   fullscreen Mode funktioniert
   o Delegator-Eventhandler f�r body gesetzt (bisher #vis_container, wirkten dann aber in Dialogen nicht)
   V1.5 11.10.2017 
   o MDUI.handleTables fertig
   V1.3 24.09.2017 
   + MDUI.handleTables hinzu (in Entwicklung)
   V1.0 01.09.2017
   ----- */

// Zur sicheren CSS-Erkennung der Runtime eine CSS-Klasse anlegen
document.documentElement.className +=  " mdui-runtime";

// �berpr�fen ob touch zur Verf�gung steht und entsprechend eine 
// CSS Klasse touch bzw no-touch erzeugen 
document.documentElement.className += 
    (("ontouchstart" in document.documentElement) ? " mdui-touch" : " mdui-notouch");


/* -----
   MDUI
   ----- 
   Sammlung von JS-Funktionen f�r das Material Design
   (c) 2017 Uhula, MIT License
*/

var MDUI = (function () {


var isSubtreeModified = false;

// liefert den suffix einer gegeben class zur�ck-Navigieren
// Bsp: mdui-target-w00002 -> w00002
//      mdui-zoom-to-200 -> 200
function _getClassSuffix( $ele, classname ) {
    var suf = "";
    if ($ele) {
        var c = $ele.attr( "class" );
        suf = c.substr(c.indexOf(classname)+classname.length,1000)+" ";
        suf = suf.substr(0,suf.indexOf(" "));
    }
    return suf;    
}

//
function _getGroupID( ele ) { return _getClassSuffix(ele, "mdui-group-" ); }
//
function _getTargetID( ele ) { return _getClassSuffix(ele, "mdui-target-" ); }

//
function _getScrollbarWidth() {
    var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
}
//
function _getScrollbarHeight() {
    var $outer = $('<div>').css({visibility: 'hidden', height: 100, overflow: 'scroll'}).appendTo('body'),
        heightWithScroll = $('<div>').css({height: '100%'}).appendTo($outer).outerHeight();
    $outer.remove();
    return 100 - heightWithScroll;
}

function _formatDatetime(date, format) {
    function fill(comp) {
        return ((parseInt(comp) < 10) ? ('0' + comp) : comp)
    }
        
    var months = ['Jan', 'Feb', 'M�r', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    var d = format;
    var o = {
            "y+": date.getFullYear(), // year
            "m+": fill(date.getMonth()+1), //month
            "M+": months[date.getMonth()], //month
            "d+": fill(date.getDate()), //day
            "H+": fill((date.getHours() > 12) ? date.getHours() % 12 : date.getHours()), //hour
            "h+": fill(date.getHours()), //hour
            "n+": fill(date.getMinutes()), //minute
            "s+": fill(date.getSeconds()), //second
            "S+": fill(date.getMilliseconds()), //millisecond,
            "b+": (date.getHours() >= 12) ? 'PM' : 'AM'
        };
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            d = d.replace(RegExp.$1, o[k]);
        }
    }
    return d;
}



// alle Elemente mit class "mdui-group-XXX" togglen, in denen 
// XXX aus class "mdui-group-XXX" des ele ist UND
// alle Elemente mit class "mdui-target-XXX" togglen, in denen 
// XXX aus class "mdui-target-XXX" des ele ist
function _toggleVisibility( $ele ) {
    $ele.toggleClass("ui-state-active");
    var id = _getGroupID( $ele );
    if (id!=="") 
        $("[class*='mdui-group-"+id+"']").not("[class*='mdui-toggle']").each( function (index) {
            $(this).toggleClass("mdui-hide");
        });    
    id = _getTargetID( $ele );
    if (id!=="") 
        $( "[class*='mdui-target-"+id+"']").not("[class*='mdui-toggle']").each( function (index) {
            $(this).toggleClass("mdui-hide");
        });
}

// das in ele class \"mdui-target-XXX\" angegeben Element mit der id \"XXX\"  wird 
// - fullscreen angezeigt, wenn es noch nicht fullscreen ist
// - wieder normal angezeigt, wenn es fullscreen ist
function _toggleFullscreen( $ele ){
    if (!$ele) return;
    var $target = $ele.closest(".vis-view");
    if (!$target) return;
    var styleold = $target.attr("styleold");
    if (styleold) {
        $target.attr("style",styleold);
        $target.removeAttr("styleold");
        $target.appendTo(".mdui-id-"+$target.attr("id"));
        } else {
            $target.parent().addClass("mdui-id-"+$target.attr("id"));
            $target.attr("styleold",$target.attr("style"));
            $target.attr("style","position:fixed; left:0; top:0; width:100%; height:100%; z-index: 2147483647 !important;background:#212121 !important; ");
            $target.appendTo( "body" );
            //$target.appendTo( "body #vis_container" );
            }
}


// ele muss class Eintr�ge f�r das Target und den Skalierungsmodus haben
// "mdui-target-(id) mdui-scale-(scalemode)" 
// id: Ziel-Element mit id=id, welches ein zu skalierendes img enth�lt
// scalemode: fit / hfit / vfit / in / out / (number)
// number: Zahl in %
function _scale( ele ) {
    var id = _getTargetID( ele );
    var $img = $( "#"+id+" img" );
    if ($img) {
        var scale = _getClassSuffix(ele, "mdui-scale-" );
        $img.width("1px"); // Scrollbars entfernen um die echte H�he zu bekommen
        $img.height("1px");
        var dim = {
            pw : $img.parent().width(), 
            ph : $img.parent().height(), 
            w  : $img[0].naturalWidth, 
            h  : $img[0].naturalHeight
        };
        switch(scale) {
            case "fit":
                if (dim.pw / dim.w < dim.ph / dim.h ) scale = dim.pw / dim.w;  
                else scale = dim.ph / dim.h;
                break;
            case "hfit":
                if (dim.pw / dim.w < dim.ph / dim.h ) scale = dim.pw / dim.w;
                else scale = (dim.pw - _getScrollbarWidth() - 4  ) / dim.w;
                break;
            case "vfit":
                if ( dim.pw / dim.w > dim.ph / dim.h ) scale = dim.ph / dim.h;
                else scale = (dim.ph - _getScrollbarHeight() - 4  ) / dim.h;
                break;
            case "in":
            case "out":
                var old = $img.attr( "style" );
                old = old.substr(old.indexOf("scale(")+6,20);  
                old = old.substr(0,old.indexOf(")"));  
                if (old * 1==0) scale = 1;
                else if (scale=="in") scale = old * 1.41;
                     else scale = old / 1.41;
                break;
            default:
                if (scale<=0 || scale>10000)
                    scale = 100;
                scale = scale/100;
        }
        scale = Math.round(scale*100)/100;
        $img.attr( "style", "position:absolute;top:0;left:0;transform-origin:0 0;transition: transform 0.3s ease-out; transform:scale("+scale+");" );
        }
}

// ersetzt im src-Attribute des Unter-Elements von (id) den "&range=& 
// durch den Wert des in ele angegebenen (span). F�r flot-Diagramme
// "mdui-target-(id) mdui-timespan-(span)" 
// id: Ziel-Element mit id=id, welches das flot (src) enth�lt
// span: inc / dec / (number)
// number: Zahl in Minuten
function _timespan( ele ) {
    var id = _getTargetID( ele );
    var target = $( "#"+id+" [src]" );
    if (target) {
        var timespan = _getClassSuffix(ele, "mdui-timespan-" );
        var src = target.attr( "src" );
        var min = src.substr(src.indexOf("&range=")+7,20);  
        min = min.substr(0,min.indexOf("&"));  
        switch(timespan) {
            case "inc":
                min = min * 2;
                break;
            case "dec":
                min = min / 2;
                break;
            default:
                if ( timespan<=0 )
                    timespan = 1440;
                min = timespan;
        }
        src = src.replace(/&range=[0-9]*&/g, "&range="+min+"&");
        target.attr("src",src);
    }
}

/*  */
function _resetTable( $ele, $table ) {
    $ele.removeClass("mdui-table-tile");
    $ele.removeClass("mdui-table-card");
    $ele.removeClass("mdui-table-list");
    $table.find("tbody>tr").each( function(index) {
        $(this).width("auto");
        $(this).height("auto");
        $(this).find("td").each( function(index) {
            $(this).attr("labelth","");
        });  
    });
}

/*  */
function _handleTable( $ele, $table, opt ) {

    function setColWidth( colwidth ) {
        $table.find("tbody>tr").each( function(index) {
            $(this).outerWidth(colwidth);
        });
    }
    function setColHeight() {
        var height = 0;
        $table.find("tbody>tr").each( function(index) {
            if ($(this).height() > height ) height = $(this).height();
        });
        if ( height > 0 )
            $table.find("tbody>tr").each( function(index) {
                $(this).height( height );
            });
    }
    
    var innerWidth = $ele.innerWidth();

    _resetTable($ele, $table);
    $ele.addClass("mdui-table-"+opt.type);
    if (opt.label) {
        // Zellen mit Labels aus <th> erg�nzen ?    
        var labels = [];
        $table.find("thead>tr>th").each( function(index) {
            labels[index] = $(this).text();
        });
        $table.find("tbody>tr").each( function(index) {
            $(this).find("td").each( function(index) {
                if (index < labels.length) 
                    $(this).attr("labelth",labels[index]);
            });  
        });
    }

    if (opt.colwidth>1) setColWidth(opt.colwidth);
    if (opt.colwidth>2) setColHeight();

    return true;    
}


/* Alle mdui-table durchlaufen und �berpr�fen, ob die minimale Width erreicht
wurde um sie in den responsive State zu �berf�hren 
mdui-table-(mode)(-opt1)(-opt2)...(-optn)
mdui-table-ascard-r600-w200-l */
function _handleTables( ) {
    $("[class*='mdui-table ']").each( function (index) {
        var $ele = $(this);
        var $table;
        $table = $ele;
        if (!$table.is("table")) $table=$table.find("table");
        if (!$table.is("table")) return true; // next each 
        
        var innerWidth = $ele.innerWidth();
        var classes = $ele.attr("class")
            .split(" ")
            .filter( function ( ele ) { 
                    return  (ele.indexOf("mdui-table-ascard") > -1)
                         || (ele.indexOf("mdui-table-astile") > -1)
                         || (ele.indexOf("mdui-table-aslist") > -1); });
        var opts = [];
        var opt;
        for (var i = 0; i < classes.length; i++) {
            opts[i] = [];
            opts[i].reswidth = 9999;
            opts[i].colwidth = 0;
            opts[i].label = false;
            opts[i].type = classes[i].substr(13,4); 
            opt = classes[i].substr(18,200).split("-"); 
            for (var j = 0; j < opt.length; j++) {
                switch(opt[j][0]) {
                case "r":
                    opts[i].reswidth = parseInt(opt[j].substr(1,5));
                    break;
                case "w":
                    opts[i].colwidth = parseInt(opt[j].substr(1,5));
                    break;
                case "c":
                    opts[i].colwidth = parseInt(opt[j].substr(1,5));
                    if (opts[i].colwidth>0) opts[i].colwidth = (innerWidth-_getScrollbarWidth()-8) / opts[i].colwidth;
                    break;
                case "l":
                    opts[i].label = true;
                    break;
                default:    
                }                       
            }
        }
        opts.sort(function(a, b){return a.reswidth-b.reswidth});
//console.log(opts);
        if (opts.length === 0) return true; // next each 
        var handled = false;
        for (i = 0; i < opts.length; i++) {
            if ( innerWidth < opts[i].reswidth )
               handled = _handleTable( $ele, $table, opts[i]);
            if (handled) break;   
        }
        if (!handled) _resetTable($ele, $table);
    }); 

}




// DOM SubTree-�nderungen einmalig alle 500ms auswerten (diese Events werden 
// u.U. 1000-fach gefeuert und m�ssen deswegen verz�gert ausgef�hrt werden)
function _onSubTreeModified( $ele ) {
    if (!isSubtreeModified) {
        isSubtreeModified = true;
        setTimeout(function () {
            _handleTables();
            isSubtreeModified=false;
        }, 500);
    }
}

return {
    toggleVisibility: _toggleVisibility,
    toggleFullscreen: _toggleFullscreen,
    scale: _scale,
    timespan: _timespan,
    handleTables: _handleTables,
    onSubTreeModified : _onSubTreeModified
};

})();


// Eventhandler f�r body-Delegators setzen (fr�her:#vis_container) 
setTimeout(function () {
    // click-Event f�r das left-nav Element zum �ffnen
    $("body").on( "click", ".mdui-lnavbutton", function() { 
        $( ".mdui-lnav" ).addClass( "mdui-lnav-open" );
    } );
    // click-Event f�r die left-nav zum Schlie�en
    $("body").on( "click", ".mdui-lnav", function() { 
        $( ".mdui-lnav" ).removeClass( "mdui-lnav-open" ); 
    } );
    // click-Event f�r das right-nav Element zum �ffnen
    $("body").on( "click", ".mdui-rnavbutton", function() { 
        $( ".mdui-rnav" ).addClass( "mdui-rnav-open" );
    } );
    // click-Event f�r die right-nav zum Schlie�en
    $("body").on( "click", ".mdui-rnav", function() { 
        $( ".mdui-rnav" ).removeClass( "mdui-rnav-open" ); 
    } );

    // click-Eventhandler f�r "mdui-scale-" setzen
    $("body").on( "click", "[class*='mdui-scale-']", function(event) { 
        MDUI.scale( $(this) );
    } );

    // click-Handler f�r "mdui-toggle"  
    $("body").on( "click", ".mdui-toggle", function(event) { 
        event.preventDefault();
        event.stopImmediatePropagation();
        MDUI.toggleVisibility( $(this) );
    } );

    // click-Handler f�r "mdui-fullscreen" 
    $("body").on( "click", ".mdui-fullscreen", function(event) { 
        MDUI.toggleFullscreen( $(this) );
    } );

    // click-Handler f�r "mdui-timepsan-" 
    $("body").on( "click", "[class*='mdui-timespan-']", function(event) { 
        MDUI.timespan( $(this) );
    } );

    $( window ).on("resize", function() {
      MDUI.handleTables();
    });

    // �berwachen des #vis_containers auf �nderungen (z.B. wenn views nachgeladen
    // werden)
    $( "#vis_container" ).on( "DOMSubtreeModified", function(event) { 
        MDUI.onSubTreeModified( $(this) );
    } );
    // f�r den ersten load einmal aufrufen
    MDUI.onSubTreeModified( );

}, 1000); 