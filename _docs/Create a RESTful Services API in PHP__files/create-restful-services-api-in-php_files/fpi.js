//LJT_AdsiFrame_Opts used in legacy fpi.js calls like adsense
if (typeof LJT_AdsiFrame_Opts === "undefined") { LJT_AdsiFrame_Opts = null; }
if (typeof LJT_placement_id === "undefined") { LJT_placement_id = null; }
var LJT_AdsiFrame = (function(){
	function isInIframe(){
		return self !== top;
	}
	function getScriptTag(){
		var scripts = document.getElementsByTagName('script');
		//Try last script tag first; else iterate backwards
		var last_script = scripts[scripts.length-1];
		if(last_script.src.search(/\/delivery\/fpi.js/) >= 0) {
			return last_script;
		} else {
			try {
				for(var n = scripts.length-1; n >= 0; n--) {
					if(scripts[n].src.search(/\/delivery\/fpi.js/) >= 0) {
						return scripts[n];
					}
				}
			} catch(e) { return last_script; }
		}
		return last_script;
	}
	function getQueryString(){
		var myScript = getScriptTag();
		if(myScript.src.search(/\/delivery\/fpi.js/) >= 0) {
			return myScript.src.replace(/^[^\?]+\??/,'');
		} else {
			return false;
		}
	}
	//Parses Query String and returns value for given argument
	function getQueryStringArg(queryString, key, default_){
		if (default_ === null){
			default_ = ""; 
		}
		var query_obj = {};
		queryString.replace(
			new RegExp("([^?=&]+)(=([^&]*))?", "g"),
			function($0, $1, $2, $3) { query_obj[$1] = $3; }
		);
		if(typeof(query_obj[key]) === 'undefined' || query_obj[key] === null){
			return default_;
		} else {
			return query_obj[key];
		}
	}
	function getSiteURL(){
		try{
			if(isInIframe() && !!document.referrer) { 
				var site_loc = document.referrer.toString().replace(/^\s+|\s+$/g,'');
			} else {
				var site_loc = document.location.toString();
			}
		} catch(e){}
		return getQueryStringArg(getQueryString(),'loc', site_loc).replace(/["']/g, '');
	}
	function getRefSiteURL(){
		var ref = '';
		try{
			if(!isInIframe() && !!document.referrer) { 
				ref = document.referrer.toString().replace(/^\s+|\s+$/g,'');
			}
		} catch(e){}
		return ref.replace(/["']/g, '');
	}
	function getOD(){
		return getDomain(document.location.toString()).replace(/["']/g, '');
	}
	function getDomain(url){
		try {
			function parseUri (str) { //adapted from stevenlevithan.com
				var	o = parseUri.options,m = o.parser.loose.exec(str),uri = {},i = 14;while (i--) uri[o.key[i]] = m[i] || "";
				uri[o.q.name] = {};	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {if ($1) uri[o.q.name][$1] = $2;});
				return uri;
			}
			parseUri.options = {
				key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
				q: { name: "queryKey", parser: /(?:^|&)([^&=]*)=?([^&]*)/g },
				parser: { loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/	}
			};
			return parseUri(url).host;
		} catch(e) {}
		return url;
	}
	function getFPQueryString(queryString, add_all_tokens){
		var qstring = '?ljtiframe=1';
		if(add_all_tokens) {
			qstring += '&loc='+encodeURIComponent(getSiteURL())+'&od='+encodeURIComponent(getOD())+'&ref='+encodeURIComponent(getRefSiteURL());
		}
		var args = queryString.split('&');
		for(var i=0; i<args.length; i++){
			var arg = args[i].split('=');
			var key = arg[0];
			var value = arg[1];
			if(key==='u'||key==='z'||key==='n'||key==='lijit_domain'||key.match(/^ljt_/)){
				qstring += '&'+encodeURIComponent(key)+"="+encodeURIComponent(value);
			}
		}
		return qstring;
	}
	function createiFrame(width, height){
		//Create the iFrame
		var ifrm = document.createElement('iframe');
		ifrm.setAttribute('width',width+'px');
		ifrm.setAttribute('height',height+'px');
		ifrm.setAttribute('frameBorder','0');
		ifrm.setAttribute('scrolling','no');
		try{
			ifrm.style.width = width+"px";
			ifrm.style.height = height+"px";
			ifrm.style.overflow = 'hidden';
			ifrm.style.border = '0px';
		} catch(e){}
		return ifrm;
	}
	var queryString = null;
	if(LJT_AdsiFrame_Opts !== null){queryString = LJT_AdsiFrame_Opts;} else {queryString = getQueryString();}
	var ljtLocTag = "<script type='text/javascript'>var LJT_Loc={};"+ 
		"LJT_Loc.loc='"+getSiteURL()+"';LJT_Loc.ref='"+getRefSiteURL()+"';LJT_Loc.ifr='"+(isInIframe()?'1':'0')+"';LJT_Loc.od='"+getOD()+"';</script>";
	var domain = getQueryStringArg(queryString,'lijit_domain','www.lijit.com');
	var fpTag = '<scr'+'ipt type="text/javascript" src="http://'+domain+'/delivery/fp'+getFPQueryString(queryString, false)+'"></scr'+'ipt>';
	var htmlPrefix = "<html><body style='padding:0px; margin:0px;'>";
	var htmlSuffix = "<![if !IE]><script type='text/javascript'>document.close();</script><![endif]></body></html>";

	//If in iFrame we can just render the FP tag otherwise we need to do an iFrame call
	if(isInIframe()){
		document.write(ljtLocTag + fpTag);
	} else {
		if(LJT_AdsiFrame_Opts !== null){
			var placement = LJT_placement_id||"LJT_FPI_" + getQueryStringArg(queryString,'z',0);
			var scriptTag = document.getElementById(placement)||getScriptTag();
		} else {
			var scriptTag = getScriptTag();
		}
		var width = getQueryStringArg(queryString,'width',160);
		var height = getQueryStringArg(queryString,'height',600);

		//Insert the iFrame After This Script Tag
		var ifrm = createiFrame(width, height);
		scriptTag.parentNode.insertBefore(ifrm, scriptTag.nextSibling);

		//Check to see if we are doing an iFrame with a source tag vs anon iFrame
		if(getQueryStringArg(queryString,'lijit_src','0') === '1'){
			var ap_domain = getQueryStringArg(queryString, 'lijit_ad_domain', 'ap.lijit.com');
			ifrm.src = 'http://'+ap_domain+"/adif.php"+getFPQueryString(queryString,true);
		} else {
			var ifr_content = ifrm.contentWindow.document||ifrm.contentDocument;
			ifr_content.write(htmlPrefix+ljtLocTag+fpTag+htmlSuffix);
		}
	}
	return {};
})();
LJT_placement_id = null;
LJT_AdsiFrame_Opts = null;
