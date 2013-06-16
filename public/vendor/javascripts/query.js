// This function converts simple column constraints
// into a filter that can be applied to a VOTABLE XML document
//
// T.McGlynn 9/12/2007

function xslt(indices, constraints, types) {

    var nsprefixes = ["", "vo:", "v1:", "v2:", "v3:"];
    var nssuffixes = ["", "0",   "1",   "2",   "3" ];

    var rowdef = new Array(nsprefixes.length);
    var table = new Array(nsprefixes.length);
    var tabledata = new Array(nsprefixes.length);
    var rowcount = new Array(nsprefixes.length);
    var filtercount = new Array(nsprefixes.length);
    var filterrows = new Array(nsprefixes.length);
    for (var i=0; i<nsprefixes.length; i += 1) {
        var prefix = nsprefixes[i];
        var suffix = nssuffixes[i];
        rowdef[i] = '<xsl:variable name="allRows' + suffix + '" select="/' +
            prefix + 'VOTABLE/' + prefix + 'RESOURCE/' + prefix + 'TABLE/' +
            prefix + 'DATA/' + prefix + 'TABLEDATA/' + prefix + 'TR" />';
        table[i] = prefix + 'TABLE';
        tabledata[i] = prefix + 'TABLEDATA';
        rowcount[i] = 'count($allRows' + suffix + ')';
        filtercount[i] = 'count($filterRows' + suffix + ')';
        filterrows[i] = '$filterRows' + suffix;
    }
    rowdef = rowdef.join('');
    table = table.join('|');
    tabledata = tabledata.join('|');
    rowcount = rowcount.join('+');
    filtercount = filtercount.join('+');
    filterrows = filterrows.join('|');

    var xsl1='<?xml version="1.0" encoding="UTF-8"?>' +
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"\n' +
            'xmlns:vo="http://www.ivoa.net/xml/VOTable/v1.1"\n' +
            'xmlns:v1="http://vizier.u-strasbg.fr/VOTable"\n' +
            'xmlns:v2="http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd"\n' +
            'xmlns:v3="http://www.ivoa.net/xml/VOTable/v1.0"\n' +
            'exclude-result-prefixes="vo v1 v2 v3" version="1.0">' +
            '<xsl:variable name="lc" select="\'abcdefghijklmnopqrstuvwxyz\'" />' +
            '<xsl:variable name="uc" select="\'ABCDEFGHIJKLMNOPQRSTUVWXYZ\'" />' +
            rowdef;

    var xsl2='<xsl:template match="' + table + '">' +
            '<PARAM datatype="int" name="VOV:TotalCount" value="{' + rowcount + '}" />' +
            '<PARAM datatype="int" name="VOV:FilterCount" value="{' + filtercount + '}" />' +
            '<xsl:copy>' +
            '<xsl:apply-templates />' +
            '</xsl:copy>' +
            '</xsl:template>' +
            '<xsl:template match="' + tabledata + '">' +
            '<xsl:copy>' +
            '<xsl:for-each select="' + filterrows + '">' +
            '<xsl:copy>' +
            '<xsl:apply-templates />' +
            '</xsl:copy>' +
            '</xsl:for-each>' +
            '</xsl:copy>' +
            '</xsl:template>' +
            '<xsl:template match="@*|node()">' +
            '<xsl:copy>' +
            '<xsl:apply-templates select="@*|node()"/>' +
            '</xsl:copy>' +
            '</xsl:template>' +
            '<xsl:template name="start" match="/">' +
            '<xsl:copy>' +
            '<xsl:apply-templates />' +
            '</xsl:copy>' +
            '</xsl:template>' +
            '</xsl:stylesheet>';

    function makeOneConstraint(prefix, suffix) {
        var all = [];
        for (var i=0; i<indices.length; i += 1) {
            var con = makeXSLConstraint(indices[i], constraints[i], types[i], prefix);
            if (con != null) {
                all.push([con.length, con]);
            }
        }
        if (all.length) {
            // sort to put shortest constraints (presumably fastest) first
            var sortfunc = function(a,b) {
                return a[0]-b[0];
            };
            all.sort(sortfunc);
            // get rid of the lengths
            for (i=0; i<all.length; i += 1) {
                all[i] = all[i][1];
            }
            var full = all.join(" and ");
            return '<xsl:variable name="filterRows' + suffix + '" select="$allRows' + suffix + '['+full+']" />';
        } else {
            return "";
        }
    }

    if (indices.length > 0) {
        // build separate constraint variables for each possible namespace prefix
        // this is repetitive, but time is negligible here (and long in XSLT)
        var xslgen = new Array(nsprefixes.length);
        for (i=0; i<nsprefixes.length; i += 1) {
            xslgen[i] = makeOneConstraint(nsprefixes[i], nssuffixes[i]);
        }
        xslgen = xslgen.join("");
        if (xslgen) {
            return xsl1+xslgen+xsl2;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// Convert a single constraint into appropriate XSLT filter elements.
function makeXSLConstraint(index, constraint, isChar, prefix) {
    if (constraint.length == 0) {
        return null;
    }
    if (constraint.substring(0,1) == '!') {
        var negate = true;
        constraint = constraint.substring(1);
    } else {
        negate = false;
    }
    if (constraint.substring(0,1) == '=') {
        constraint = constraint.substring(1);
    }
    if (constraint.length == 0) {
        return null;
    }
    if (isChar) {
        return charConstraint(index, constraint, negate, prefix);
    } else {
        return numConstraint(index, constraint, negate, prefix);
    }
}

// Handle a constraint on a character column
function charConstraint(index, constraint, negate, prefix) {
    constraint = constraint.toUpperCase();
    if (constraint.indexOf('*') >= 0 ) {
        return wildCardConstraint(index, constraint, negate, prefix);
    } else {
        return stdCharConstraint(index, constraint, negate, prefix);
    }
}
   
function wildCardConstraint(index, constraint, negate, prefix) {

    var fields = constraint.split("\*");
    var out = [];
    out.push("position() = "+index);

    var inner = "translate(normalize-space(),$lc,$uc)";
    if (fields[0]) {
        inner = "(" + inner + ",'" + fields[0] + "')";
        out.push("starts-with" + inner);
        inner = "substring-after" + inner;
    }
    for (var i=1; i<fields.length-1; i += 1) {
        if (fields[i]) {
            inner = "(" + inner + ",'" + fields[i] + "')";
            out.push("contains" + inner);
            inner = "substring-after" + inner;
        }
    }
    if (fields[fields.length-1]) {
        inner = "(concat(" + inner + ",'a'),'" + fields[fields.length-1] + "a')";
        out.push("contains" + inner);
    }

    if (out.length == 1) {
        // no constraints (this can happen with a value like "*" or "**")
        return null;
    } else {
        if (negate) {
            var p = out[0];
            out.splice(0,1);
            out = p + " and not(" + out.join(" and ") +")";
        } else {
            out = out.join(" and ");
        }
        return prefix+"TD[" + out + "]" ;
    }
}

function stdCharConstraint(index, constraint, negate, prefix) {
    constraint = trim(constraint);
    if (negate) {
        return "translate(normalize-space("+prefix+"TD["+index+"]), $lc, $uc)!='"+constraint+"'";
    } else {
        return "translate(normalize-space("+prefix+"TD["+index+"]), $lc, $uc)='"+constraint+"'";
    }
}


function rangeConstraint(index, constraint, negate, prefix) {

    var fields=constraint.split("\.\.", 2);
    if (fields[0].length == 0 || fields[1].length == 0) {
        return null;
    }
    if (negate) {
        var con =  prefix+"TD["+index+"] &lt;" +fields[0]+" or "+
                   prefix+"TD["+index+"] &gt;" +fields[1]+"";
    } else {
        con =  prefix+"TD["+index+"] &gt;=" +fields[0]+" and "+
               prefix+"TD["+index+"] &lt;=" +fields[1]+"";
    }
    return con;
}

function numConstraint(index, constraint, negate, prefix) {

    if (constraint.indexOf("..") > 0) {
        return rangeConstraint(index, constraint, negate, prefix);

    } else {
        if (negate) {
            if (constraint.substring(0,2) == ">=" ) {
                constraint = constraint.replace(">=", "&lt;");
            } else if (constraint.substring(0,2) == "<=" ) {
                constraint = constraint.replace("<=", "&gt;");
            } else if (constraint.substring(0,1) == ">" ) {
                constraint = constraint.replace(">", "&lt;=");
            } else if (constraint.substring(0,1) == "<" ) {
                constraint = constraint.replace("<", "&gt;=");
            } else if (constraint.substring(0,1) != "=") {
                constraint = "!=" + constraint;
            } else {
                constraint = "!" + constraint;
            }
        } else {
            if (constraint.substring(0,1) == ">" ) {
                constraint = constraint.replace(">", "&gt;");
            } else if (constraint.substring(0,1) == "<" ) {
                constraint = constraint.replace("<", "&lt;");
            } else if (constraint.substring(0,1) != "=") {
                constraint = "=" + constraint;
            } 
        }
        constraint = prefix + "TD["+index+"]"+constraint;
        return constraint;
    }
}
