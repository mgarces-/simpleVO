<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:vo="http://www.ivoa.net/xml/VOTable/v1.1"
	xmlns:v1="http://vizier.u-strasbg.fr/VOTable" xmlns:v2="http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd"
	xmlns:v3="http://www.ivoa.net/xml/VOTable/v1.0" xmlns:v4="http://www.ivoa.net/xml/VOTable/v1.2"
	exclude-result-prefixes="vo v1 v2 v3 v4">

	<xsl:output method="xml" />
    <xsl:variable name="fieldlist" select="/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD"/>
	<xsl:variable name="ncolumns" select="count($fieldlist)"/>

	<xsl:variable name="isNumberList">
		<xsl:call-template name="getNumberList"/>
	</xsl:variable>
	
	<xsl:template name="getNumberList">
		<xsl:param name="colCounter" select="1"/>
		<xsl:if test="contains('|float|double|int|',concat('|',$fieldlist[position()=$colCounter]/@datatype,'|'))">
			|<xsl:value-of select="$colCounter"/>|
		</xsl:if>
		<xsl:if test="$colCounter &lt; $ncolumns">
            <xsl:call-template name="getNumberList">
                <xsl:with-param name="colCounter" select="$colCounter+1"/>
            </xsl:call-template>		
		</xsl:if>
	</xsl:template>
		
	<xsl:template
		match="TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA">
		<xsl:copy><!-- copy the TABLEDATA element -->
			<xsl:for-each select="TR|vo:TR|v1:TR|v2:TR|v3:TR|v4:TR">
				<xsl:variable name="vovid" select="position()" />
				<xsl:copy><!-- copy the TR element -->
					<xsl:attribute name="vovid">
						<xsl:value-of select="$vovid" /> 
					</xsl:attribute>
					<xsl:for-each select="TD|vo:TD|v1:TD|v2:TD|v3:TD|v4:TD">
						<xsl:variable name="posit" select="position()" />
						<xsl:choose>
							<xsl:when
								test="contains($isNumberList,concat('|',$posit,'|'))">
								<xsl:copy>
									<xsl:attribute name="val">
                           				<xsl:call-template name="SciNum">
                              				<xsl:with-param name="num" select="." />
                           				</xsl:call-template>
                        			</xsl:attribute>
									<!-- apparently must do attribute first -->
									<xsl:value-of select="." />
								</xsl:copy>
							</xsl:when>
							<xsl:otherwise>
								<xsl:copy><!-- copy just the TD element -->
									<xsl:value-of select="." />
								</xsl:copy>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:for-each>
				</xsl:copy>
				<xsl:value-of select="string('&#xA;')" />
			</xsl:for-each>
		</xsl:copy>
	</xsl:template>

	<xsl:strip-space
		elements="TABLEDATA vo:TABLEDATA v1:TABLEDATA v2:TABLEDATA v3:TABLEDATA v4:TABLEDATA" />

	<!-- standard copy template -->
	<xsl:template match="@*|node()">
		<xsl:copy>
			<xsl:apply-templates select="@*" />
			<xsl:apply-templates />
		</xsl:copy>
	</xsl:template>

	<xsl:template name="SciNum">
		<xsl:param name="num" />
		<!-- Get rid of +.  They cause problems is xslt1.0. -->
		<xsl:variable name="input" select="translate($num, 'E+', 'e')" />
		<xsl:choose>
			<xsl:when test="contains($input, 'e')">
				<xsl:variable name="man" select="substring-before($input,'e')" />
				<xsl:variable name="exp" select="substring-after($input,'e')" />
				<xsl:variable name="power">
					<xsl:call-template name="PowersOf10">
						<xsl:with-param name="exponent" select="$exp"/>
					</xsl:call-template>
				</xsl:variable>
				<!-- Offset depends on what we included above -->
				<xsl:value-of select="$man * $power" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="translate($num, '+', '')" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="PowersOf10">
		<xsl:param name="exponent"/>
		<xsl:choose>
			 <xsl:when test="$exponent=-9">0.000000001</xsl:when>
			 <xsl:when test="$exponent=-8">0.00000001</xsl:when>
			 <xsl:when test="$exponent=-7">0.0000001</xsl:when>
			 <xsl:when test="$exponent=-6">0.000001</xsl:when>
			 <xsl:when test="$exponent=-5">0.00001</xsl:when>
			 <xsl:when test="$exponent=-4">0.0001</xsl:when>
			 <xsl:when test="$exponent=-3">0.001</xsl:when>
			 <xsl:when test="$exponent=-2">0.01</xsl:when>
			 <xsl:when test="$exponent=-1">0.1</xsl:when>
			  <xsl:when test="$exponent=0">1</xsl:when>
			  <xsl:when test="$exponent=1">10</xsl:when>
			  <xsl:when test="$exponent=2">100</xsl:when>
			  <xsl:when test="$exponent=3">1000</xsl:when>
			  <xsl:when test="$exponent=4">10000</xsl:when>
			  <xsl:when test="$exponent=5">100000</xsl:when>
			  <xsl:when test="$exponent=6">1000000</xsl:when>
			  <xsl:when test="$exponent=7">10000000</xsl:when>
			  <xsl:when test="$exponent=8">100000000</xsl:when>
			  <xsl:when test="$exponent=9">1000000000</xsl:when>
			 <xsl:when test="$exponent=10">10000000000</xsl:when>
			 <xsl:when test="$exponent=11">100000000000</xsl:when>
			 <xsl:when test="$exponent=12">1000000000000</xsl:when>
			 <xsl:when test="$exponent=13">10000000000000</xsl:when>
			 <xsl:when test="$exponent=14">100000000000000</xsl:when>
			 <xsl:when test="$exponent=15">1000000000000000</xsl:when>
			 <xsl:when test="$exponent=16">10000000000000000</xsl:when>
			 <xsl:when test="$exponent=17">100000000000000000</xsl:when>
			 <xsl:when test="$exponent=18">1000000000000000000</xsl:when>
			 <xsl:when test="$exponent=19">10000000000000000000</xsl:when>
			 <xsl:when test="$exponent=20">100000000000000000000</xsl:when>
			 <xsl:when test="$exponent=21">1000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=22">10000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=23">100000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=24">1000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=25">10000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=26">100000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=27">1000000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=28">10000000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=29">100000000000000000000000000000</xsl:when>
			 <xsl:when test="$exponent=30">1000000000000000000000000000000</xsl:when>
			<xsl:when test="$exponent=-30">0.000000000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-29">0.00000000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-28">0.0000000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-27">0.000000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-26">0.00000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-25">0.0000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-24">0.000000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-23">0.00000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-22">0.0000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-21">0.000000000000000000001</xsl:when>
			<xsl:when test="$exponent=-20">0.00000000000000000001</xsl:when>
			<xsl:when test="$exponent=-19">0.0000000000000000001</xsl:when>
			<xsl:when test="$exponent=-18">0.000000000000000001</xsl:when>
			<xsl:when test="$exponent=-17">0.00000000000000001</xsl:when>
			<xsl:when test="$exponent=-16">0.0000000000000001</xsl:when>
			<xsl:when test="$exponent=-15">0.000000000000001</xsl:when>
			<xsl:when test="$exponent=-14">0.00000000000001</xsl:when>
			<xsl:when test="$exponent=-13">0.0000000000001</xsl:when>
			<xsl:when test="$exponent=-12">0.000000000001</xsl:when>
			<xsl:when test="$exponent=-11">0.00000000001</xsl:when>
			<xsl:when test="$exponent=-10">0.0000000001</xsl:when>
			 <xsl:otherwise>0</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>

