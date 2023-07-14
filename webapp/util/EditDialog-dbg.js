/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"fin/ap/invoice/upload/util/ValueHelp",
	"fin/ap/invoice/upload/util/Constants"

], function(Object, MessageBox, ValueHelp, Constants) {
	"use strict";

	return Object.extend("fin.ap.invoice.upload.util.EditDialog", {

		_oController: undefined,
		_aEntry: [],
		_aFieldName: ["PostingDate", "DocumentDate", "InvoicingParty", "DocumentType", "PaymentTerm", "HeaderText"],
		_aField: {}, // Store the each field object( Dropdown Object, isComboBox,isDate, OldKey, OldValue )

		_oDefaultDateFormat: undefined,
		_oDateFormatyyyymmdd: undefined,

		constructor: function(oController, aEntry) {
			this._oController = oController;
			this._aEntry = aEntry;
		}, 

		init: function() {

			for (var i = 0; i < this._aFieldName.length; i++) {
				this._init(this._aFieldName[i]);
			}

			this._oDefaultDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				style: 'medium'
				// UTC: true
			});

			this._oDateFormatyyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyyMMdd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
		},

		_init: function(sFieldName) {

			var sFieldId = sFieldName + "ID";
			var oDropdown = this._oController.byId(Constants[sFieldId]);
			var bComboBox, bDate;

			oDropdown.setName(sFieldName);
			if (sFieldName === "PostingDate" || sFieldName === "DocumentDate") {
				bComboBox = false;
				bDate = true;
			} else {
				bComboBox = true;
				bDate = false;
			}

			var oField = {
				// Name: sFieldName,
				oDropdown: oDropdown,
				isComboBox: bComboBox,
				isDate: bDate,
				OldKey: Constants.KeepExistingValue,
				OldValue: this._oController.getResourceBundle().getText("Keep")
			};

			this._aField[sFieldName] = oField;
		},

		onPostingDateSelectionChange: function(oEvent) {
			this._onSelectionChange(oEvent);
			this.onChange(oEvent);
		},

		onDocumentDateSelectionChange: function(oEvent) {
			this._onSelectionChange(oEvent);
			this.onChange(oEvent);
		},

		onInvoicePartySelectionChange: function(oEvent) {
			var aColName = ["LAND1", "MCOD3", "SORTL", "MCOD1", "LIFNR", "BUKRS"];
			this._onSelectionChange(oEvent, "VHInvoicingParty", "VL_SH_ODATA_KREDI", "LIFNR", aColName);
		},

		onDocumentTypeSelectionChange: function(oEvent) {
			var aColName = ["BLART", "LTEXT"];
			this._onSelectionChange(oEvent, "VHDocumentType", "VL_SH_FAP_T003", "BLART", aColName);
		},

		onPaymentTermSelectionChange: function(oEvent) {
			var aColName = ["PAYMENTTERMS", "PAYMENTTERMSNAME"];
			this._onSelectionChange(oEvent, "VHPaymentTerm", "VL_SH_ODATA_ZTERM", "PAYMENTTERMS", aColName);
		},

		onHeaderTextSelectionChange: function(oEvent) {
			this._onSelectionChange(oEvent);
		},

		_onSelectionChange: function(oEvent, sVHEntitySetName, sVHEntityTypeName, sVHFieldName, aVHColName) {
			var oController = this._oController;
			var oDropdown = oEvent.getSource();
			var sSelectedKey = oDropdown.getProperty("selectedKey");

			switch (sSelectedKey) {
				case Constants.UseValueHelp:
					{
						var oValueHelp = new ValueHelp(oController, this, oDropdown, sVHEntitySetName, sVHEntityTypeName, sVHFieldName, aVHColName);
						oValueHelp.openValueHelp();
						break;
					}

				case Constants.SelectNewDate:
					{
						if (!this._oCalendarPopover) {
							this._oCalendarPopover = sap.ui.xmlfragment(this._oController.getView().getId(), Constants.CalendarFragmentID, this);
							this._oController.getView().addDependent(this._oCalendarPopover);
						}
						jQuery.sap.delayedCall(0, this, function() {
							this._oCalendarPopover.openBy(oDropdown);
						});
						break;
					}

				default:
					break;
			}
		},

		onChange: function(oEvent) {
			var oDropdown = oEvent.getSource();
			var sSelectedKey = oDropdown.getProperty("selectedKey");
			var sFieldName = oDropdown.getName();
			var oUIModel = this._oController.getView().getModel("ui");

			//Clear the value state first
			oDropdown.setValueState(sap.ui.core.ValueState.None);
			oDropdown.setValueStateText();
            oUIModel.setProperty("/editOkBtnEnabled", true);
            
			switch (sSelectedKey) {

				default: {
					this.storeFieldOldKeyValue(sFieldName, sSelectedKey, oDropdown.getItemByKey(sSelectedKey).getText());
					break;
				}

				case Constants.ComboBoxUserInput:
					{
						//Check the length of ComboBox Input
						this._checkInputLength(oDropdown, sFieldName);
						this.storeFieldOldKeyValue(sFieldName, sSelectedKey, oDropdown.getValue());
						break;
					}
				case Constants.UseValueHelp:
					// should not save the old key, as it is the temp state
					// value would be overwritten by value from value help
						break;
				case Constants.SelectNewDate:
					// should not save the old key, as it is the temp state
					// value would be overwritten by value from date picker
						break;

			}
		},

		_checkInputLength: function(oDropdown, sFieldName) {
            var oUIModel = this._oController.getView().getModel("ui");
			var sEntityTypeName = "MassChange";
			var sFieldPath = "/#" + sEntityTypeName + "/" + sFieldName + "/@maxLength";
			var sFieldValue = oDropdown.getValue();
			var sFieldValueNew = sFieldValue.trim();
			var nLength = sFieldValueNew.length;
			var nMaxLength = this._oController.oDataModel.getProperty(sFieldPath);

			if (nLength > nMaxLength) {
				// Length too long
				oDropdown.setValueState(sap.ui.core.ValueState.Error);
				oDropdown.setValueStateText(this._oController.getResourceBundle().getText("InputLong", nMaxLength));
				oUIModel.setProperty("/editOkBtnEnabled", false);
			} else if (sFieldValue !== sFieldValueNew) {
				// Text with whitespaces
				oDropdown.setValue(sFieldValueNew);
				oDropdown.setValueState(sap.ui.core.ValueState.Warning);
				oDropdown.setValueStateText(this._oController.getResourceBundle().getText("RemoveWhitespace"));
			}
			if (nLength === 0) {
				// No user input => Leave Blank
				oDropdown.setSelectedKey(Constants.LeaveBlank);
				oDropdown.setValue(oDropdown.getItemByKey(Constants.LeaveBlank).getText());
			}

		},

		onCancelPress: function(oEvent) {
			this._oController._oEditDialog.close();
		},

		onOkPress: function() {
			var that = this;
			// var aSelectedItems = this._oController._oWorklistTable.getSelectedItems();

			var fnSetParameter = function(sFieldName, oParameter) {

				var oField = that._aField[sFieldName];
				var sFieldKey = oField.oDropdown.getSelectedKey();

				var fnSetFieldValue = function( oField ) {
					var oDropdown = oField.oDropdown;
					var sFieldValue = (oField.isComboBox) ? oDropdown.getValue() : oDropdown.getItemByKey(sFieldKey).getText();
					if (oField.isDate) {
						var oDate = that._oDefaultDateFormat.parse(sFieldValue, true);
						sFieldValue = that._oDateFormatyyyymmdd.format(oDate);
					}
					return sFieldValue;
				};

				switch (sFieldKey) {
					case Constants.ComboBoxUserInput:
						{
							oParameter[sFieldName] = fnSetFieldValue(oField);
							break;
						}
					case Constants.SelectUserInput:
						{
							oParameter[sFieldName] = fnSetFieldValue(oField);
							break;
						}

					case Constants.LeaveBlank:
						{
							oParameter[sFieldName] = "";
							break;
						}

					default:
						break;
				}

				return oParameter;

			};

			var oUpdateParameter = {};

			for (var i = 0; i < this._aFieldName.length; i++) {
				var sFieldName = this._aFieldName[i];
				oUpdateParameter = fnSetParameter(sFieldName, oUpdateParameter);
			}

			this._oController._oEditDialog.close();
			if ((!jQuery.isEmptyObject(oUpdateParameter)) 
			// && aSelectedItems.length > 0
			) {
				// if no field is set, don't send the request, or most fields would be cleared.
				this._oController._doActionSelectedDocuments("Update", this._aEntry, "" , oUpdateParameter );
			}

		},

		storeFieldOldKeyValue: function(sFieldName, sKey, sValue) {
			//Keep the changed old key and value info 
			this._aField[sFieldName].OldKey = sKey;
			this._aField[sFieldName].OldValue = sValue;
		},

		setBackFieldOldKeyValue: function(sFieldName) {
			var oField = this._aField[sFieldName];
			var oDropdown = oField.oDropdown;
			if (oField.isComboBox) {
				oDropdown.setSelectedKey(oField.OldKey);
				oDropdown.setValue(oField.OldValue);
			} else {
				oDropdown.getItemByKey(oField.OldKey).setText(oField.OldValue);
				oDropdown.setSelectedKey(oField.OldKey);
			}
		},

		beforeCalendarPopoverClose: function(oEvent) {
			var oSelect = oEvent.getParameters().openBy;
			var sFieldName = oSelect.getName();

			if (this._sSelectedDate) {
				// User select the date
				if (!oSelect.getItemByKey(Constants.SelectUserInput)) {
					//Item with Key not created yet.
					var oItem = new sap.ui.core.Item({
						key: Constants.SelectUserInput,
						text: this._sSelectedDate
					});
					oSelect.addItem(oItem);
				} else {
					//Item with Key exists, update the corresponding text
					oSelect.getItemByKey(Constants.SelectUserInput).setText(this._sSelectedDate);
				}

				oSelect.setSelectedKey(Constants.SelectUserInput);
				this.storeFieldOldKeyValue(sFieldName, Constants.SelectUserInput, this._sSelectedDate);

			} else {
				// User cancel the date selection
				this.setBackFieldOldKeyValue(sFieldName);
			}
			//Clear the global varible
			this._sSelectedDate = "";
		},

		handleCalendarSelect: function(oEvent) {
			var oCalendar = oEvent.getSource();
			var aSelectedDates = oCalendar.getSelectedDates();
			if (aSelectedDates.length > 0) {
				var oDate = aSelectedDates[0].getStartDate();
				this._sSelectedDate = this._oDefaultDateFormat.format(oDate);
			}
			this._oCalendarPopover.close();
		}

	});

});