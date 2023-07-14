/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/format/DateFormat"
], function(DateFormat) {
	"use strict";

	return {
		mediumStyleDateTime: function(date) {
			if (date && Object.prototype.toString.call(date) === Object.prototype.toString.call(new Date())) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					style: "medium"
				});
				return oDateFormat.format(date);
			}
			return "";
		},

		mediumStyleDate: function(date) {
			if (date && Object.prototype.toString.call(date) === Object.prototype.toString.call(new Date())) {
				var oDateFormat = DateFormat.getDateInstance({
					style: "medium"
				});
				return oDateFormat.format(date);
			}
			return "";
		},

		DraftStatusIconFormat: function(sDraftStatus) {
			if (sDraftStatus) {
				if (sDraftStatus === "1") {
					return "sap-icon://message-success";
				} else if (sDraftStatus === "2") {
					return "sap-icon://alert";
				} else {
					return "sap-icon://message-information";
				}
			} else {
				return "sap-icon://message-information";
			}
		},
		
		DraftStatusStateFormat: function(sDraftStatus) {
			if (sDraftStatus) {
				if (sDraftStatus === "1") {
					return sap.ui.core.MessageType.Success;
				} else if (sDraftStatus === "2") {
					return sap.ui.core.MessageType.Error;
				} else {
					return sap.ui.core.MessageType.None;
				}
			} else {
				return sap.ui.core.MessageType.None;
			}
		},
		
		DraftStatusTextFormat: function(sDraftStatus) {
			if (sDraftStatus) {
				if (sDraftStatus === "1") {
					return this.getResourceBundle().getText("Success");
				} else if (sDraftStatus === "2") {
					return this.getResourceBundle().getText("Error");
				} else {
					return this.getResourceBundle().getText("Initial");
				}
			} else {
				return this.getResourceBundle().getText("Initial");
			}
		},
		
		StatusCodeFormat: function(sCode, sDraft) {
			if(!sCode && ! sDraft){
				return "";
			} else if( sDraft === "10"){
				return this.getResourceBundle().getText("Draft");
			} else if(sCode === "A"){
				return this.getResourceBundle().getText("Status_A");
			} else if(sCode === "B"){
				return this.getResourceBundle().getText("Status_B");
			} else if(sCode === "C"){
				return this.getResourceBundle().getText("Status_C");
			} else if(sCode === "D"){
				return this.getResourceBundle().getText("Status_D");
			} else if(sCode === "E"){
				return this.getResourceBundle().getText("Status_E");
			} else {
				return "";
			}
		},
		
		InvoiceWithYear:function(sNum,sYear) {
			if(!sNum){
				return "";
			} else if(!sYear){
				return sNum;
			} else {
				return sNum + "/" + sYear;
			}
		}

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		// numberUnit: function(sValue) {
		// 	if (!sValue) {
		// 		return "";
		// 	}
		// 	return parseFloat(sValue).toFixed(2);
		// }

	};

});