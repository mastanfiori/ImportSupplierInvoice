/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"fin/ap/invoice/upload/util/Constants"

], function(Object, Constants) {
	"use strict";

	return Object.extend("fin.ap.invoice.upload.util.ValueHelp", {
	
	_oController: undefined,
	_oEditComboBox: undefined,
	_sEntitySetName: undefined,
	_sEntityTypeName: undefined,
	_sEntityPath: undefined,
	_sVHFieldName: undefined,
	_aColFieldName: [],
	_sTitle: undefined,
	_aColumnList: [],
	

    constructor: function(oController, oEditDialog, oEditComboBox, sEntitySetName, sEntityTypeName, sVHFieldName, aColumnFieldName) {
        sap.ui.base.Object.apply(this);
        this._oController  = oController;  
        this._oEditDialog = oEditDialog;
        this._oEditComboBox = oEditComboBox;
        this._sEntitySetName = sEntitySetName;
        this._sEntityTypeName = sEntityTypeName;
        this._sVHFieldName = sVHFieldName;
        this._aColFieldName = aColumnFieldName;
        this._sEntityPath = "/" + sEntitySetName;
    },

    openValueHelp: function(oEvent) {
        var that = this;
        
        var sTitlePath = "/#" + this._sEntityTypeName + "/" + this._sVHFieldName + "/@sap:label";
        var sTitle = this._oController.getOwnerComponent().getModel().getProperty( sTitlePath );
        var sFieldName = that._oEditComboBox.getName();
        /* dialog creation */
        var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
            title: sTitle,
            modal: true,
            supportMultiselect: false,
            supportRanges: false,
            supportRangesOnly: false,

            ok: function(oControlEvent) {
                // Store all values of selected row
                var tokens = oControlEvent.getParameter("tokens");
                if (tokens && tokens.length > 0) {
                   var oResult = tokens[0].getCustomData()[0].getValue();
                   
                    // Update the key and value for the combo box
                   that._oEditComboBox.setSelectedKey(Constants.ComboBoxUserInput);
                   that._oEditComboBox.setValue( oResult[that._sVHFieldName] );
                   that._oEditDialog.storeFieldOldKeyValue( sFieldName, Constants.ComboBoxUserInput, oResult[that._sVHFieldName]);
                }
                
                this.close();
            },
            cancel: function() {
                
                that._oEditDialog.setBackFieldOldKeyValue(sFieldName);      
                this.close();
            },
            afterClose: function() {
                this.destroy();
            }
        });
        
        /* columns in search help */
        var oColModel = new sap.ui.model.json.JSONModel();
        var aColList = [];
        var oCol, sLabel;
        
        for( var i = 0; i < that._aColFieldName.length; i++ ){
        	sLabel = "/#" + that._sEntityTypeName + "/" + that._aColFieldName[i] + "/@sap:label";
        	oCol ={
        	  label: that._oController.getOwnerComponent().getModel().getProperty( sLabel ),
        	  template: that._aColFieldName[i]
        	};
        	aColList.push( oCol );
        }
        oColModel.setData({
        	cols: aColList
        });
        oValueHelpDialog.setModel(oColModel, "columns");
        oValueHelpDialog.setModel(this._oController.getOwnerComponent().getModel());
        /* binding to back-end */
       
        oValueHelpDialog.getTable().bindRows(this._sEntityPath);
        // oValueHelpDialog.getTable().getBinding().sort(
        //     new sap.ui.model.Sorter("BankShortKey")
        // );

        /* search functionality common for both general and advanced search */
        var fnSearch = function(event) {
            var aSmartFilters = event.getSource().getFilters();
			var oParameters = event.getSource().getParameters();
            oValueHelpDialog.getTable().bindRows({
                path: that._sEntityPath,
                filters: aSmartFilters,
                parameters: oParameters
            });
        };

        /* smart filter bar automatically creates advanced search options based on properties of oData entity that are marked as filterable */
        var oSmartFilterBar = new sap.ui.comp.smartfilterbar.SmartFilterBar({
            advancedMode : true,
            expandAdvancedArea: true,
            entitySet : that._sEntitySetName,
            basicSearchFieldName: that._sVHFieldName,
            enableBasicSearch: true,

            search: function(event) {
                fnSearch(event);
            }
        });


        oValueHelpDialog.setFilterBar(oSmartFilterBar);

        // var FilterData = {
        //     "LAND1":  undefined, 
        //     "MCOD3":  undefined
        // };
        
        // /* set filters based on screen */
        // oSmartFilterBar.setFilterData(FilterData);
        // oSmartFilterBar.fireSearch();

        /* adjust looks of the dialog */
        oValueHelpDialog.addStyleClass("sapUiSizeCompact");
        oValueHelpDialog.setContentWidth("85%");
        oValueHelpDialog.setVerticalScrolling(false);

        oValueHelpDialog.open();
      }
		
	});

});