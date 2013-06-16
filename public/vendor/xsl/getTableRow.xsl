<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:vo="http://www.ivoa.net/xml/VOTable/v1.1"
 xmlns:v1="http://vizier.u-strasbg.fr/VOTable"
 xmlns:v2="http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd"
 xmlns:v3="http://www.ivoa.net/xml/VOTable/v1.0"
 xmlns:v4="http://www.ivoa.net/xml/VOTable/v1.2"
 exclude-result-prefixes="vo v1 v2 v3 v4" version="1.0">
 
 	<xsl:param name="rowNumber">10</xsl:param>
 
 	<xsl:variable name="allRows" select="/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR"/>
	<xsl:variable name="allRows0" select="/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR"/>
	<xsl:variable name="allRows1" select="/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR"/>
	<xsl:variable name="allRows2" select="/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR"/>
	<xsl:variable name="allRows3" select="/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR"/>
	<xsl:variable name="allRows4" select="/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR"/>

	<xsl:variable name="filterRows" select="$allRows[position()=$rowNumber]"/>
	<xsl:variable name="filterRows0" select="$allRows0[position()=$rowNumber]"/>
	<xsl:variable name="filterRows1" select="$allRows1[position()=$rowNumber]"/>
	<xsl:variable name="filterRows2" select="$allRows2[position()=$rowNumber]"/>
	<xsl:variable name="filterRows3" select="$allRows3[position()=$rowNumber]"/>
	<xsl:variable name="filterRows4" select="$allRows4[position()=$rowNumber]"/>
         
    <xsl:variable name="fieldlist" select="/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD"/>
    
    <xsl:variable name="lc" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="uc" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
        
    <xsl:template name="getColumnByName">
        <xsl:param name="value"/>
        <xsl:variable name="tvalue" select="translate($value,$lc,$uc)"/>
        <xsl:for-each select="$fieldlist">
            <xsl:variable name="ID">
                <xsl:call-template name="getID"/>
            </xsl:variable>
            <xsl:if test="translate($ID,$lc,$uc) = $tvalue">
                <xsl:value-of select="position()"/>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
    <!-- ID is primary FIELD identifier (fall back to name if ID is not available) -->
    
    <xsl:template name="getID">
        <xsl:choose>
            <xsl:when test="@ID">
                <xsl:value-of select="@ID"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="@name"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA">
           	<xsl:for-each select="$filterRows|$filterRows0|$filterRows1|$filterRows2|$filterRows3|$filterRows4">
   	            <xsl:copy>
       	            <xsl:apply-templates select="@*|node()"/>
           	    </xsl:copy>
            </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="TR//@*|TR//node()|vo:TR//@*|vo:TR//node()|v1:TR//@*|v1:TR//node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
		</xsl:copy>
    </xsl:template>
    
    <xsl:template match="text()"/>
    
    <xsl:template name="start" match="/">
            <xsl:apply-templates/>
    </xsl:template>
</xsl:stylesheet>