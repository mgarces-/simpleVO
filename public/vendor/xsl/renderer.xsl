<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:vo="http://www.ivoa.net/xml/VOTable/v1.1"
 xmlns:v1="http://vizier.u-strasbg.fr/VOTable"
 xmlns:v2="http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd"
 xmlns:v3="http://www.ivoa.net/xml/VOTable/v1.0"
 xmlns:v4="http://www.ivoa.net/xml/VOTable/v1.2"
 exclude-result-prefixes="vo v1 v2 v3 v4">
    
    <!--<xsl:output method="html" doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN"
      doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"/>-->
	<xsl:output method="xml"/>
    
    <!-- Sort VOTable by column sortOrder and write a page of rows in of HTML -->
    
    <!-- Input parameters -->
    
    <xsl:param name="selectedRows"></xsl:param>
    <xsl:param name="selectRowUCD">ID_MAIN</xsl:param>
    <xsl:param name="maxColumns">11</xsl:param>
    <xsl:param name="columnOrder"></xsl:param>    
    <xsl:param name="decPrecision">10</xsl:param>
    <xsl:param name="raPrecision">100</xsl:param>
    <xsl:param name="sexSeparator">:</xsl:param>
    <xsl:param name="widgetIDprefix">voview</xsl:param>
    
    <xsl:param name="renderPrefixColumn">0</xsl:param>
    
    <xsl:param name="selectAllLabel">Select All</xsl:param>
    
    <!-- Filter parameters -->
    <xsl:param name="filterText"></xsl:param>
    <xsl:param name="filterForm">filterForm</xsl:param>
    <xsl:param name="filterCallback">filterByColumn</xsl:param>
    <xsl:param name="filterResetCallback">resetFilter</xsl:param>
    <xsl:param name="filterRow">filterRow</xsl:param>
    
    <xsl:param name="titleText"/>
    
    <!-- Javascript callback functions (also settable as parameters) -->
    
    <xsl:param name="sortCallback">sortTable</xsl:param>
    <xsl:param name="pageCallback">newPage</xsl:param>
    <xsl:param name="setMaxColumnsCallback">setMaxColumns</xsl:param>
    <xsl:param name="resetColumnOrderCallback">resetColumnOrder</xsl:param>
    <xsl:param name="setPageLength">setPageLength</xsl:param>
    <xsl:param name="selectRowCallback">selectRow</xsl:param>
    <xsl:param name="selectAllRowsCallback">selectAllRows</xsl:param>
    <xsl:param name="clearSelectionCallback">clearRowSelection</xsl:param>
    <xsl:param name="clickClearCallback">clickClear</xsl:param>
    <xsl:param name="clickResetCallback">clickReset</xsl:param>
    
    <xsl:variable name="lc" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="uc" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    
    <!-- Computed variables -->
    
    <xsl:variable name="fieldlist" select="//VOTABLE/RESOURCE/TABLE/FIELD|//vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|//v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|//v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|//v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|//v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD"/>
    
    <xsl:variable name="paramlist" select="//VOTABLE/RESOURCE/PARAM|//vo:VOTABLE/vo:RESOURCE/vo:PARAM|//v1:VOTABLE/v1:RESOURCE/v1:PARAM|//v2:VOTABLE/v2:RESOURCE/v2:PARAM|//v3:VOTABLE/v3:RESOURCE/v3:PARAM|//v4:VOTABLE/v4:RESOURCE/v4:PARAM"/>
<!--    <xsl:variable name="paramlist" select="//PARAM|//vo:PARAM|//v1:PARAM|//v2:PARAM|//v3:PARAM|//v4:PARAM"/>-->
    
    <xsl:variable name="useDescription" select="name($fieldlist/*)='DESCRIPTION'"/>
    <xsl:variable name="totalCount" select="$paramlist[@ID='VOV:TotalCount']/@value"/>
    <xsl:variable name="filterCount" select="$paramlist[@ID='VOV:FilterCount']/@value"/>
    <xsl:variable name="pageStart" select="$paramlist[@ID='VOV:PageStart']/@value"/>
    <xsl:variable name="pageEnd" select="$paramlist[@ID='VOV:PageEnd']/@value"/>
    <xsl:variable name="selectAllList" select="$paramlist[@ID='VOV:SelectAllRows']/@value"/>
    <xsl:variable name="sortColumnsList" select="$paramlist[@ID='VOV:SortColumnsList']/@value"/>
    
    <xsl:variable name="sortOrder">
    	<xsl:choose>
    		<xsl:when test="substring($sortColumnsList,1,1) = '+'">
    			ascending
    		</xsl:when>
    		<xsl:when test="substring($sortColumnsList,1,1) = '-'">
    			descending
    		</xsl:when>
    	</xsl:choose>
    </xsl:variable>
    
    <xsl:variable name="sortColumn" select="substring($sortColumnsList,2)"/>

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
    
    <xsl:variable name="sortName">
        <xsl:choose>		
        	<xsl:when test="string(number($sortColumn))='NaN'">
    			<xsl:value-of select="$sortColumn"/>
    		</xsl:when>
    		<xsl:otherwise>
    			<xsl:value-of select="$fieldlist[$sortColumn]/@name"/>
    		</xsl:otherwise>
    	</xsl:choose>
    </xsl:variable>


    <xsl:variable name="raColumnNum">
        <xsl:call-template name="getColumnByUCDs">
            <xsl:with-param name="value" select="'|pos.eq.ra;meta.main|POS_EQ_RA_MAIN|'"/>
            <xsl:with-param name="datatype" select="'|float|double|'"/>
        </xsl:call-template>
    </xsl:variable>
    
    <xsl:variable name="decColumnNum">
        <xsl:call-template name="getColumnByUCDs">
            <xsl:with-param name="value" select="'|pos.eq.dec;meta.main|POS_EQ_DEC_MAIN|'"/>
            <xsl:with-param name="datatype" select="'|float|double|'"/>
        </xsl:call-template>
    </xsl:variable>
    
    <xsl:variable name="urlColumnNum">
        <xsl:call-template name="getColumnByUCD">
            <xsl:with-param name="value" select="'VOX:Image_AccessReference'"/>
        </xsl:call-template>
    </xsl:variable>
    
    <xsl:variable name="formatColumnNum">
        <xsl:call-template name="getColumnByUCD">
            <xsl:with-param name="value" select="'VOX:Image_Format'"/>
        </xsl:call-template>
    </xsl:variable>
    
    <xsl:variable name="selectColumnNum">
        <xsl:call-template name="getColumnByUCD">
            <xsl:with-param name="value" select="$selectRowUCD"/>
        </xsl:call-template>
    </xsl:variable>
    
    <xsl:template name="getColumnByUCD">
        <!-- THIS ASSUMED THAT THE COLUMN EXISTS! -->
        <!-- WHEN IT DOESN'T, SAFARI IS UNHAPPY! -->
        <xsl:param name="value"/>
        <xsl:variable name='temp_column'>
            <xsl:for-each select="$fieldlist">
                <xsl:if test="@ucd = $value">
                    <xsl:value-of select="position()"/>
                </xsl:if>
            </xsl:for-each>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="$temp_column != ''">
                <xsl:value-of select="$temp_column"/>
            </xsl:when>
            <xsl:otherwise>-1</xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="getColumnByUCDs">
        <xsl:param name="value"/>
        <xsl:param name="datatype"/>
        <xsl:for-each select="$fieldlist">
            <xsl:if test="contains($value, concat('|',@ucd,'|')) and
            (not($datatype) or contains($datatype,concat('|',@datatype,'|')))">
                <xsl:value-of select="position()"/>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
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
    
    <!-- name is primary FIELD label (fall back to ID if name is not available) -->
    
    <xsl:template name="getName">
        <xsl:choose>
            <xsl:when test="@name">
                <xsl:value-of select="@name"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="@ID"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:variable name="nrows" select="count(/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR)"/>
    
    <xsl:variable name="ncols" select="count($fieldlist)"/>
    
    <xsl:variable name="pageLength">
    	<xsl:value-of select="number($pageEnd)-number($pageStart)+1"/>
    </xsl:variable>
    
    <xsl:variable name="page">
    	<xsl:value-of select="ceiling(number($pageStart) div number($pageLength))"/>
    </xsl:variable>
    
    <xsl:variable name="npages" select="ceiling($filterCount div $pageLength)"/>

    <!-- process the VOTable -->
    
    <xsl:template name="start" match="/">
        <xsl:variable name="votable" select="VOTABLE|vo:VOTABLE|v1:VOTABLE|v2:VOTABLE|v3:VOTABLE|v4:VOTABLE"/>
        <xsl:for-each select="$votable">
            <xsl:call-template name="votable"/>
        </xsl:for-each>
        <xsl:if test="count($votable)=0">
            <xsl:call-template name="error"/>
        </xsl:if>
    </xsl:template>
    
    <!-- error template is called when root VOTABLE node is not found -->
    
	<xsl:template name="error">
   		<xsl:variable name="root" select="name(*)"/>
   		<xsl:variable name="ns1" select="namespace-uri(*)"/>
   		<xsl:variable name="ns">
      		<xsl:if test="$ns1"> {<xsl:value-of select="$ns1"/>} </xsl:if>
   		</xsl:variable>
   		<h2>Error: Input is not a standard VOTable</h2>
   		<p>Root node is <i> <xsl:value-of select="$ns"/> </i> <b> <xsl:value-of select="$root"/> </b></p>
   		<p>Should be <b> VOTABLE </b> or <i> {http://www.ivoa.net/xml/VOTable/v1.1} </i> <b> VOTABLE </b></p>
	</xsl:template>
    
    <xsl:template name="votable">
        <xsl:for-each select="INFO|vo:INFO|v1:INFO|v2:INFO|v3:INFO|v4:INFO">
            <xsl:call-template name="info"/>
        </xsl:for-each>
        <xsl:for-each select="RESOURCE|vo:RESOURCE|v1:RESOURCE|v2:RESOURCE|v3:RESOURCE|v4:RESOURCE">
            <xsl:call-template name="resource"/>
        </xsl:for-each>
    </xsl:template>
    
    <!-- Handle VOTable error return -->
    
    <xsl:template name="info">
        <xsl:if test="@name='QUERY_STATUS' and @value='ERROR'">
            <pre>
                <h2>
                    <xsl:value-of select="."/>
                </h2>
            </pre>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="resource">
    	<!-- Begin dummy header 
		<html>
		<head>
			<title>VOTable Viewer</title>
			<link rel="stylesheet" type="text/css" href="voview.css"></link>
		</head>
		<body>
    	 End dummy header -->
    	<div>
		<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/></xsl:attribute>
		<!-- Because "all" contains all the other widgets, it needs to be last in the list -->
		<form name="widgets" action="">
			<input type="hidden" name="widget_names">
				<xsl:attribute name="value">title,table,columnArranging,parameters,paging.top,paging.bottom,filterButtons,all</xsl:attribute>
			</input>
		</form>
		<!-- Leave off the "all" suffix for the widget id containing the whole table -->
		<h1 align="center">    	 
   			<span>
				<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.title</xsl:attribute>
   				<xsl:value-of select="$titleText"/>
   			</span>
   		</h1>
		<xsl:for-each select="TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE">
			<!-- 
			 This is where the templates for the different sub-widgets are called
			 -->
     		<xsl:call-template name="buttons">
				<xsl:with-param name="location" select="'top'"/>
			</xsl:call-template>
            <xsl:call-template name="dataNotes"/>
         	<xsl:call-template name="dataTable"/>
            <xsl:call-template name="buttons">
            	<xsl:with-param name="location" select="'bottom'"/>
            </xsl:call-template>
		</xsl:for-each>
        <xsl:call-template name="fieldsparams"/>
        </div>  
    	<!-- Begin dummy footer 
		</body>
		</html>
    	 End dummy footer -->
    </xsl:template>

	<xsl:template name="dataTable">
		<!-- wrap entire table in a form for filtering -->
		<div>
		<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.table</xsl:attribute>
		<form method="get" name="{$filterForm}"
			onsubmit="return {$filterCallback}(this);" onreset="return {$filterResetCallback}(this);"
			action="">
			
			<div style="display:none">
				<!-- hide the submit & reset buttons (where should they go?) -->
				<input type="submit" class="submit" name=".submit" value="Filter"
					title="Enter values for one or more columns in boxes" />
				<input type="reset" class="reset" name=".reset" value="Clear"
					title="Clear column filter values" />
			</div>
			<table class="data draggable">
				<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.data</xsl:attribute>
				<xsl:call-template name="columnSetting" />
				<thead>
					<xsl:call-template name="header">
						<xsl:with-param name="location" select="'top'" />
					</xsl:call-template>
				</thead>
				<!-- header repeats at bottom of table.
				 HTML standard says tfoot must come before tbody -->
				<tfoot>
					<xsl:call-template name="header">
						<xsl:with-param name="location" select="'bottom'" />
					</xsl:call-template>
				</tfoot>
				<tbody>
					<xsl:choose>
						<xsl:when test="$nrows=0">
							<tr>
								<td colspan="{$maxColumns}">
									<xsl:choose>
										<xsl:when test="$filterCount">
											<h2>No results remain after filtering</h2>
										</xsl:when>
										<xsl:otherwise>
											<h2>No results found</h2>
										</xsl:otherwise>
									</xsl:choose>
								</td>
							</tr>
						</xsl:when>
						<xsl:otherwise>
							<xsl:apply-templates
								select="DATA/TABLEDATA|vo:DATA/vo:TABLEDATA|v1:DATA/v1:TABLEDATA|v2:DATA/v2:TABLEDATA|v3:DATA/v3:TABLEDATA|v4:DATA/v4:TABLEDATA" />
						</xsl:otherwise>
					</xsl:choose>
				</tbody>
			</table>
		</form>
		</div>
	</xsl:template>
    
    <!--
    Code gets replicated here for efficiency in selecting different namespaces.
    I've abstracted what I can.  Is there a better way to code this?
    -->
    
    <xsl:template match="DATA/TABLEDATA">
        <xsl:for-each select="TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="vo:DATA/vo:TABLEDATA">
        <xsl:for-each select="vo:TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="vo:TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="v1:DATA/v1:TABLEDATA">
        <xsl:for-each select="v1:TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="v1:TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="v2:DATA/v2:TABLEDATA">
        <xsl:for-each select="v2:TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="v2:TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="v3:DATA/v3:TABLEDATA">
        <xsl:for-each select="v3:TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="v3:TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="v4:DATA/v4:TABLEDATA">
        <xsl:for-each select="v4:TR">
                <xsl:call-template name="processIncludedRow">
                    <xsl:with-param name="rowNum" select="position()"/>
                    <xsl:with-param name="TDlist" select="v4:TD"/>
                    <xsl:with-param name="selector" select="@vovid"/>
                </xsl:call-template>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template name="processIncludedRow">
        <xsl:param name="rowNum"/>
        <xsl:param name="TDlist"/>
        <xsl:param name="selector"/>
        <!--  xsl:variable name="selector" select="string($TDlist[position()=$selectColumnNum])"/ -->
        <tr id="vov_{$selector}" onclick="{$selectRowCallback}(this,'{$selector}',event)">
            <xsl:attribute name="class">
                <xsl:call-template name="isSelected">
                    <xsl:with-param name="selector" select="$selector"/>
                </xsl:call-template>
                <xsl:choose>
                    <xsl:when test="($rowNum mod 2) = 0">even</xsl:when>
                    <xsl:otherwise>odd</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:variable name="isSelected">
                <xsl:call-template name="isSelected">
                    <xsl:with-param name="selector" select="$selector"/>
                </xsl:call-template>
            </xsl:variable>
            <xsl:call-template name="processRow">
                <xsl:with-param name="TDlist" select="$TDlist"/>
                <xsl:with-param name="format" select="(TD|vo:TD|v1:TD|v2:TD|v3:TD|v4:TD)[position()=$formatColumnNum]"/>
                <xsl:with-param name="selector" select="$selector"/>
            </xsl:call-template>
        </tr>
    </xsl:template>
    
    <!-- create tables describing FIELDs and PARAMs -->
    
    <xsl:template name="fieldsparams">
        <xsl:for-each select="TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE">
            <table>
                <tbody>
                    <tr valign="top">
                        <td>
                            <xsl:call-template name="fieldstable"/>
                        </td>
                        <td>
                            <xsl:call-template name="paramstable"/>
                        </td>
                    </tr>
                </tbody>
            </table>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template name="fieldstable">
    	<div class="fieldparam">
    	<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.columnArranging</xsl:attribute>
        <h2>
            Columns
        </h2>
        <span class="bbox rightbutton" onclick="{$resetColumnOrderCallback}();" title="Restore original column order">Reset&#160;column&#160;order</span>
        <table class="fields" id="voview_column_fields">
            <col/>
            <col/>
            <col/>
            <xsl:if test="$useDescription">
                <col width="400"/>
            </xsl:if>
            <thead><tr>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Datatype</th>
                    <xsl:if test="$useDescription">
                        <th>Description</th>
                    </xsl:if>
                </tr></thead>
            <tbody>
                <xsl:call-template name="fieldIter">
                     <xsl:with-param name="count" select="1"/>
                     <xsl:with-param name="colnums" select="concat($columnOrder,',')"/>
                </xsl:call-template>
            </tbody>
        </table>
        </div>
    </xsl:template>
    
    <xsl:template name="paramstable">
        <xsl:if test="count($paramlist) &gt; 0">
        	<div class="fieldparam">
	    	<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.parameters</xsl:attribute>

            <h2>Table Parameters</h2>
            <table class="parameters">
                <thead><tr>
                        <th>Name</th>
                        <th>Value</th>
                        <th>Unit</th>
                    </tr></thead>
                <tbody>
                    <xsl:for-each select="$paramlist[not(starts-with(@ID,'VOV:'))]">
                        <tr>
                            <td>
                                <xsl:call-template name="getName"/>
                            </td>
                            <td>
                                <xsl:value-of select="@value"/>
                            </td>
                            <td>
                                <xsl:value-of select="@unit"/>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
            </div>
        </xsl:if>
    </xsl:template>
    
    <!-- recursive template to loop over fields in columnOrder -->
    
    <xsl:template name="fieldIter">
        <xsl:param name="count"/>
        <xsl:param name="colnums"/>
        <xsl:if test="$colnums">
            <xsl:variable name="posit" select="number(substring-before($colnums,','))"/>
            <xsl:for-each select="$fieldlist[position()=$posit]">
                <xsl:call-template name="fieldrow">
                    <xsl:with-param name="row" select="$count"/>
                    <xsl:with-param name="posit" select="$posit"/>
                </xsl:call-template>
            </xsl:for-each>
            <xsl:call-template name="fieldIter">
                <xsl:with-param name="count" select="1+$count"/>
                <xsl:with-param name="colnums" select="substring-after($colnums,',')"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="fieldrow">
        <xsl:param name="row"/>
        <xsl:param name="posit"/>
        <tr id="fieldrow_{$posit}">
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="($row mod 2) = 0">even</xsl:when>
                    <xsl:otherwise>odd</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <td>
                <xsl:call-template name="getName"/>
            </td>
            <td>
                <xsl:value-of select="@unit"/>
            </td>
            <td>
                <xsl:value-of select="@datatype"/>
                <xsl:if test="@arraysize">
                    <xsl:value-of select="concat('[',@arraysize,']')"/>
                </xsl:if>
            </td>
            <xsl:if test="$useDescription">
                <td>
                    <xsl:value-of select="DESCRIPTION|vo:DESCRIPTION|v1:DESCRIPTION|v2:DESCRIPTION|v3:DESCRIPTION|v4:DESCRIPTION"/>
                </td>
            </xsl:if>
        </tr>
        <!--
        <td><xsl:value-of select="$row"/>:<xsl:value-of select="$ncols"/>:<xsl:value-of select="$maxColumns"/></td>
        "Hidden" bar did not show initially when $ncols < $maxColumns ...
        <xsl:if test="$row=$maxColumns">
        -->
        <xsl:if test="$row=$maxColumns or ( $row=$ncols and $maxColumns &gt; $ncols )">
            <tr class="separator">
                <td colspan="5" align="center">Columns below are hidden - Drag to change</td>
            </tr>
        </xsl:if>
    </xsl:template>
    
    <!-- all the page buttons -->
    
    <xsl:template name="buttons">
        <xsl:param name="location"/>
        <div class="buttons {$location}">
           	<xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.paging.<xsl:value-of select="$location"/></xsl:attribute>
            <div class="pagelabel">
            	<xsl:variable name="realEnd">
            		<xsl:choose>
            			<xsl:when test="$pageEnd &lt; $filterCount">
            				<xsl:value-of select="$pageEnd"/>
            			</xsl:when>
            			<xsl:otherwise>
            				<xsl:value-of select="$filterCount"/>
            			</xsl:otherwise>
            		</xsl:choose>
            	</xsl:variable>
            	<xsl:choose>
            		<xsl:when test="$realEnd != 0">
		                Results <b><xsl:value-of select="$pageStart"/>-<xsl:value-of select="$realEnd"/></b>
		                <xsl:if test="$npages != 1 or $filterCount"> of <b><xsl:value-of select="$filterCount"/></b></xsl:if>
            		</xsl:when>
            		<xsl:otherwise>
            			Zero results
            		</xsl:otherwise>
            	</xsl:choose>
                <xsl:if test="$totalCount">
                    (<b><xsl:value-of select="$totalCount"/></b> before filtering)
                </xsl:if>
                <xsl:if test="$sortColumnNum != ''">sorted by <b><xsl:value-of select="$sortName"/></b>
                </xsl:if>
            </div>
            <xsl:if test="$npages != 1">
                <div class="pagebuttons">
                    <xsl:call-template name="onePage">
                        <xsl:with-param name="value" select="number($page)-1"/>
                        <xsl:with-param name="label" select="'Previous'"/>
                        <xsl:with-param name="class" select="'rev'"/>
                    </xsl:call-template>
                    <xsl:choose>
                        <xsl:when test="$npages &lt; 12">
                            <xsl:call-template name="pageRun">
                                <xsl:with-param name="start" select="1"/>
                                <xsl:with-param name="end" select="$npages"/>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:when test="number($page) &lt; 7">
                            <xsl:call-template name="pageRun">
                                <xsl:with-param name="start" select="1"/>
                                <xsl:with-param name="end" select="9"/>
                            </xsl:call-template>
                            &#8230;
                            <xsl:call-template name="onePage">
                                <xsl:with-param name="value" select="$npages"/>
		                        <xsl:with-param name="label" select="''"/>
		                        <xsl:with-param name="class" select="''"/>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:when test="number($page)+6 &gt; $npages">
                            <xsl:call-template name="onePage">
                                <xsl:with-param name="value" select="1"/>
		                        <xsl:with-param name="label" select="''"/>
		                        <xsl:with-param name="class" select="''"/>
                            </xsl:call-template>
                            &#8230;
                            <xsl:call-template name="pageRun">
                                <xsl:with-param name="start" select="number($npages)-8"/>
                                <xsl:with-param name="end" select="$npages"/>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:call-template name="onePage">
                                <xsl:with-param name="value" select="1"/>
		                        <xsl:with-param name="label" select="''"/>
		                        <xsl:with-param name="class" select="''"/>
                            </xsl:call-template>
                            &#8230;
                            <xsl:call-template name="pageRun">
                                <xsl:with-param name="start" select="number($page)-3"/>
                                <xsl:with-param name="end" select="number($page)+3"/>
                            </xsl:call-template>
                            &#8230;
                            <xsl:call-template name="onePage">
                                <xsl:with-param name="value" select="$npages"/>
		                        <xsl:with-param name="label" select="''"/>
		                        <xsl:with-param name="class" select="''"/>
                            </xsl:call-template>
                        </xsl:otherwise>
                    </xsl:choose>
                    <xsl:call-template name="onePage">
                        <xsl:with-param name="value" select="number($page)+1"/>
                        <xsl:with-param name="label" select="'Next'"/>
                        <xsl:with-param name="class" select="'fwd'"/>
                    </xsl:call-template>
                </div>
            </xsl:if>
            <xsl:call-template name="pageLengthControl">
                <xsl:with-param name="location" select="$location"/>
            </xsl:call-template>
        </div>
    </xsl:template>
    
    <xsl:template name="onePage">
        <xsl:param name="value"/>
        <xsl:param name="label"/>
        <xsl:param name="class"/>
        <xsl:variable name="plabel">
            <xsl:choose>
                <xsl:when test="$label=''"><xsl:value-of select="$value"/></xsl:when>
                <xsl:otherwise><xsl:value-of select="$label"/></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:text>
        </xsl:text>
        <xsl:choose>
            <xsl:when test="$value &lt; 1 or $value &gt; $npages">
                <span class="button {$class} inactive"><xsl:value-of select="$plabel"/></span>
            </xsl:when>
            <xsl:when test="$page=$value">
                <b><xsl:value-of select="$plabel"/></b>
            </xsl:when>
            <xsl:otherwise>
            	<a href="#" onclick="return {$pageCallback}({$value})">
                    <span class="button {$class}"><xsl:value-of select="$plabel"/></span>
            	</a>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="pageRun">
        <xsl:param name="start"/>
        <xsl:param name="end"/>
        <xsl:call-template name="onePage">
            <xsl:with-param name="value" select="$start"/>
            <xsl:with-param name="label" select="''"/>
            <xsl:with-param name="class" select="''"/>
        </xsl:call-template>
        <xsl:if test="$start &lt; $end">
            <xsl:call-template name="pageRun">
                <xsl:with-param name="start" select="number($start)+1"/>
                <xsl:with-param name="end" select="$end"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="pageLengthControl">
        <xsl:param name="location"/>
        <div class="pageLengthControl">
            Show
            <select name="pagesize-{$location}" onchange="{$setPageLength}(this.value)">
                <option value="10">
                    <xsl:if test="number($pageLength)=10">
                        <xsl:attribute name="selected">selected</xsl:attribute>
                    </xsl:if>
                    10
                </option>
                <option value="20">
                    <xsl:if test="number($pageLength)=20">
                        <xsl:attribute name="selected">selected</xsl:attribute>
                    </xsl:if>
                    20
                </option>
                <option value="50">
                    <xsl:if test="number($pageLength)=50">
                        <xsl:attribute name="selected">selected</xsl:attribute>
                    </xsl:if>
                    50
                </option>
                <option value="100">
                    <xsl:if test="number($pageLength)=100">
                        <xsl:attribute name="selected">selected</xsl:attribute>
                    </xsl:if>
                    100
                </option>
            </select>
            results per page
        </div>
    </xsl:template>
    
    <xsl:template name="dataNotes">
		<div class="searchnote">
		   <xsl:attribute name="id"><xsl:value-of select="$widgetIDprefix"/>.filterButtons</xsl:attribute>
		   <xsl:if test="$renderPrefixColumn = 1">
           		Click column heading to sort list - Click rows to select
           		<span class="bbox" onclick="{$clearSelectionCallback}();">Reset&#160;selection</span>
           		<br />
           </xsl:if>
           Text boxes under columns select matching rows
           <span class="bbox" onclick="return {$filterCallback}(document.{$filterForm});">Apply Filter</span>
           <span class="bbox" onclick="return {$filterResetCallback}(document.{$filterForm});">Clear Filter</span>
           <br />
         </div>
    </xsl:template>
    
    
    <!-- template setting column properties can be overridden by importing stylesheet -->
    
    <xsl:template name="columnSetting"/>
    
    <!-- column headers come from VOTable FIELDS -->
    
    <xsl:template name="header">
        <xsl:param name="location"/>
        <tr>
            <xsl:call-template name="prefix-header">
                <xsl:with-param name="location" select="$location"/>
            </xsl:call-template>
            <xsl:call-template name="headerIter">
                <xsl:with-param name="count" select="1"/>
                <xsl:with-param name="colnums" select="concat($columnOrder,',')"/>
                <xsl:with-param name="location" select="$location"/>
            </xsl:call-template>
            <xsl:if test="$ncols &gt; 1 and $maxColumns &gt; 1">
                <th onclick="{$setMaxColumnsCallback}({$maxColumns - 1})" title="Click to show fewer columns">&#171;</th>
            </xsl:if>
            <xsl:if test="$ncols &gt; $maxColumns">
                <th onclick="{$setMaxColumnsCallback}({$maxColumns + 1})" title="Click to show more columns">&#187;</th>
            </xsl:if>
        </tr>
        <xsl:if test="$location='top'">
            <tr id="{$filterRow}">
                <xsl:call-template name="prefix-filter">
                    <xsl:with-param name="location" select="$location"/>
                </xsl:call-template>
                <xsl:call-template name="filterIter">
                    <xsl:with-param name="count" select="1"/>
                    <xsl:with-param name="colnums" select="concat($columnOrder,',')"/>
                </xsl:call-template>
                <td></td>
                <td></td>
            </tr>
        </xsl:if>
    </xsl:template>
    
    <!-- recursive template to loop over fields in columnOrder -->
    
    <xsl:template name="headerIter">
        <xsl:param name="count"/>
        <xsl:param name="colnums"/>
        <xsl:param name="location"/>
        <xsl:if test="$colnums and $count &lt;= $maxColumns">
            <xsl:variable name="posit" select="number(substring-before($colnums,','))"/>
            <xsl:for-each select="$fieldlist[position()=$posit]">
                <xsl:call-template name="columnheader">
                    <xsl:with-param name="posit" select="$posit"/>
                    <xsl:with-param name="location" select="$location"/>
                </xsl:call-template>
            </xsl:for-each>
            <xsl:call-template name="headerIter">
                <xsl:with-param name="count" select="1+$count"/>
                <xsl:with-param name="colnums" select="substring-after($colnums,',')"/>
                <xsl:with-param name="location" select="$location"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="columnheader">
        <xsl:param name="posit"/>
        <xsl:param name="location"/>
        <xsl:variable name="ID">
            <xsl:call-template name="getID"/>
        </xsl:variable>
        <xsl:variable name="name">
            <xsl:call-template name="getName"/>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="$posit = $urlColumnNum">
                <th class="unsortable" id="{$ID}_{$posit}_{$location}">
                    <xsl:value-of select="$name"/>
                </th>
            </xsl:when>
            <xsl:otherwise>
                <th onclick="{$sortCallback}(this)" id="{$ID}_{$posit}_{$location}">
                    <xsl:attribute name="title">
                        <xsl:variable name="descr"
                         select="DESCRIPTION|vo:DESCRIPTION|v1:DESCRIPTION|v2:DESCRIPTION|v3:DESCRIPTION|v4:DESCRIPTION"/>
                        <xsl:choose>
                            <xsl:when test="$descr">
                                <xsl:value-of select="concat($descr,' (click to sort)')"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="concat('Click to sort by ',$name)"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:attribute>
                    <xsl:if test="translate($ID,$lc,$uc)=translate($sortName,$lc,$uc)">
                        <xsl:attribute name="class">
                            <xsl:value-of select="$sortOrder"/>
                        </xsl:attribute>
                    </xsl:if>
                    <xsl:value-of select="$name"/>
                </th>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="prefix-header">
        <xsl:param name="location"/>
        <xsl:choose>
            <xsl:when test="$renderPrefixColumn = 1">
                <th>
                    select
                </th>
            </xsl:when>
            <xsl:when test="$renderPrefixColumn = 2">
                <th>
                </th>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    
    <!-- recursive template to loop over fields in columnOrder -->
    
    <xsl:template name="filterIter">
        <xsl:param name="count"/>
        <xsl:param name="colnums"/>
        <xsl:if test="$colnums and $count &lt;= $maxColumns">
            <xsl:variable name="posit" select="number(substring-before($colnums,','))"/>
            <xsl:for-each select="$fieldlist[position()=$posit]">
                <xsl:call-template name="filterbox">
                    <xsl:with-param name="posit" select="$posit"/>
                </xsl:call-template>
            </xsl:for-each>
            <xsl:call-template name="filterIter">
                <xsl:with-param name="count" select="1+$count"/>
                <xsl:with-param name="colnums" select="substring-after($colnums,',')"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="filterbox">
        <xsl:param name="posit"/>
        <td>
            <xsl:if test="$posit != $urlColumnNum and (@datatype='char' or not(@arraysize)  or @arraysize=1)">
                <xsl:variable name="isChar" select="@datatype='char' or @datatype='string'"/>
                <xsl:variable name="defaultComment">
                	<xsl:choose>
                		<xsl:when test="$isChar">String</xsl:when>
						<xsl:otherwise>Number</xsl:otherwise>
					</xsl:choose>
                </xsl:variable>
                <xsl:variable name="filterSep" select="concat('|',$posit,':')"/>
                <input type="hidden" name="vovfilter{$posit}_type" value="{$isChar}"/>
                <input type="text" name="vovfilter{$posit}">
                    <xsl:attribute name="title">
                        <xsl:choose>
                            <xsl:when test="$isChar">String: abc (exact match) or *ab*c* , ! to negate</xsl:when>
                            <xsl:otherwise>Number: 10 or >=10 or 10..20 for a range , ! to negate</xsl:otherwise>
                        </xsl:choose>
                    </xsl:attribute>
                    <xsl:attribute name="value">
                        <xsl:choose>
                        	<xsl:when test="contains($filterText,$filterSep)">
                            	<xsl:value-of select="substring-before(substring-after($filterText,$filterSep),'|')"/>
                        	</xsl:when>
                        	<xsl:otherwise>
                        		<xsl:value-of select="$defaultComment"/>
                        	</xsl:otherwise>
                        </xsl:choose>
                    </xsl:attribute>
                    <xsl:attribute name="class">
                        <xsl:choose>
                        	<xsl:when test="contains($filterText,$filterSep)">filter</xsl:when>
                        	<xsl:otherwise>filter defaultComment</xsl:otherwise>
                        </xsl:choose>						
					</xsl:attribute>                    
                    <xsl:attribute name="onclick">
                    	<xsl:value-of select="$clickClearCallback"/>(this, '<xsl:value-of select="$defaultComment"/>');
                    </xsl:attribute>
                    <xsl:attribute name="onblur">
                    	<xsl:value-of select="$clickResetCallback"/>(this, '<xsl:value-of select="$defaultComment"/>');
                    </xsl:attribute>
                </input>
            </xsl:if>
        </td>
    </xsl:template>
    
    <xsl:template name="prefix-filter">
        <xsl:param name="location"/>
        <xsl:choose>
            <xsl:when test="$renderPrefixColumn = 1">
                <td title="Click to select all rows" class="bbox">
                    <xsl:attribute name="onclick">
                        <xsl:value-of select="$selectAllRowsCallback"/>(this);
                    </xsl:attribute>
                    <input type="hidden" name="select_all_rows">
                        <xsl:attribute name="value">
                            <xsl:value-of select="$selectAllList"/>
                        </xsl:attribute>
                    </input>
                    <xsl:value-of select="$selectAllLabel"/>
                </td>
            </xsl:when>
            <xsl:when test="$renderPrefixColumn = 2">
                <td>
                </td>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="processRow">
        <xsl:param name="TDlist"/>
        <xsl:param name="format"/>
        <xsl:param name="selector"/>
        
        <xsl:call-template name="prefix-column">
            <xsl:with-param name="ident" select="$selector"/>
            <xsl:with-param name="format" select="$format"/>
        </xsl:call-template>
        <xsl:call-template name="columnIter">
            <xsl:with-param name="count" select="1"/>
            <xsl:with-param name="colnums" select="concat($columnOrder,',')"/>
            <xsl:with-param name="TDlist" select="$TDlist"/>
        </xsl:call-template>
        <td class="odd"></td>
        <td class="odd"></td>
    </xsl:template>
    
    <xsl:template name="prefix-column">
        <xsl:param name="ident"/>
        <xsl:param name="format"/>
        
        <xsl:choose>
            <xsl:when test="$renderPrefixColumn = 1">
                <td>
                    <input id="cb-{$ident}" type="checkbox" name="cb-{$ident}" value="cb-{$ident}">
                        <xsl:variable name="isSelected">
                            <xsl:call-template name="isSelected">
                                <xsl:with-param name="selector" select="$ident"/>
                            </xsl:call-template>
                        </xsl:variable>
                        <xsl:if test="$isSelected = $selectedvalue">
                            <xsl:attribute name="checked"/>
                        </xsl:if>
                    </input>
                    <label for="cb-{$ident}">
                    </label>
                </td>
            </xsl:when>
            <xsl:when test="$renderPrefixColumn = 2">
                <td>
                </td>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    
    <!-- recursive template to loop over columns in columnOrder -->
    
    <xsl:template name="columnIter">
        <xsl:param name="count"/>
        <xsl:param name="colnums"/>
        <xsl:param name="TDlist"/>
        <xsl:if test="$colnums and $count &lt;= $maxColumns">
            <xsl:variable name="posit" select="number(substring-before($colnums,','))"/>
            <xsl:for-each select="$TDlist[position()=$posit]">
                <xsl:call-template name="processColumn">
                    <xsl:with-param name="TDlist" select="$TDlist"/>
                    <xsl:with-param name="posit" select="$posit"/>
                </xsl:call-template>
            </xsl:for-each>
            <xsl:call-template name="columnIter">
                <xsl:with-param name="count" select="1+$count"/>
                <xsl:with-param name="colnums" select="substring-after($colnums,',')"/>
                <xsl:with-param name="TDlist" select="$TDlist"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="processColumn">
        <xsl:param name="TDlist"/>
        <xsl:param name="posit"/>
        <td>
            <!--
            For show and debugging
            -->
            <xsl:attribute name='val'>
                <xsl:value-of select="@val"/>
            </xsl:attribute>
            <xsl:choose>
                <xsl:when test="$posit = $urlColumnNum">
                    <xsl:call-template name="processURL">
                        <xsl:with-param name="TDlist" select="$TDlist"/>
                    </xsl:call-template>
                </xsl:when>
                <xsl:when test="$posit = $decColumnNum">
                    <xsl:call-template name="processSex">
                        <xsl:with-param name="precision" select="$decPrecision"/>
                        <xsl:with-param name="scale" select="'1'"/>
                    </xsl:call-template>
                </xsl:when>
                <xsl:when test="$posit = $raColumnNum">
                    <xsl:call-template name="processSex">
                        <xsl:with-param name="precision" select="$raPrecision"/>
                        <xsl:with-param name="scale" select="'15'"/>
                    </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                    <!-- Trim long columns (need to make this show full text if clicked)  -->
                    <xsl:choose>
                        <xsl:when test="substring(.,101) and not(contains(.,'&lt;'))">
                            <xsl:value-of select="concat(substring(.,1,97),'...')"/>
                        </xsl:when>
                        <!--
                        added the arraysize check to make them show up on
                        the same line when there was an array
                        some people may prefer the other way
                        -->
                        <xsl:when test="contains('|float|int|double|',concat('|',$fieldlist[position()=$posit]/@datatype,'|')) and not($fieldlist[position()=$posit]/@arraysize)">
                            <xsl:value-of select="."/>
                        </xsl:when>
                        <xsl:otherwise>
                            <!-- replace spaces with non-breaking spaces -->
                            <xsl:call-template name="replace"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
        </td>
    </xsl:template>
    
    <xsl:template name="replace">
        <xsl:param name="text-string" select="."/>
        <xsl:param name="find-word" select="' '"/>
        <xsl:param name="replace-with" select="'&#160;'"/>
        <xsl:choose>
            <xsl:when test="contains($text-string,$find-word)">
                <xsl:call-template name="replace">
                    <xsl:with-param name="text-string" select="concat(substring-before($text-string,$find-word),$replace-with,substring-after($text-string,$find-word))"/>
                    <xsl:with-param name="find-word" select="$find-word"/>
                    <xsl:with-param name="replace-with" select="$replace-with"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$text-string"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    
    <xsl:template name="processURL">
        <xsl:param name="TDlist"/>
        <xsl:variable name="format" select="$TDlist[position()=$formatColumnNum]"/>
        <xsl:variable name="href" select="normalize-space(.)"/>
        <xsl:variable name="sformat" select="translate(substring-after($format,'/'),$lc,$uc)"/>
        <xsl:variable name="label">
            <xsl:choose>
                <xsl:when test="$sformat">
                    <xsl:value-of select="$sformat"/>
                </xsl:when>
                <xsl:otherwise>Link</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <a href="{$href}" target="_blank">
            <xsl:value-of select="$label"/>
        </a>
    </xsl:template>
    
    <!-- Convert to sexagesimal format dd:mm:ss -->
    
    <xsl:template name="processSex">
        <xsl:param name="precision">10</xsl:param>
        <xsl:param name="scale">1</xsl:param>
        <xsl:variable name="original">
            <xsl:choose>
                <xsl:when test="@val">
                    <xsl:value-of select="translate(@val,'+','')"/>
                </xsl:when>
                <xsl:otherwise>
                    <!-- Some tables have a leading + which causes problems, so remove it -->
                    <xsl:value-of select="translate(.,'+','')"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="string-length(normalize-space($original)) &gt; 0">
                <xsl:variable name="numb" select="number($original)"/>
                <xsl:variable name="absnumb"
                 select="round((1-2*($numb &lt; 0))*$numb*3600*$precision div $scale + 0.5)"/>
                
                <xsl:variable name="degr"
                 select="floor($absnumb div (3600*$precision))"/>
                
                <xsl:variable name="mn"
                 select="floor(($absnumb - $degr*3600*$precision) div (60*$precision))"/>
                <xsl:variable name="sc"
                 select="($absnumb - $precision*(3600*$degr + 60*$mn)) div $precision"/>
                <xsl:if test="$numb &lt; 0">-</xsl:if>
                <xsl:value-of select="concat(format-number($degr,'00'), $sexSeparator, format-number($mn,'00'), $sexSeparator, format-number($sc, '00.0##'))"/>
            </xsl:when>
            <xsl:otherwise>
                ---
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <!--
    Returns $selectedvalue if the selector is in the comma-delimited
    list of selectedRows.
    Stupid Xpath 1.0 does not have the $*(#@ ends-with function, so have to
    check that by hand.
    -->
    
    <xsl:variable name="selectedvalue">selectedimage</xsl:variable>
    
    <xsl:template name="isSelected">
        <xsl:param name="selector"/>
        <xsl:if test="$selectedRows">
            <xsl:choose>
                <xsl:when test="$selector = $selectedRows or contains($selectedRows,concat(',',$selector,',')) or starts-with($selectedRows,concat($selector,','))">
                    <xsl:value-of select="$selectedvalue"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:call-template name="endswithSelected">
                        <xsl:with-param name="selector" select="concat(',',$selector)"/>
                        <xsl:with-param name="sparam" select="$selectedRows"/>
                    </xsl:call-template>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="endswithSelected">
        <xsl:param name="selector"/>
        <xsl:param name="sparam"/>
        <xsl:if test="contains($sparam,$selector)">
            <xsl:variable name="tail" select="substring-after($sparam,$selector)"/>
            <xsl:choose>
                <xsl:when test="$tail">
                    <xsl:call-template name="endswithSelected">
                        <xsl:with-param name="selector" select="$selector"/>
                        <xsl:with-param name="sparam" select="$tail"/>
                    </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="$selectedvalue"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
    </xsl:template>
    
</xsl:stylesheet>
