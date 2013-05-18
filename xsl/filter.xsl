<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:vo="http://www.ivoa.net/xml/VOTable/v1.1"
 xmlns:v1="http://vizier.u-strasbg.fr/VOTable"
 xmlns:v2="http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd"
 xmlns:v3="http://www.ivoa.net/xml/VOTable/v1.0"
 xmlns:v4="http://www.ivoa.net/xml/VOTable/v1.2"
 exclude-result-prefixes="vo v1 v2 v3 v4" version="1.0">
 
 	<xsl:variable name="allRows" select="/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR"/>
	<xsl:variable name="allRows0" select="/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR"/>
	<xsl:variable name="allRows1" select="/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR"/>
	<xsl:variable name="allRows2" select="/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR"/>
	<xsl:variable name="allRows3" select="/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR"/>
	<xsl:variable name="allRows4" select="/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR"/>

	<xsl:variable name="filterRows" select="$allRows[__filterExp__]"/>
	<xsl:variable name="filterRows0" select="$allRows0[__filterExp__]"/>
	<xsl:variable name="filterRows1" select="$allRows1[__filterExp__]"/>
	<xsl:variable name="filterRows2" select="$allRows2[__filterExp__]"/>
	<xsl:variable name="filterRows3" select="$allRows3[__filterExp__]"/>
	<xsl:variable name="filterRows4" select="$allRows4[__filterExp__]"/>

	<!--
	<xsl:variable name="filterRows" select="$allRows"/>
	<xsl:variable name="filterRows0" select="$allRows0"/>
	<xsl:variable name="filterRows1" select="$allRows1"/>
	<xsl:variable name="filterRows2" select="$allRows2"/>
	<xsl:variable name="filterRows3" select="$allRows3"/>
	<xsl:variable name="filterRows4" select="$allRows4"/>
	--> 

	<!--
	<xsl:variable name="filterRows" select="$allRows[TD[7]/@val&gt;0]"/>
	<xsl:variable name="filterRows0" select="$allRows0[vo:TD[7]/@val&gt;0]"/>
	<xsl:variable name="filterRows1" select="$allRows1[v1:TD[7]/@val&gt;0]"/>
	<xsl:variable name="filterRows2" select="$allRows2[v2:TD[7]/@val&gt;0]"/>
	<xsl:variable name="filterRows3" select="$allRows3[v3:TD[7]/@val&gt;0]"/>
	<xsl:variable name="filterRows4" select="$allRows4[v4:TD[7]/@val&gt;0]"/>
	--> 
	
   	<xsl:variable name="nrows" select="count($allRows)+count($allRows0)+count($allRows1)+count($allRows2)+count($allRows3)+count($allRows4)"/>
     
    <xsl:param name="sortOrder">ascending</xsl:param>
    <xsl:param name="sortColumn">1</xsl:param>
    <xsl:param name="pageStart">1</xsl:param>
	<xsl:param name="pageEnd" select="$nrows"/>
    <xsl:param name="selectAllCriteria"></xsl:param>
    
    <xsl:variable name="fieldlist" select="/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD"/>
    <xsl:variable name="paramlist" select="/VOTABLE/RESOURCE/PARAM|/vo:VOTABLE/vo:RESOURCE/vo:PARAM|/v1:VOTABLE/v1:RESOURCE/v1:PARAM|/v2:VOTABLE/v2:RESOURCE/v2:PARAM|/v3:VOTABLE/v3:RESOURCE/v3:PARAM|/v4:VOTABLE/v4:RESOURCE/v4:PARAM"/>
    
    <xsl:variable name="lc" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="uc" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    
    <xsl:variable name="sortColumnNum">
        <xsl:if test="$sortColumn != ''">
        	<xsl:choose>
        	<xsl:when test="string(number($sortColumn))='NaN'">
            	<xsl:call-template name="getColumnByName">
                	<xsl:with-param name="value" select="$sortColumn"/>
            	</xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
				<xsl:value-of select="number($sortColumn)"/>
            </xsl:otherwise>
            </xsl:choose>
        </xsl:if>

    </xsl:variable>
    
    <xsl:variable name="datatype">
        <xsl:choose>
            <xsl:when test="$sortColumnNum=''">text</xsl:when>
            <xsl:otherwise>
                <xsl:for-each select="$fieldlist[position()=$sortColumnNum]">
                    <xsl:choose>
                        <xsl:when test="not(@arraysize) and (@datatype='float' or @datatype='double' or @datatype='int' or @datatype='long' or @datatype='short' or @datatype='unsignedByte' or @datatype='bit')">number</xsl:when>
                        <xsl:otherwise>text</xsl:otherwise>
                    </xsl:choose>
                </xsl:for-each>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    
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
    
    <xsl:template name="selectAllList">
		<xsl:call-template name="selectAllTemplate">
			<xsl:with-param name="rowList" select="/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR"/>
			<xsl:with-param name="delimiter"></xsl:with-param>
		</xsl:call-template>
    </xsl:template>
    
    <xsl:template name="selectAllTemplate">
    	<xsl:param name="rowList"/>
    	<xsl:param name="delimiter"/>
    	<xsl:choose>
    		<xsl:when test="$selectAllCriteria=''">
           		<xsl:value-of select="$delimiter"/><xsl:value-of select="$rowList[position()=1]/@vovid"/>    			
    		</xsl:when>
        	<xsl:when test="contains($rowList[position()=1], $selectAllCriteria) and $rowList[position()=1]/@vovid">
           		<xsl:value-of select="$delimiter"/><xsl:value-of select="$rowList[position()=1]/@vovid"/>
			</xsl:when>
		</xsl:choose>
		<xsl:if test="count($rowList) &gt; 0">
			<xsl:call-template name="selectAllTemplate">
				<xsl:with-param name="rowList" select="$rowList[position()!=1]"/>
				<xsl:with-param name="delimiter">,</xsl:with-param>
			</xsl:call-template>
		</xsl:if>
    </xsl:template>

    <xsl:template match="TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE">
    	<xsl:variable name="inputSpace">
    		<xsl:value-of select="namespace-uri()"/>
    	</xsl:variable>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:TotalCount</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:value-of select="$nrows"/>
        	</xsl:attribute>
	    </xsl:element>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:FilterCount</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:value-of select="count($filterRows)+count($filterRows0)+count($filterRows1)+count($filterRows2)+count($filterRows3)+count($filterRows4)"/>
        	</xsl:attribute>
	    </xsl:element>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:SelectAllRows</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:call-template name="selectAllList"/>
			</xsl:attribute>			
	    </xsl:element>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:PageStart</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:value-of select="$pageStart"/>
        	</xsl:attribute>
	    </xsl:element>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:PageEnd</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:value-of select="$pageEnd"/>
        	</xsl:attribute>
	    </xsl:element>
        <xsl:element name="PARAM" namespace="{$inputSpace}">
        	<xsl:attribute name="datatype">int</xsl:attribute>
        	<xsl:attribute name="ID">VOV:SortColumnsList</xsl:attribute>
			<xsl:attribute name="value">
				<xsl:choose>
					<xsl:when test="$sortOrder = 'ascending'">+</xsl:when>
					<xsl:when test="$sortOrder = 'descending'">-</xsl:when>
				</xsl:choose>
				<xsl:value-of select="$sortColumn"/>
			</xsl:attribute>
	    </xsl:element>
        <xsl:copy>
            <xsl:apply-templates/>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA">
        <xsl:copy>
            	<xsl:for-each select="$filterRows|$filterRows0|$filterRows1|$filterRows2|$filterRows3|$filterRows4">
                	<xsl:sort select="TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
	                <xsl:sort select="TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
    	            <xsl:sort select="vo:TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
        	        <xsl:sort select="vo:TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
            	    <xsl:sort select="v1:TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
                	<xsl:sort select="v1:TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
	                <xsl:sort select="v2:TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
    	            <xsl:sort select="v2:TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
        	        <xsl:sort select="v3:TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
            	    <xsl:sort select="v3:TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
                	<xsl:sort select="v4:TD[position()=$sortColumnNum]/@val" order="{$sortOrder}" data-type="{$datatype}"/>
	                <xsl:sort select="v4:TD[position()=$sortColumnNum]" order="{$sortOrder}" data-type="{$datatype}"/>
    	            <xsl:if test="not (position() &lt; $pageStart or position() &gt; $pageEnd)">
        	            <xsl:copy>
            	            <xsl:apply-templates select="@*|node()"/>
                	    </xsl:copy>
	                </xsl:if>
	            </xsl:for-each>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template name="start" match="/">
        <xsl:copy>
            <xsl:apply-templates/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>