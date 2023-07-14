/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function() {
    "use strict";

    return {
    	//IDs
    	UploadPageWorklistSmartTableID: "fin.ap.invoice.upload.SmartTable",
    	UploadPageWorklistTableID: "fin.ap.invoice.upload.table",
    	FileUploaderID: "fin.ap.invoice.upload.Uploader",
    	DownloadDialogFragmentID: "fin.ap.invoice.upload.view.DownloadDialog",
    	MessageDialogFragmentID: "fin.ap.invoice.upload.view.MessageDialog",
    	DownloadLanguageDropdownID: "fin.ap.invoice.upload.download.languageDropdown",
    	DownloadRadioButtonID: "fin.ap.invoice.upload.download.Excel",
    	DownloadRadioButtonGroupID: "fin.ap.invoice.upload.radioButtonGroup",
    	MessageTableID: "fin.ap.invoice.upload.MessageTable",
    	MessageSmartTableID: "fin.ap.invoice.upload.ErrorMsg.SmartTable",
    	MessageTableTitleID: "fin.ap.invoice.upload.DispalyMessage.TableTitle",
    	//Entity
    	UploadEntitySet: "/FilesContentForUpload",
    	
    	/*
    	    Enhancement for 1802:
    	 */
    	EditDialogFragmentID: "fin.ap.invoice.upload.view.EditDialog",
    	CalendarFragmentID: "fin.ap.invoice.upload.view.Calendar",
    	
    	//Field ID of Mass Change Dialog:
    	PostingDateID: "fin.ap.invoice.upload.edit.PostingDate",
    	DocumentDateID: "fin.ap.invoice.upload.edit.DocumentDate",
    	InvoicingPartyID: "fin.ap.invoice.upload.edit.InvoicingParty",
    	DocumentTypeID: "fin.ap.invoice.upload.edit.DocumentType",
    	PaymentTermID: "fin.ap.invoice.upload.edit.PaymentTerm",
    	HeaderTextID: "fin.ap.invoice.upload.edit.HeaderText",
    	ItemTextID: "fin.ap.invoice.upload.edit.ItemText",
    	//Dropdown list value:
    	KeepExistingValue: "1",
    	LeaveBlank: "2",
    	UseValueHelp: "3",
    	SelectNewDate: "4",
    	ComboBoxUserInput: "",
    	SelectUserInput: "0"
    	
    	  
    };
});